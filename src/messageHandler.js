import { normalizeMessage } from './normalizer.js';

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export function createMessageHandler(config, options = {}) {
  const wait = options.wait ?? sleep;
  const logger = options.logger ?? console;
  const normalizedTrigger = normalizeMessage(config.trigger);

  return async function handleMessage(message) {
    if (message.author?.bot) return;
    if (message.guildId !== config.serverId) return;
    if (message.channelId !== config.channelId) return;
    if (message.author?.id !== config.authorizedUserId) return;
    if (normalizeMessage(message.content) !== normalizedTrigger) return;

    try {
      await message.channel.send(config.actionOne);
      if (config.actionDelayMs > 0) await wait(config.actionDelayMs);
      await message.channel.send(config.actionTwo);
      logger.info(`Completed configured actions for message ${message.id ?? '(unknown)'}.`);
    } catch (error) {
      logger.error('Failed to send configured actions:', error);
    }
  };
}
