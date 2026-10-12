import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { env, isOpenRouterConfigured } from '../config/env.js';
import { openRouterProvider } from '../openrouter/openrouter.provider.js';

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export async function aiRoutes(fastify: FastifyInstance) {
  /**
   * Health / Status check for OpenRouter connection
   */
  fastify.get('/status', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      status: 'ok',
      provider: 'openrouter',
      configured: isOpenRouterConfigured(),
      defaultModel: env.OPENROUTER_MODEL,
      fallbackModel: env.OPENROUTER_FALLBACK_MODEL,
      message: isOpenRouterConfigured()
        ? 'OpenRouter is configured and ready.'
        : 'OpenRouter API key is not configured. Set OPENROUTER_API_KEY in backend/.env',
    });
  });

  /**
   * List available models directly from OpenRouter
   */
  fastify.get('/models', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const models = await openRouterProvider.getAvailableModels();
      return reply.send({
        success: true,
        count: models.length,
        models,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        success: false,
        error: 'Failed to retrieve models from OpenRouter',
        details: err.message,
      });
    }
  });

  /**
   * STEP 6: Simple Chat endpoint
   * POST /api/ai/chat
   * Input: { "message": "Hello" }
   * Output: { "response": "Hello! How can I help you?" }
   */
  fastify.post('/chat', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = chatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request payload',
        details: parseResult.error.errors,
      });
    }

    const { message, model, systemPrompt, temperature } = parseResult.data;

    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      messages.push({ role: 'user', content: message });

      const aiResponse = await openRouterProvider.generate({
        model: model || env.OPENROUTER_MODEL,
        fallbackModel: env.OPENROUTER_FALLBACK_MODEL,
        messages,
        temperature: temperature ?? 0.7,
      });

      return reply.send({
        response: aiResponse.content,
        model: aiResponse.modelUsed,
        latencyMs: aiResponse.latencyMs,
        usage: aiResponse.usage,
        isFallbackUsed: aiResponse.isFallbackUsed,
      });
    } catch (err: any) {
      fastify.log.error(err);
      const statusCode = err.statusCode || (err.name === 'OpenRouterConfigError' ? 401 : 500);
      return reply.status(statusCode).send({
        error: 'AI generation failed',
        code: err.code || 'OPENROUTER_ERROR',
        message: err.message,
      });
    }
  });

  /**
   * Streaming endpoint for real-time response SSE
   */
  fastify.post('/chat/stream', async (req: FastifyRequest, reply: FastifyReply) => {
    const parseResult = chatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request payload',
        details: parseResult.error.errors,
      });
    }

    const { message, model, systemPrompt, temperature } = parseResult.data;

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: message });

      const stream = openRouterProvider.stream({
        model: model || env.OPENROUTER_MODEL,
        messages,
        temperature: temperature ?? 0.7,
      });

      for await (const chunk of stream) {
        reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    } catch (err: any) {
      fastify.log.error(err);
      reply.raw.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      reply.raw.end();
    }
  });
}
