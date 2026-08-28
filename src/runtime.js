import { Events } from 'discord.js';
import { createMessageHandler } from './messageHandler.js';
import { assertOfficialBotIdentity } from './tokenValidator.js';

export function configureClient(client, config, options = {}) {
  const logger = options.logger ?? console;
  const setExitCode = options.setExitCode ?? ((code) => {
    process.exitCode = code;
  });
  const handleMessage = createMessageHandler(config, { logger });
  let officialBotReady = false;

  client.once(Events.ClientReady, (readyClient) => {
    try {
      assertOfficialBotIdentity(readyClient.user);
    } catch (error) {
      logger.error(`Safety check failed: ${error.message}. Disconnecting.`);
      client.destroy();
      setExitCode(1);
      return;
    }

    officialBotReady = true;
    logger.info(`Ready as ${readyClient.user.tag}.`);
    logger.info(`Listening only in server ${config.serverId}, channel ${config.channelId}.`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (!officialBotReady) return;
    await handleMessage(message);
  });
  client.on(Events.Error, (error) => logger.error('Discord client error:', error));
  client.on(Events.Warn, (warning) => logger.warn('Discord client warning:', warning));

  const shutdown = (signal) => {
    logger.info(`${signal} received; shutting down.`);
    client.destroy();
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}
