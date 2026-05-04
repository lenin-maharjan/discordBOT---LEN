const { EmbedBuilder } = require('discord.js');
const CONFIG = require('../config');
const { getOrCreateUser, addXP, addWarning } = require('../services/database');
const { callGroqAPI, getSystemPrompt, addToHistory, getHistory, checkRateLimit } = require('../services/ai');
const { logModAction } = require('../services/modlog');

const xpCooldowns = new Map();

module.exports = function registerMessageCreate(client) {
  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    try {
      const userId = message.author.id;
      const guildId = message.guild.id;

      getOrCreateUser(userId, guildId, message.author.username);

      if (!checkRateLimit(userId)) {
        return message.reply('⏱️ You\'re using AI too fast! Wait a minute and try again.').catch(() => {});
      }

      if (CONFIG.TOXICITY_CHECK) {
        const toxicityResponse = await callGroqAPI(
          [{ role: 'user', content: `Rate this message for toxicity (0-1 scale, where 1 is extremely toxic): "${message.content}"` }],
          'You rate content toxicity briefly. Respond ONLY with a number between 0 and 1.'
        );

        if (toxicityResponse) {
          try {
            const toxicityScore = parseFloat(toxicityResponse);
            if (toxicityScore > CONFIG.TOXIC_THRESHOLD) {
              const reasonResponse = await callGroqAPI(
                [{ role: 'user', content: `Briefly explain why this is inappropriate: "${message.content}"` }],
                'Explain briefly why content is inappropriate. Be concise.'
              );

              const reason = reasonResponse || 'Inappropriate content detected';

              await message.delete().catch(() => {});
              addWarning(userId, guildId, reason, client.user.id);
              logModAction(message.guild, 'TOXICITY_WARN', message.author, client.user, reason, CONFIG);

              return message.author.send(`⚠️ Your message was deleted. Reason: ${reason}`).catch(() => {});
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }

      const now = Date.now();
      if (!xpCooldowns.has(userId) || now - xpCooldowns.get(userId) > CONFIG.XP_COOLDOWN_MS) {
        xpCooldowns.set(userId, now);
        const xpGain = CONFIG.XP_PER_MESSAGE + Math.floor(Math.random() * 10);
        const result = addXP(userId, guildId, xpGain);

        if (result.levelUp) {
          const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('★ Level Up!')
            .setDescription(`${message.author} reached **Level ${result.newLevel}**! 🎉`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

          await message.channel.send({ embeds: [embed] }).catch(console.error);

          for (const lr of CONFIG.LEVEL_ROLES) {
            if (result.newLevel === lr.level) {
              const role = message.guild.roles.cache.get(lr.roleId);
              if (role) {
                await message.member.roles.add(role).catch(console.error);
              }
            }
          }
        }
      }

      if (message.content.trim().endsWith('?') && Math.random() < CONFIG.AUTO_RESPONSE_CHANCE) {
        if (!checkRateLimit(message.author.id)) return;

        const aiResponse = await callGroqAPI(
          getHistory(message.author.id).concat([{ role: 'user', content: message.content }]),
          getSystemPrompt('Answer questions helpfully and keep it fun and short (1-2 sentences).')
        );

        if (aiResponse) {
          addToHistory(message.author.id, 'user', message.content);
          addToHistory(message.author.id, 'assistant', aiResponse);
          return message.reply(aiResponse).catch(() => {});
        }
      }

      if (message.mentions.has(client.user)) {
        if (!checkRateLimit(message.author.id)) return;

        const aiResponse = await callGroqAPI(
          getHistory(message.author.id).concat([{ role: 'user', content: message.content }]),
          getSystemPrompt('Respond conversationally to what the user says. Keep it short (1-2 sentences) and friendly.')
        );

        if (aiResponse) {
          addToHistory(message.author.id, 'user', message.content);
          addToHistory(message.author.id, 'assistant', aiResponse);
          return message.reply(aiResponse).catch(() => {});
        }
      }

      if (message.content.toLowerCase().includes('happy') || message.content.toLowerCase().includes('great') || message.content.toLowerCase().includes('awesome')) {
        await message.react('😊').catch(() => {});
      } else if (message.content.toLowerCase().includes('sad') || message.content.toLowerCase().includes('bad') || message.content.toLowerCase().includes('hate')) {
        await message.react('😢').catch(() => {});
      }
    } catch (error) {
      console.error('Message handler error:', error);
    }
  });
};
