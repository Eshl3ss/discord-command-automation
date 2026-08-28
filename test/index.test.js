import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { Events } from 'discord.js';
import { start } from '../src/index.js';

const env = {
  DISCORD_TOKEN: 'fake-rejected-credential',
  SERVER_ID: 'server',
  CHANNEL_ID: 'channel',
  AUTHORIZED_USER_ID: 'user',
};

const logger = { info() {}, warn() {}, error() {} };

test('does not create a Gateway client when bot-token preflight fails', async () => {
  let clientCreated = false;
  const exitCodes = [];

  await start({
    env,
    logger,
    fetchImpl: async () => ({ ok: false, status: 401 }),
    createClient: () => {
      clientCreated = true;
      throw new Error('Gateway client must not be created');
    },
    setExitCode: (code) => exitCodes.push(code),
  });

  assert.equal(clientCreated, false);
  assert.deepEqual(exitCodes, [1]);
});

test('does not contact Discord or create a client for Bearer credentials', async () => {
  let fetchCalled = false;
  let clientCreated = false;
  const exitCodes = [];

  await start({
    env: { ...env, DISCORD_TOKEN: 'Bearer fake-user-access-token' },
    logger,
    fetchImpl: async () => {
      fetchCalled = true;
    },
    createClient: () => {
      clientCreated = true;
    },
    setExitCode: (code) => exitCodes.push(code),
  });

  assert.equal(fetchCalled, false);
  assert.equal(clientCreated, false);
  assert.deepEqual(exitCodes, [1]);
});

test('creates and logs in the Gateway client only after official bot verification', async () => {
  class FakeClient extends EventEmitter {
    loginTokens = [];

    async login(token) {
      this.loginTokens.push(token);
      this.emit(Events.ClientReady, {
        user: { id: 'bot-id', tag: 'case-study-bot', bot: true },
      });
    }

    destroy() {}
  }

  const client = new FakeClient();
  const exitCodes = [];
  await start({
    env: { ...env, DISCORD_TOKEN: 'fake-official-bot-token' },
    logger,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ id: 'bot-id', bot: true }),
    }),
    createClient: () => client,
    setExitCode: (code) => exitCodes.push(code),
  });

  assert.deepEqual(client.loginTokens, ['fake-official-bot-token']);
  assert.deepEqual(exitCodes, []);
});
