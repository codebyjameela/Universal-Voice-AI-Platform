import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { PRESET_DOMAINS, DomainConfiguration } from '../domains/domain.types.js';

const domainsStore: Map<string, DomainConfiguration> = new Map(
  PRESET_DOMAINS.map((d) => [d.id, d])
);

const domainCreateSchema = z.object({
  domain: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  targetAudience: z.string().default('General audience'),
  assistantName: z.string().min(1),
  persona: z.string().min(1),
  tone: z.enum(['friendly', 'professional', 'encouraging', 'concise', 'authoritative', 'empathetic']).default('friendly'),
  language: z.string().default('English'),
  voice: z.string().default('alloy'),
  instructions: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  responseLength: z.enum(['concise', 'balanced', 'detailed']).default('concise'),
  enabledTools: z.array(z.string()).default([]),
});

export async function domainRoutes(fastify: FastifyInstance) {
  // List all domains
  fastify.get('/', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      domains: Array.from(domainsStore.values()),
    });
  });

  // Get domain by ID
  fastify.get('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const domain = domainsStore.get(req.params.id);
    if (!domain) {
      return reply.status(404).send({ error: 'Domain not found' });
    }
    return reply.send({ domain });
  });

  // Create new custom domain
  fastify.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = domainCreateSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Invalid domain configuration', details: parse.error.errors });
    }

    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newDomain: DomainConfiguration = {
      id,
      ...parse.data,
      knowledgeBaseIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    domainsStore.set(id, newDomain);
    return reply.status(201).send({ domain: newDomain });
  });
}
