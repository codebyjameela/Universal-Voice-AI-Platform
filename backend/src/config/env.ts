import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  HOST: z.string().default('0.0.0.0'),
  APP_URL: z.string().default('http://localhost:3000'),

  // OpenRouter (Primary LLM Engine)
  OPENROUTER_API_KEY: z.string().default(''),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().default('openrouter/auto'),
  OPENROUTER_FALLBACK_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct'),

  // Storage
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/voice_ai_db'),
  VECTOR_DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/voice_ai_db'),

  // Voice Providers
  STT_PROVIDER: z.string().default('browser'),
  STT_API_KEY: z.string().default(''),
  TTS_PROVIDER: z.string().default('browser'),
  TTS_API_KEY: z.string().default(''),

  // Security
  JWT_SECRET: z.string().default('dev-jwt-secret-key-32-chars-minimum-voice-platform'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export function getActiveOpenRouterKey(): string {
  const currentKey = (process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || '').trim();
  const isPlaceholder =
    !currentKey ||
    currentKey === 'your_key_here' ||
    currentKey === 'your_actual_api_key' ||
    currentKey === 'your_openrouter_api_key_here' ||
    currentKey.startsWith('your_');

  if (!isPlaceholder) {
    return currentKey;
  }

  // Attempt hot-reloading from .env file
  try {
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
    const freshKey = (process.env.OPENROUTER_API_KEY || '').trim();
    if (
      freshKey &&
      freshKey !== 'your_key_here' &&
      freshKey !== 'your_actual_api_key' &&
      freshKey !== 'your_openrouter_api_key_here' &&
      !freshKey.startsWith('your_')
    ) {
      env.OPENROUTER_API_KEY = freshKey;
      return freshKey;
    }
  } catch {
    // Ignore error reading file
  }

  return '';
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(getActiveOpenRouterKey());
}
