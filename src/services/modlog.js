const { EmbedBuilder } = require('discord.js');

function logModAction(guild, action, user, moderator, reason, config) {
  const logChannel = guild.channels.cache.get(config.MOD_LOG_CHANNEL_ID);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor(action === 'WARN' || action === 'TOXICITY_WARN' ? '#FF9800' : '#FF0000')
    .setTitle(`${action}`)
    .addFields(
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: moderator.tag || 'AI System', inline: true },
      { name: 'Reason', value: reason || 'No reason provided', inline: false },
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  logChannel.send({ embeds: [embed] }).catch(console.error);
}

module.exports = { logModAction };
