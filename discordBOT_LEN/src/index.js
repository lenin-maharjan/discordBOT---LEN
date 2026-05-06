const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const CONFIG = require('./config');
const { initDatabase } = require('./services/database');

// Modular event registration
const registerReady = require('./events/ready');
const registerGuildMemberAdd = require('./events/guildMemberAdd');
const registerMessageCreate = require('./events/messageCreate');
const registerInteractionCreate = require('./events/interactionCreate');

// ============================================================
//  CLIENT SETUP (bootstrap)
// ============================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// register modular event handlers
registerReady(client);
registerGuildMemberAdd(client);
registerMessageCreate(client);
registerInteractionCreate(client);

if (process.env.PORT) {
  const healthServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
  });

  healthServer.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`[HEALTH] Listening on port ${process.env.PORT}`);
  });
}

const shutdown = async (signal) => {
  console.log(`[SHUTDOWN] Received ${signal}`);
  try {
    await client.destroy();
  } catch (error) {
    console.error('[SHUTDOWN] Error during client shutdown:', error);
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ============================================================
//  LOGIN
// ============================================================
(async () => {
  await initDatabase();
  client.login(CONFIG.TOKEN);
})();
