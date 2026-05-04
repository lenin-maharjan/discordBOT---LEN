const { EmbedBuilder } = require('discord.js');

let lastDailyDay = -1;

function startDailyScheduler({ client, CONFIG, callGroqAPI, getSystemPrompt }) {
  setInterval(async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDate();
    const dayOfWeek = now.getDay();

    if (hour === CONFIG.DAILY_POST_HOUR && minute === CONFIG.DAILY_POST_MINUTE && day !== lastDailyDay) {
      lastDailyDay = day;

      let prompt = '';
      if (dayOfWeek === 1) {
        prompt = 'Write a SHORT (2-3 sentences) weekly recap and motivational message to hype up everyone for the week!';
      } else if (dayOfWeek === 0) {
        prompt = 'Write a SHORT (2-3 sentences) motivational message for the week ahead!';
      } else {
        prompt = 'Write a SHORT (2-3 sentences) unique, fun daily message or challenge to engage the server!';
      }

      const dailyMsg = await callGroqAPI(
        [{ role: 'user', content: prompt }],
        getSystemPrompt('Write engaging, fun daily server messages.')
      );

      client.guilds.cache.forEach(guild => {
        const channel = guild.channels.cache.get(CONFIG.DAILY_POST_CHANNEL_ID);
        if (channel && dailyMsg) {
          const embed = new EmbedBuilder()
            .setColor('#EB459E')
            .setTitle(dayOfWeek === 1 ? 'Weekly Recap' : dayOfWeek === 0 ? 'Motivation' : 'Daily Message')
            .setDescription(dailyMsg)
            .setTimestamp()
            .setFooter({ text: 'AI-generated' });

          channel.send({ embeds: [embed] }).catch(() => {});
        }
      });
    }
  }, 60_000);
}

function startMuteChecker({ client, db, CONFIG }) {
  setInterval(() => {
    // Mute checker disabled - sql.js doesn't support direct DB access from scheduler
    // Re-enable with better-sqlite3 or implement an async wrapper
  }, 10_000);
}

module.exports = {
  startDailyScheduler,
  startMuteChecker,
};
