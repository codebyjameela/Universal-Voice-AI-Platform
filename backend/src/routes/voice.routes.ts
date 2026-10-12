import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { VoiceAgent } from '../agents/voice-agent.js';
import { env } from '../config/env.js';
import { PRESET_DOMAINS } from '../domains/domain.types.js';
import { STTFactory } from '../voice/stt/stt-factory.js';
import { TTSFactory } from '../voice/tts/tts-factory.js';

const transcribeSchema = z.object({
  audioBase64: z.string().min(1, 'Audio base64 data is required'),
  mimeType: z.string().default('audio/webm'),
  language: z.string().default('en'),
});

const pipelineSchema = z.object({
  transcript: z.string().optional(),
  audioBase64: z.string().optional(),
  domainId: z.string().optional(),
  sessionId: z.string().default('voice-session-default'),
});

const voiceAgents: Map<string, VoiceAgent> = new Map();

export async function voiceRoutes(fastify: FastifyInstance) {
  // Voice config endpoint
  fastify.get('/config', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      sttProvider: env.STT_PROVIDER,
      ttsProvider: env.TTS_PROVIDER,
      browserSpeechRecognitionSupported: true,
      browserSpeechSynthesisSupported: true,
    });
  });

  // Server audio transcription endpoint
  fastify.post('/transcribe', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = transcribeSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Invalid audio payload', details: parse.error.errors });
    }

    const { audioBase64, mimeType, language } = parse.data;
    const provider = STTFactory.getProvider(env.STT_PROVIDER === 'browser' ? 'mock' : env.STT_PROVIDER);

    try {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const transcript = await provider.transcribe({
        buffer: audioBuffer,
        mimeType,
        language,
      });

      return reply.send({ transcript });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Transcription failed', message: err.message });
    }
  });

  /**
   * Complete Voice Pipeline:
   * Audio/Transcript -> STT -> OpenRouter Agent -> TTS Configuration
   */
  fastify.post('/pipeline', async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = pipelineSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: 'Invalid voice pipeline payload', details: parse.error.errors });
    }

    let { transcript, audioBase64, domainId, sessionId } = parse.data;

    // 1. If raw audio was sent instead of transcript, run STT
    if (!transcript && audioBase64) {
      const sttProvider = STTFactory.getProvider(env.STT_PROVIDER === 'browser' ? 'mock' : env.STT_PROVIDER);
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const sttResult = await sttProvider.transcribe({
        buffer: audioBuffer,
        mimeType: 'audio/webm',
      });
      transcript = sttResult.text;
    }

    if (!transcript) {
      return reply.status(400).send({ error: 'Either transcript or audioBase64 must be provided' });
    }

    // 2. Get or create VoiceAgent instance
    let agent = voiceAgents.get(sessionId);
    if (!agent) {
      agent = new VoiceAgent({ sessionId });
      voiceAgents.set(sessionId, agent);
    }

    const domain = PRESET_DOMAINS.find((d) => d.id === domainId) || PRESET_DOMAINS[0];
    agent.setDomain(domain);

    // 3. Process through OpenRouter Agent (with RAG, Tools, Memory)
    try {
      const agentResponse = await agent.processUserInput(transcript);

      // 4. Return complete Voice Pipeline response
      return reply.send({
        userTranscript: transcript,
        aiResponse: agentResponse.answer,
        modelUsed: agentResponse.modelUsed,
        domain: domain.name,
        voice: domain.voice,
        language: domain.language,
        sourcesUsed: agentResponse.sourcesUsed,
        toolsCalled: agentResponse.toolsCalled,
        latencyMs: agentResponse.latencyMs,
        usage: agentResponse.usage,
      });
    } catch (err: any) {
      fastify.log.error(err);
      const statusCode = err.statusCode || (err.name === 'OpenRouterConfigError' ? 401 : 500);
      return reply.status(statusCode).send({
        error: 'Voice AI generation failed',
        code: err.code || 'OPENROUTER_ERROR',
        message: err.message,
      });
    }
  });
}
