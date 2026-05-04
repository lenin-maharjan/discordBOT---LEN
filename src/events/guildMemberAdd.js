const { EmbedBuilder } = require('discord.js');
const CONFIG = require('../config');
const { callGroqAPI, getSystemPrompt } = require('../services/ai');

module.exports = function registerGuildMemberAdd(client) {
  client.on('guildMemberAdd', async (member) => {
    try {
      const welcomeMsg = await callGroqAPI(
        [{ role: 'user', content: `Generate a SHORT (1-2 sentences) fun welcome message for ${member.user.username} joining the server. Be warm and friendly.` }],
        getSystemPrompt('Generate welcoming messages.')
      );

      const welcomeChannel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
      if (welcomeChannel && welcomeMsg) {
        const embed = new EmbedBuilder()
          .setColor('#57F287')
          .setTitle(`👋 Welcome, ${member.user.username}!`)
          .setDescription(welcomeMsg)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        await welcomeChannel.send({ content: `<@${member.id}>`, embeds: [embed] }).catch(console.error);
      }

      const rulesText = CONFIG.SERVER_RULES.join('\n');
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle(`📜 ${CONFIG.SERVER_NAME} Rules`)
          .setDescription(rulesText)
          .setFooter({ text: 'Welcome to the server! Have fun!' });

        await member.send({ embeds: [dmEmbed] });
      } catch (_) {}

      const memberRole = member.guild.roles.cache.get(CONFIG.MEMBER_ROLE_ID);
      if (memberRole) {
        await member.roles.add(memberRole).catch(console.error);
      }
    } catch (error) {
      console.error('Welcome error:', error);
    }
  });
};
