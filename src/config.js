import 'dotenv/config';

const REQUIRED_KEYS = ['DISCORD_TOKEN', 'SERVER_ID', 'CHANNEL_ID', 'AUTHORIZED_USER_ID'];

function required(name, env) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parseDelay(value) {
  if (value === undefined || value.trim() === '') return 0;
  const delay = Number(value);
  if (!Number.isSafeInteger(delay) || delay < 0) {
    throw new Error('ACTION_DELAY_MS must be a non-negative whole number');
  }
  return delay;
}

export function loadConfig(env = process.env) {
  for (const key of REQUIRED_KEYS) required(key, env);
  return Object.freeze({
    token: required('DISCORD_TOKEN', env),
    serverId: required('SERVER_ID', env),
    channelId: required('CHANNEL_ID', env),
    authorizedUserId: required('AUTHORIZED_USER_ID', env),
    trigger: env.TRIGGER?.trim() || ',with all',
    actionOne: env.ACTION_ONE?.trim() || ',rob uid',
    actionTwo: env.ACTION_TWO?.trim() || ',dep all',
    actionDelayMs: parseDelay(env.ACTION_DELAY_MS),
  });
}
