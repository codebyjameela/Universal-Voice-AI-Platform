import { env, isOpenRouterConfigured } from '../config/env.js';
import { openRouterProvider } from '../openrouter/openrouter.provider.js';

async function main() {
  console.log('======================================================');
  console.log('🧪 OPENROUTER CONNECTION VERIFICATION TEST');
  console.log('======================================================');
  console.log(`Endpoint: ${env.OPENROUTER_BASE_URL}`);
  console.log(`Configured Model: ${env.OPENROUTER_MODEL}`);
  console.log(`Fallback Model: ${env.OPENROUTER_FALLBACK_MODEL}`);
  console.log(`API Key Set: ${isOpenRouterConfigured() ? '✅ YES' : '⚠️ NO (Placeholder detected)'}`);
  console.log('------------------------------------------------------');

  console.log('\n1. Testing model list retrieval from OpenRouter...');
  try {
    const models = await openRouterProvider.getAvailableModels();
    console.log(`✅ Retrieved ${models.length} models successfully!`);
    console.log(`Sample models available:`);
    models.slice(0, 5).forEach((m) => {
      console.log(`   - [${m.tier?.toUpperCase() || 'BALANCED'}] ${m.id} (${m.name})`);
    });
  } catch (err: any) {
    console.error(`❌ Model listing failed: ${err.message}`);
  }

  console.log('\n2. Testing chat completion via OpenRouterProvider: generate({ messages: [{ role: "user", content: "Hello" }] })');
  try {
    const startTime = Date.now();
    const response = await openRouterProvider.generate({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    console.log(`✅ Chat generation succeeded!`);
    console.log(`   Model Used: ${response.modelUsed}`);
    console.log(`   Latency: ${response.latencyMs}ms`);
    console.log(`   Response Content: "${response.content}"`);
    if (response.usage) {
      console.log(`   Token Usage: Prompt=${response.usage.promptTokens}, Completion=${response.usage.completionTokens}, Total=${response.usage.totalTokens}`);
    }
  } catch (err: any) {
    console.error(`❌ Chat generation failed: ${err.message}`);
  }

  console.log('\n======================================================');
  console.log('Verification Complete.');
  console.log('======================================================');
}

main().catch(console.error);
