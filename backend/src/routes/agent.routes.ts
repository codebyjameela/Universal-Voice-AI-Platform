import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { VoiceAgent } from '../agents/voice-agent.js';
import { PRESET_DOMAINS } from '../domains/domain.types.js';

const agentInteractSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  domainId: z.string().optional(),
  sessionId: z.string().default('default-session'),
});

// Cache agents per session
const activeAgents: Map<string, VoiceAgent> = new Map();

export async function agentRoutes(fastify: FastifyInstance) {
  fastify.post('/interact', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = agentInteractSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Invalid agent request', details: parse.error.errors });
    }

    const { message, domainId, sessionId } = parse.data;

    let agent = activeAgents.get(sessionId);
    if (!agent) {
      agent = new VoiceAgent({ sessionId });
      activeAgents.set(sessionId, agent);
    }

    if (domainId) {
      const domain = PRESET_DOMAINS.find((d) => d.id === domainId);
      if (domain) {
        agent.setDomain(domain);
      }
    }

    try {
      const result = await agent.processUserInput(message);
      return reply.send(result);
    } catch (err: any) {
      fastify.log.error(err);
      const statusCode = err.statusCode || (err.name === 'OpenRouterConfigError' ? 401 : 500);
      return reply.status(statusCode).send({
        error: 'Agent interaction failed',
        code: err.code || 'OPENROUTER_ERROR',
        message: err.message,
      });
    }
  });
}
