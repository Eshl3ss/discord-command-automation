const CURRENT_USER_URL = 'https://discord.com/api/v10/users/@me';

function normalizeToken(token) {
  const value = String(token ?? '').trim();

  if (!value) {
    throw new Error('DISCORD_TOKEN is empty');
  }

  if (/^Bearer(?:\s+|$)/iu.test(value)) {
    throw new Error('OAuth2 Bearer credentials are not accepted; use an official bot token');
  }

  const normalized = value.replace(/^Bot(?:\s+|$)/iu, '').trim();
  if (!normalized) {
    throw new Error('DISCORD_TOKEN does not contain a token value');
  }

  return normalized;
}

export function assertOfficialBotIdentity(identity) {
  if (!identity || identity.bot !== true || typeof identity.id !== 'string') {
    throw new Error('Discord credential does not identify an official bot account');
  }

  return identity;
}

export async function validateOfficialBotToken(token, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('This Node.js runtime cannot perform bot-token verification');
  }

  const normalizedToken = normalizeToken(token);
  let response;

  try {
    response = await fetchImpl(CURRENT_USER_URL, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bot ${normalizedToken}`,
      },
      signal: options.signal ?? AbortSignal.timeout(options.timeoutMs ?? 10_000),
    });
  } catch {
    throw new Error('Could not reach Discord to verify the official bot token');
  }

  if (!response?.ok) {
    throw new Error('Discord rejected the credential as an official bot token');
  }

  let identity;
  try {
    identity = await response.json();
  } catch {
    throw new Error('Discord returned an invalid bot-identity response');
  }

  return assertOfficialBotIdentity(identity);
}
