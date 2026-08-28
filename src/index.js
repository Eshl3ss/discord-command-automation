import { Client, Events, GatewayIntentBits } from 'discord.js';
import { loadConfig } from './config.js';
import { createMessageHandler } from './messageHandler.js';

function start() {
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    console.error(`Configuration error: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.info(`Ready as ${readyClient.user.tag}.`);
    console.info(`Listening only in server ${config.serverId}, channel ${config.channelId}.`);
  });
  client.on(Events.MessageCreate, createMessageHandler(config));
  client.on(Events.Error, (error) => console.error('Discord client error:', error));
  client.on(Events.Warn, (warning) => console.warn('Discord client warning:', warning));

  const shutdown = (signal) => {
    console.info(`${signal} received; shutting down.`);
    client.destroy();
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  console.info('Starting Discord bot...');
  client.login(config.token).catch((error) => {
    console.error('Discord login failed:', error);
    process.exitCode = 1;
  });
}

start();
