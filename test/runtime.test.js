import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { Events } from 'discord.js';
import { configureClient } from '../src/runtime.js';

class FakeClient extends EventEmitter {
  destroyed = false;

  destroy() {
    this.destroyed = true;
  }
}

const config = {
  serverId: 'server',
  channelId: 'channel',
  authorizedUserId: 'user',
  trigger: ',with all',
  actionOne: ',rob uid',
  actionTwo: ',dep all',
  actionDelayMs: 0,
};

const logger = { info() {}, warn() {}, error() {} };

test('disconnects a simulated personal account at the ready event', () => {
  const client = new FakeClient();
  const exitCodes = [];
  configureClient(client, config, {
    logger,
    setExitCode: (code) => exitCodes.push(code),
  });

  client.emit(Events.ClientReady, {
    user: { id: 'personal-user-id', tag: 'person', bot: false },
  });

  assert.equal(client.destroyed, true);
  assert.deepEqual(exitCodes, [1]);
});

test('allows a simulated official bot identity to become ready', () => {
  const client = new FakeClient();
  const exitCodes = [];
  configureClient(client, config, {
    logger,
    setExitCode: (code) => exitCodes.push(code),
  });

  client.emit(Events.ClientReady, {
    user: { id: 'bot-id', tag: 'case-study-bot', bot: true },
  });

  assert.equal(client.destroyed, false);
  assert.deepEqual(exitCodes, []);
});

test('does not process messages before bot identity is confirmed', async () => {
  const client = new FakeClient();
  const sent = [];
  configureClient(client, config, { logger });
  const messageListener = client.listeners(Events.MessageCreate)[0];

  await messageListener({
    guildId: 'server',
    channelId: 'channel',
    content: ',with all',
    author: { id: 'user', bot: false },
    channel: { send: async (value) => sent.push(value) },
  });

  assert.deepEqual(sent, []);
});
