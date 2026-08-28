import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeMessage } from '../src/normalizer.js';

test('normalizes case and whitespace', () => {
  assert.equal(normalizeMessage('  ,WiTh   ALL\n'), ',with all');
});

test('handles empty values', () => assert.equal(normalizeMessage(undefined), ''));
