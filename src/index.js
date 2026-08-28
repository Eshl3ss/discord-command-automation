import { pathToFileURL } from 'node:url';
import { Client, GatewayIntentBits } from 'discord.js';
import { loadConfig } from './config.js';
import { configureClient } from './runtime.js';
import { validateOfficialBotToken } from './tokenValidator.js';

function createDiscordClient() {
  return new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });
}

export async function start(options = {}) {
  const logger = options.logger ?? console;
  const setExitCode = options.setExitCode ?? ((code) => {
    process.exitCode = code;
  });
  let config;

  try {
    config = loadConfig(options.env);
  } catch (error) {
    logger.error(`Configuration error: ${error.message}`);
    setExitCode(1);
    return;
  }

  logger.info('Verifying official Discord bot token...');
  try {
    await validateOfficialBotToken(config.token, { fetchImpl: options.fetchImpl });
  } catch (error) {
    logger.error(`Bot-token verification failed: ${error.message}`);
    setExitCode(1);
    return;
  }

  const client = (options.createClient ?? createDiscordClient)();
  configureClient(client, config, { logger, setExitCode });

  logger.info('Starting Discord bot...');
  try {
    await client.login(config.token);
  } catch (error) {
    logger.error('Discord login failed:', error);
    setExitCode(1);
  }
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) void start();
