const { REST, Routes } = require('discord.js');
const CONFIG = require('../config');
const commands = require('../commands/commands');
const { initializePlayer } = require('../services/music');
const { startDailyScheduler, startMuteChecker } = require('../services/scheduler');
const { callGroqAPI, getSystemPrompt } = require('../services/ai');

module.exports = function registerReady(client) {
  client.once('clientReady', async () => {
    console.log(`[OK] Logged in as ${client.user.tag}`);
    await initializePlayer(client);

    const rest = new REST({ version: '10' }).setToken(CONFIG.TOKEN);
    try {
      console.log('[SYNC] Registering slash commands...');
      const commandsToRegister = commands.map(cmd => cmd.toJSON());
      console.log(`[INFO] Registering ${commandsToRegister.length} commands...`);
      await rest.put(Routes.applicationCommands(CONFIG.CLIENT_ID), { body: commandsToRegister });
      console.log('[OK] Commands registered!');
    } catch (error) {
      console.error('[ERROR] Failed to register commands:', error);
    }

    try { client.user.setActivity('Lenin DaDa /play', { type: 3 }); } catch (_) {}
    startDailyScheduler({ client, CONFIG, callGroqAPI, getSystemPrompt });
    startMuteChecker({ client, CONFIG });
  });
};
