import { buildApp } from './app.js';
import { env, isOpenRouterConfigured } from './config/env.js';

async function startServer() {
  const app = buildApp();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`\n======================================================`);
    console.log(`🚀 Universal Voice AI Platform Backend is running!`);
    console.log(`📡 URL: ${address}`);
    console.log(`🤖 Intelligence Layer: OpenRouter (https://openrouter.ai/api/v1)`);
    console.log(`🔑 OpenRouter Configured: ${isOpenRouterConfigured() ? '✅ YES' : '⚠️ NO (See .env)'}`);
    console.log(`🎯 Default Model: ${env.OPENROUTER_MODEL}`);
    console.log(`🛡️ Fallback Model: ${env.OPENROUTER_FALLBACK_MODEL}`);
    console.log(`======================================================\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer();
