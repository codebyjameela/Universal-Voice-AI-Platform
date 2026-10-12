import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import Fastify, { FastifyInstance } from 'fastify';
import { aiRoutes } from './routes/ai.routes.js';
import { domainRoutes } from './routes/domain.routes.js';
import { agentRoutes } from './routes/agent.routes.js';
import { voiceRoutes } from './routes/voice.routes.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : true,
  });

  // Register core plugins
  app.register(sensible);
  app.register(cors, {
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Health and system status
  app.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  app.get('/', async () => {
    return {
      name: 'Universal Voice AI Platform API',
      version: '1.0.0',
      intelligenceProvider: 'OpenRouter (https://openrouter.ai/api/v1)',
      endpoints: {
        chat: 'POST /api/ai/chat',
        stream: 'POST /api/ai/chat/stream',
        models: 'GET /api/ai/models',
        status: 'GET /api/ai/status',
        voicePipeline: 'POST /api/voice/pipeline',
        voiceTranscribe: 'POST /api/voice/transcribe',
        health: 'GET /health',
      },
    };
  });

  // Register domain & AI routes
  app.register(aiRoutes, { prefix: '/api/ai' });
  app.register(domainRoutes, { prefix: '/api/domains' });
  app.register(agentRoutes, { prefix: '/api/agent' });
  app.register(voiceRoutes, { prefix: '/api/voice' });

  return app;
}
