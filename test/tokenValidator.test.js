import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertOfficialBotIdentity,
  validateOfficialBotToken,
} from '../src/tokenValidator.js';

test('accepts an identity returned through explicit Bot authentication', async () => {
  const requests = [];
  const identity = await validateOfficialBotToken('fake.bot.token', {
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        json: async () => ({ id: 'bot-id', username: 'case-study-bot', bot: true }),
      };
    },
  });

  assert.equal(identity.id, 'bot-id');
  assert.equal(requests[0].url, 'https://discord.com/api/v10/users/@me');
  assert.equal(requests[0].options.headers.Authorization, 'Bot fake.bot.token');
});

test('rejects OAuth2 Bearer credentials without making a request', async () => {
  let called = false;
  await assert.rejects(
    validateOfficialBotToken('Bearer fake-user-access-token', {
      fetchImpl: async () => {
        called = true;
      },
    }),
    /Bearer credentials are not accepted/,
  );
  assert.equal(called, false);
});

test('rejects credentials that Discord does not accept as Bot authentication', async () => {
  await assert.rejects(
    validateOfficialBotToken('fake-personal-token-or-api-key', {
      fetchImpl: async () => ({ ok: false, status: 401 }),
    }),
    /rejected the credential as an official bot token/,
  );
});

test('rejects a non-bot identity even after a successful response', async () => {
  await assert.rejects(
    validateOfficialBotToken('fake-token', {
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ id: 'personal-user-id', bot: false }),
      }),
    }),
    /does not identify an official bot account/,
  );
});

test('identity assertion requires both a bot flag and an ID', () => {
  assert.throws(() => assertOfficialBotIdentity({ bot: true }), /official bot account/);
});

test('rejects an empty token after removing an optional Bot prefix', async () => {
  await assert.rejects(
    validateOfficialBotToken('Bot ', { fetchImpl: async () => ({ ok: true }) }),
    /does not contain a token value|empty/,
  );
});

test('network errors do not include the credential in the error message', async () => {
  const secret = 'fake-secret-that-must-not-appear';
  await assert.rejects(
    validateOfficialBotToken(secret, {
      fetchImpl: async () => {
        throw new Error(`request failed with ${secret}`);
      },
    }),
    (error) => !error.message.includes(secret),
  );
});
