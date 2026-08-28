# Discord Command Automation

A small, deliberately restricted Discord.js v14 bot for Node.js 20+. When one authorized user posts a configured trigger in one configured server channel, the bot sends two configured messages in sequence.

This project supports **official Discord bot accounts only**. It does not support self-bots, personal user tokens, or automating a normal Discord account. Self-bots violate Discord's terms and can result in account termination.

## Behavior

The bot acts only when the author is not a bot, the server/channel/user IDs exactly match the configured IDs, and the normalized message equals `TRIGGER`. Normalization trims the text, collapses repeated whitespace, and ignores case.

The default trigger is `,with all`. A match sends `ACTION_ONE` (default `,rob uid`), optionally waits for `ACTION_DELAY_MS`, and then sends `ACTION_TWO` (default `,dep all`).

> Before using automation with another bot or service, confirm that its rules permit automated commands. This project does not bypass platform restrictions or third-party terms.

## Requirements

- Node.js 20 or newer
- A Discord application with an official bot user
- Permission to add that bot to the target server

## Bot-only credential safeguards

The program does not rely on a token-shaped regular expression. Token formats can change, and appearance alone does not prove which type of account owns a credential. Instead, startup uses Discord's supported authentication behavior:

1. OAuth2 credentials beginning with `Bearer` are rejected locally.
2. Before creating a Gateway client, the credential is sent to Discord's **Get Current User** endpoint using an explicit `Authorization: Bot ...` header.
3. Discord must accept that Bot authentication and return an identity containing both an ID and `bot: true`.
4. The connected Gateway identity is checked again when the client becomes ready. A non-bot identity is immediately disconnected and the process fails.
5. Messages remain disabled until that ready-time bot check succeeds.

Consequently, a personal token, OAuth2 user credential, random API key, or malformed value cannot be used to run this program as a personal account. Invalid credentials stop startup before a Gateway client is created. Errors never intentionally include the supplied credential.

See Discord's documentation for [Bot versus OAuth2 authentication](https://docs.discord.com/developers/platform/oauth2-and-permissions) and the [`bot` field on user identities](https://docs.discord.com/developers/resources/user).

## Discord setup

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and create an application.
2. Open **Bot**, add a bot, and copy/reset its bot token. Treat the token like a password.
3. Under **Privileged Gateway Intents**, enable **Message Content Intent**.
4. Open **OAuth2 → URL Generator**, select the `bot` scope, and grant only **View Channels**, **Read Message History**, and **Send Messages**.
5. Use the generated URL to invite the bot to the intended server.

Never paste a personal user token into this project. If any token is exposed, reset it immediately.

## Installation

```bash
git clone https://github.com/Eshl3ss/discord-command-automation.git
cd discord-command-automation
npm install
cp .env.example .env
```

Edit `.env` with the bot token and IDs. To copy an ID, enable **Developer Mode** in Discord under **User Settings → Advanced**, then right-click the server, channel, or user and choose **Copy ID**.

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DISCORD_TOKEN` | Yes | — | Official bot token from the Developer Portal; verified before Gateway login |
| `SERVER_ID` | Yes | — | Only accepted Discord server |
| `CHANNEL_ID` | Yes | — | Only accepted channel |
| `AUTHORIZED_USER_ID` | Yes | — | Only user allowed to trigger actions |
| `TRIGGER` | No | `,with all` | Trigger text |
| `ACTION_ONE` | No | `,rob uid` | First message sent |
| `ACTION_TWO` | No | `,dep all` | Second message sent |
| `ACTION_DELAY_MS` | No | `0` | Whole-number delay between actions in milliseconds |

The real `.env` is ignored by Git. Never commit credentials.

## Run and test

```bash
npm start
npm test
```

Startup first reports bot-token verification, then shows the bot tag and configured scope. Configuration, verification, login, client, and send failures are logged without intentionally printing the token. The offline tests cover normalization, configuration validation, bot/user/server/channel filtering, action order, delay behavior, and both layers of bot-identity enforcement.

## Safe case-study lab

The test suite demonstrates the credential boundary without using a real account or contacting Discord. It injects fake HTTP responses and a fake Gateway client to simulate:

- successful official Bot authentication;
- rejected OAuth2 Bearer credentials;
- rejected personal-token/API-key placeholders;
- a successful response containing `bot: false`;
- a simulated personal identity reaching the ready event; and
- prevention of Gateway-client creation after failed preflight.

Every credential in the tests is an inert placeholder. Run the lab with `npm test`; never substitute a real personal token.

| Credential presented | Expected result |
| --- | --- |
| Official bot token accepted by Discord with `bot: true` | Gateway login may proceed |
| OAuth2 value prefixed with `Bearer` | Rejected locally; no network or Gateway client |
| Personal token, unrelated API key, or invalid value | Discord Bot authentication fails; no Gateway client |
| Any identity reporting `bot: false` | Rejected and disconnected |

## Project structure

```text
src/
  index.js           Starts and logs in the Discord client
  config.js          Loads and validates environment variables
  messageHandler.js  Filters messages and sends the actions
  normalizer.js      Normalizes case and whitespace
  runtime.js         Enforces the ready-time bot identity boundary
  tokenValidator.js  Performs Bot-authentication preflight
test/                 Offline unit tests and fake-client security lab
.env.example         Safe configuration template
```

## Troubleshooting

- **Configuration error:** fill every required value in `.env`.
- **Login failure:** reset the bot token and update `DISCORD_TOKEN`.
- **Bot does nothing:** verify all IDs, enable Message Content Intent, and confirm the bot can view the channel.
- **Bot cannot send:** grant **Send Messages** and check channel overrides.
- **Trigger mismatch:** capitalization and repeated whitespace are ignored, but punctuation must match.

## Security

- Keep `.env` out of Git and rotate any exposed token.
- Use only a bot token copied from the application's **Bot** page.
- Do not weaken or remove the preflight and ready-time identity checks.
- Grant only required permissions.
- Keep Node.js and dependencies updated.

## License

MIT
