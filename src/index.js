const { Client, GatewayIntentBits } = require('discord.js');
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

// ============================================================
//  LOGIN
// ============================================================
(async () => {
  await initDatabase();
  client.login(CONFIG.TOKEN);
})();
