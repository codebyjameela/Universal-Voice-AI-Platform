import { OpenRouterClient, OpenRouterConfigError, OpenRouterApiError } from '../openrouter/openrouter.client.js';

async function runTests() {
  console.log('============================================================');
  console.log('🧪 OPENROUTER INTEGRATION TESTS (REAL SERVICE & ERROR TESTS)');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // TEST 1: Missing / Unconfigured API Key MUST throw OpenRouterConfigError (Not an echo response!)
  console.log('Test 1: Unconfigured API key throws OpenRouterConfigError...');
  try {
    const unconfiguredClient = new OpenRouterClient({
      apiKey: '', // empty key
    });

    await unconfiguredClient.chatCompletion({
      messages: [{ role: 'user', content: 'What is the weather right now?' }],
    });
    assert(false, 'Should have thrown OpenRouterConfigError when API key is empty');
  } catch (err: any) {
    assert(
      err instanceof OpenRouterConfigError || err.code === 'OPENROUTER_CONFIG_ERROR',
      `Correctly threw OpenRouterConfigError: "${err.message.slice(0, 70)}..."`
    );
  }

  // TEST 2: Placeholder API Key ("your_key_here") MUST throw OpenRouterConfigError
  console.log('\nTest 2: Placeholder API key ("your_key_here") throws OpenRouterConfigError...');
  try {
    const placeholderClient = new OpenRouterClient({
      apiKey: 'your_key_here',
    });

    await placeholderClient.chatCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    assert(false, 'Should have thrown OpenRouterConfigError for placeholder key');
  } catch (err: any) {
    assert(
      err instanceof OpenRouterConfigError || err.code === 'OPENROUTER_CONFIG_ERROR',
      `Correctly rejected placeholder key: "${err.message.slice(0, 60)}..."`
    );
  }

  // TEST 3: Mock HTTP 401 Unauthorized handling from OpenRouter
  console.log('\nTest 3: Handles HTTP 401 Unauthorized from OpenRouter...');
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: { message: 'Invalid API key provided' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

    const clientWithFakeKey = new OpenRouterClient({
      apiKey: 'sk-or-v1-invalid-sample-key-12345678901234567890',
    });

    await clientWithFakeKey.chatCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    assert(false, 'Should have thrown 401 error');
  } catch (err: any) {
    assert(
      err.statusCode === 401 && err.message.includes('401'),
      `Correctly converted 401 into OpenRouterApiError: "${err.message.slice(0, 70)}..."`
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  // TEST 4: Successful OpenRouter Completion (choices[0].message.content)
  console.log('\nTest 4: Reads genuine answer from choices[0].message.content (NOT echoing user input)...');
  try {
    const fakeAiAnswer = 'Kerala has a tropical climate with lush monsoons from June to August and pleasant winters.';
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          id: 'gen-test-123',
          model: 'meta-llama/llama-3.3-70b-instruct',
          choices: [
            {
              message: {
                role: 'assistant',
                content: fakeAiAnswer,
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 42,
            completion_tokens: 28,
            total_tokens: 70,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

    const client = new OpenRouterClient({
      apiKey: 'sk-or-v1-test-valid-key-abcdefghijklmnopqrstuvwxyz',
    });

    const userInput = 'What is the climate of Kerala?';
    const res = await client.chatCompletion({
      messages: [{ role: 'user', content: userInput }],
    });

    assert(res.content === fakeAiAnswer, 'Successfully extracted choices[0].message.content');
    assert(res.content !== userInput, 'Response is a genuine AI generation, NOT an echo of user input');
    assert(res.modelUsed === 'meta-llama/llama-3.3-70b-instruct', 'Model correctly recorded');
    assert(res.usage?.totalTokens === 70, 'Token metrics parsed correctly');
  } finally {
    globalThis.fetch = originalFetch;
  }

  // TEST 5: Fallback model attempt on primary model 500 error
  console.log('\nTest 5: Fallback model triggered when primary model returns 500...');
  try {
    let callCount = 0;
    globalThis.fetch = async (url: any, opts: any) => {
      callCount++;
      const body = JSON.parse(opts.body);
      if (body.model === 'primary-failing-model') {
        return new Response(JSON.stringify({ error: 'Internal provider outage' }), { status: 500 });
      }
      return new Response(
        JSON.stringify({
          model: 'fallback-model',
          choices: [{ message: { role: 'assistant', content: 'Fallback model response' } }],
        }),
        { status: 200 }
      );
    };

    const client = new OpenRouterClient({
      apiKey: 'sk-or-v1-test-key-1234567890123456789012345',
      defaultModel: 'primary-failing-model',
      fallbackModel: 'fallback-model',
    });

    const res = await client.chatCompletion({
      messages: [{ role: 'user', content: 'Test fallback' }],
    });

    assert(callCount === 2, 'Attempted primary model then fallback model');
    assert(res.isFallbackUsed === true, 'isFallbackUsed flag marked true');
    assert(res.content === 'Fallback model response', 'Fallback model generated content');
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log('\n============================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
