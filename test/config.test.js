import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config.js';

const required = { DISCORD_TOKEN: 'bot-token', SERVER_ID: 'server', CHANNEL_ID: 'channel', AUTHORIZED_USER_ID: 'user' };

test('loads defaults', () => {
  const config = loadConfig(required);
  assert.equal(config.trigger, ',with all');
  assert.equal(config.actionOne, ',rob uid');
  assert.equal(config.actionTwo, ',dep all');
  assert.equal(config.actionDelayMs, 0);
});

test('rejects an invalid delay', () => {
  assert.throws(() => loadConfig({ ...required, ACTION_DELAY_MS: '-1' }), /non-negative whole number/);
});

test('requires credentials and scope IDs', () => {
  assert.throws(() => loadConfig({}), /DISCORD_TOKEN/);
});
