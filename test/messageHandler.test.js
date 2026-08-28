import assert from 'node:assert/strict';
import test from 'node:test';
import { createMessageHandler } from '../src/messageHandler.js';

const config = { serverId: 'server', channelId: 'channel', authorizedUserId: 'user', trigger: ',with all', actionOne: ',rob uid', actionTwo: ',dep all', actionDelayMs: 25 };

function makeMessage(overrides = {}) {
  const sent = [];
  return { sent, message: { id: 'message', guildId: 'server', channelId: 'channel', content: ' ,WITH   all ', author: { id: 'user', bot: false }, channel: { send: async (value) => sent.push(value) }, ...overrides } };
}

test('sends both actions sequentially after a normalized match', async () => {
  const { message, sent } = makeMessage();
  const waits = [];
  const handler = createMessageHandler(config, { wait: async (duration) => waits.push(duration), logger: { info() {}, error() {} } });
  await handler(message);
  assert.deepEqual(sent, [',rob uid', ',dep all']);
  assert.deepEqual(waits, [25]);
});

for (const [name, overrides] of [
  ['bots', { author: { id: 'user', bot: true } }],
  ['other servers', { guildId: 'other' }],
  ['other channels', { channelId: 'other' }],
  ['other users', { author: { id: 'other', bot: false } }],
  ['other messages', { content: ',different' }],
]) {
  test(`ignores ${name}`, async () => {
    const { message, sent } = makeMessage(overrides);
    await createMessageHandler(config, { wait: async () => {}, logger: { info() {}, error() {} } })(message);
    assert.deepEqual(sent, []);
  });
}
