const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const CONFIG = require('../config');
const {
  initDatabase,
  getOrCreateUser,
  addWarning,
  getWarnings,
  getLeaderboard,
} = require('../services/database');
const {
  callGroqAPI,
  getSystemPrompt,
  addToHistory,
  getHistory,
  checkRateLimit,
} = require('../services/ai');
const { logModAction } = require('../services/modlog');
const { initializePlayer, playMusic, skipMusic, stopMusic, pauseMusic, resumeMusic, showQueue, searchMusic } = require('../services/music');

module.exports = function registerInteractionCreate(client) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'play') {
          await searchMusic(interaction);
        }
        return;
      }

      if (interaction.isButton()) {
        if (interaction.customId.startsWith('role_')) {
          const roleKey = interaction.customId.replace('role_', '');
          const roleData = CONFIG.SELF_ROLES[roleKey];
          if (!roleData) return interaction.reply({ content: '❌ Role not found.', ephemeral: true });

          const roleId = roleData.roleId;
          const role = interaction.guild.roles.cache.get(roleId);
          if (!role) return interaction.reply({ content: '❌ Role not found on server.', ephemeral: true });

          if (interaction.member.roles.cache.has(roleId)) {
            await interaction.member.roles.remove(role);
            return interaction.reply({ content: `✅ Removed **${role.name}**`, ephemeral: true });
          } else {
            await interaction.member.roles.add(role);
            return interaction.reply({ content: `✅ Added **${role.name}**`, ephemeral: true });
          }
        }

        if (interaction.customId.startsWith('giveaway_')) {
          return interaction.reply({ content: '🎉 You have successfully entered the giveaway! Good luck!', ephemeral: true });
        }
      }

      if (!interaction.isChatInputCommand()) return;

      const { commandName } = interaction;
      const userId = interaction.user.id;

      getOrCreateUser(userId, interaction.guildId, interaction.user.username);

      if (!checkRateLimit(userId)) {
        return interaction.reply({ content: '⏱️ AI rate limit hit! Max 10 commands per minute.', ephemeral: true });
      }

      switch (commandName) {
        case 'ask': {
          const question = interaction.options.getString('question');
          await interaction.deferReply();

          const aiResponse = await callGroqAPI(
            getHistory(userId).concat([{ role: 'user', content: question }]),
            getSystemPrompt()
          );

          if (aiResponse) {
            addToHistory(userId, 'user', question);
            addToHistory(userId, 'assistant', aiResponse);
            return interaction.editReply(aiResponse);
          } else {
            return interaction.editReply('🤖 Sorry, I couldn\'t process that. Try again later!');
          }
        }

        case 'roast': {
          const user = interaction.options.getUser('user') || interaction.user;
          await interaction.deferReply();

          const roast = await callGroqAPI(
            [{ role: 'user', content: `Write a FRIENDLY, FUNNY roast about a Discord user. Keep it short (1 sentence), witty, and make sure it's obviously joking. User: ${user.username}` }],
            getSystemPrompt('Write funny, friendly roasts that are obviously jokes.')
          );

          return interaction.editReply(roast || '😂 My roast-o-meter broke!');
        }

        case 'compliment': {
          const user = interaction.options.getUser('user') || interaction.user;
          await interaction.deferReply();

          const compliment = await callGroqAPI(
            [{ role: 'user', content: `Write a sincere, warm compliment for a Discord user. Keep it short (1 sentence). User: ${user.username}` }],
            getSystemPrompt('Write genuine, kind compliments.')
          );

          return interaction.editReply(compliment || `${user.username} is awesome! 🌟`);
        }

        case 'advice': {
          const situation = interaction.options.getString('situation');
          await interaction.deferReply();

          const advice = await callGroqAPI(
            [{ role: 'user', content: `Give me SHORT, practical advice about: ${situation}` }],
            getSystemPrompt('Give practical, friendly advice. Keep it 1-2 sentences.')
          );

          return interaction.editReply(advice || '💡 You got this!');
        }

        case 'translate': {
          const text = interaction.options.getString('text');
          const language = interaction.options.getString('language');
          await interaction.deferReply();

          const translation = await callGroqAPI(
            [{ role: 'user', content: `Translate this to ${language}: ${text}` }],
            'Translate text accurately and briefly. Return ONLY the translation.'
          );

          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🌍 Translation')
            .addFields(
              { name: 'Original', value: text, inline: false },
              { name: `${language}`, value: translation || 'Translation failed', inline: false }
            );

          return interaction.editReply({ embeds: [embed] });
        }

        case 'explain': {
          const topic = interaction.options.getString('topic');
          await interaction.deferReply();

          const explanation = await callGroqAPI(
            [{ role: 'user', content: `Explain ${topic} simply for beginners. Keep it SHORT (2-3 sentences max).` }],
            getSystemPrompt('Explain things simply and clearly for beginners.')
          );

          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`📚 Explaining: ${topic}`)
            .setDescription(explanation || 'Explanation failed');

          return interaction.editReply({ embeds: [embed] });
        }

        case 'story': {
          const prompt = interaction.options.getString('prompt');
          await interaction.deferReply();

          const story = await callGroqAPI(
            [{ role: 'user', content: `Write a SHORT, fun story based on this prompt: ${prompt}. Keep it to 3-4 sentences.` }],
            getSystemPrompt('Write creative, fun short stories.')
          );

          const embed = new EmbedBuilder()
            .setColor('#9C27B0')
            .setTitle(`📖 Story`)
            .setDescription(story || 'Story generation failed');

          return interaction.editReply({ embeds: [embed] });
        }

        case 'summarize': {
          await interaction.deferReply();
          const messages = await interaction.channel.messages.fetch({ limit: 50 });
          const textToSummarize = messages.reverse().map(m => `${m.author.username}: ${m.content}`).join('\n');

          const summary = await callGroqAPI(
            [{ role: 'user', content: `Summarize this Discord conversation in 2-3 bullets:\n${textToSummarize}` }],
            getSystemPrompt('Summarize conversations concisely.')
          );

          const embed = new EmbedBuilder()
            .setColor('#FF9800')
            .setTitle('📋 Channel Summary')
            .setDescription(summary || 'Summary failed');

          return interaction.editReply({ embeds: [embed] });
        }

        case 'poll': {
          const topic = interaction.options.getString('topic');
          await interaction.deferReply();

          const poll = await callGroqAPI(
            [{ role: 'user', content: `Create a 2-option poll question about: ${topic}. Format as: "Question?" and give two fun options separated by " or ". Be creative!` }],
            getSystemPrompt('Create fun, engaging polls.')
          );

          const pollEmbed = new EmbedBuilder()
            .setColor('#00BCD4')
            .setTitle('📊 Poll')
            .setDescription(poll || `What's your opinion on ${topic}?`);

          const msg = await interaction.editReply({ embeds: [pollEmbed] });
          await msg.react('👍').catch(() => {});
          await msg.react('👎').catch(() => {});
          break;
        }

        case 'trivia': {
          await interaction.deferReply();

          const trivia = await callGroqAPI(
            [{ role: 'user', content: `Generate one trivia question with multiple choice answers (A, B, C, D). Format: "Question?\nA) Option\nB) Option\nC) Option\nD) Option\nAnswer: X"` }],
            getSystemPrompt('Generate interesting trivia questions.')
          );

          const triviaEmbed = new EmbedBuilder()
            .setColor('#673AB7')
            .setTitle('🧠 Trivia')
            .setDescription(trivia || 'Trivia failed');

          return interaction.editReply({ embeds: [triviaEmbed] });
        }

        case 'debate': {
          const topic = interaction.options.getString('topic');
          await interaction.deferReply();

          const debate = await callGroqAPI(
            [{ role: 'user', content: `Argue BOTH sides of this topic in 2-3 sentences each, then give your unbiased take: ${topic}` }],
            getSystemPrompt('Present balanced arguments for both sides of topics.')
          );

          const debateEmbed = new EmbedBuilder()
            .setColor('#E91E63')
            .setTitle(`⚡ Debate: ${topic}`)
            .setDescription(debate || 'Debate failed');

          return interaction.editReply({ embeds: [debateEmbed] });
        }

        case 'wordoftheday': {
          await interaction.deferReply();

          const word = await callGroqAPI(
            [{ role: 'user', content: `Give me 1 cool/interesting English word. Format: "**Word**: definition (example usage)"` }],
            getSystemPrompt('Pick interesting words and explain them clearly.')
          );

          const embed = new EmbedBuilder()
            .setColor('#4CAF50')
            .setTitle('📖 Word of the Day')
            .setDescription(word || 'Word fetch failed');

          return interaction.editReply({ embeds: [embed] });
        }

        case 'giveaway': {
          const prize = interaction.options.getString('prize');
          await interaction.deferReply();

          const hype = await callGroqAPI(
            [{ role: 'user', content: `Write a HYPED UP announcement for a giveaway of: ${prize}. Keep it SHORT (1-2 sentences) with emojis!` }],
            getSystemPrompt('Write exciting giveaway announcements.')
          );

          const btn = new ButtonBuilder()
            .setCustomId(`giveaway_${Date.now()}`)
            .setLabel('🎉 Enter')
            .setStyle(ButtonStyle.Success);

          const row = new ActionRowBuilder().addComponents(btn);
          const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎁 GIVEAWAY!')
            .setDescription(hype || `Win a ${prize}!`);

          return interaction.editReply({ embeds: [embed], components: [row] });
        }

        // LEVELING
        case 'rank': {
          await interaction.deferReply();
          const user = interaction.options.getUser('user') || interaction.user;
          const userData = getOrCreateUser(user.id, interaction.guildId, user.username);

          const xpNeeded = Math.floor(100 * Math.pow(userData.level + 1, 1.5));
          const progressPercent = Math.round((userData.xp / xpNeeded) * 100);
          const filled = Math.floor(progressPercent / 10);
          const empty = 10 - filled;

          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`📊 ${user.username}'s Rank`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
              { name: 'Level', value: `${userData.level}`, inline: true },
              { name: 'XP', value: `${userData.xp} / ${xpNeeded}`, inline: true },
              { name: 'Progress', value: `${'█'.repeat(filled)}${'░'.repeat(empty)} ${progressPercent}%`, inline: false },
            )
            .setTimestamp();

          return interaction.editReply({ embeds: [embed] });
        }

        case 'leaderboard': {
          await interaction.deferReply();
          const allUsers = getLeaderboard(interaction.guildId);

          const desc = allUsers.map((u, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            return `${medals[i] || `**${i + 1}.**`} <@${u.userId}> —" Level ${u.level} (${u.xp} XP)`;
          }).join('\n');

          const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆Server Leaderboard')
            .setDescription(desc || 'No data yet!')
            .setTimestamp();

          return interaction.editReply({ embeds: [embed] });
        }

        // ROLES
        case 'rolepanel': {
          if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: '❌ You need Manage Roles permission', ephemeral: true });
          }

          const buttons = Object.entries(CONFIG.SELF_ROLES).map(([key, r]) =>
            new ButtonBuilder()
              .setCustomId(`role_${key}`)
              .setLabel(r.label)
              .setEmoji(r.emoji)
              .setStyle(ButtonStyle.Secondary)
          );

          const row = new ActionRowBuilder().addComponents(buttons);
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎭 Pick Your Roles')
            .setDescription('Click a button to add or remove a role!');

          return interaction.reply({ embeds: [embed], components: [row] });
        }

        // MODERATION
        case 'ban': {
          if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: '❌ You need Ban Members permission', ephemeral: true });
          }

          const user = interaction.options.getUser('user');
          const reason = interaction.options.getString('reason') || 'No reason provided';

          await interaction.guild.members.ban(user, { reason }).catch(() => {
            return interaction.reply({ content: `❌ Failed to ban`, ephemeral: true });
          });

          logModAction(interaction.guild, 'BAN', user, interaction.user, reason, CONFIG);
          return interaction.reply({ content: `✅ Banned ${user.tag}`, ephemeral: true });
        }

        case 'kick': {
          if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: '❌ You need Kick Members permission', ephemeral: true });
          }

          const user = interaction.options.getUser('user');
          const reason = interaction.options.getString('reason') || 'No reason provided';
          const member = await interaction.guild.members.fetch(user.id).catch(() => null);

          if (!member) {
            return interaction.reply({ content: '❌ User not found', ephemeral: true });
          }

          await member.kick(reason).catch(() => {
            return interaction.reply({ content: `❌ Failed to kick`, ephemeral: true });
          });

          logModAction(interaction.guild, 'KICK', user, interaction.user, reason, CONFIG);
          return interaction.reply({ content: `✅ Kicked ${user.tag}`, ephemeral: true });
        }

        case 'mute': {
          if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: '❌ You need Moderate Members permission', ephemeral: true });
          }

          const user = interaction.options.getUser('user');
          const duration = (interaction.options.getInteger('duration') || 3600) * 1000;
          const member = await interaction.guild.members.fetch(user.id).catch(() => null);

          if (!member) {
            return interaction.reply({ content: '❌ User not found', ephemeral: true });
          }

          const muteRole = interaction.guild.roles.cache.get(CONFIG.MUTED_ROLE_ID);
          if (muteRole) {
            await member.roles.add(muteRole).catch(() => {});
          }

          logModAction(interaction.guild, 'MUTE', user, interaction.user, `Duration: ${Math.floor(duration / 1000)}s`, CONFIG);
          return interaction.reply({ content: `✅ Muted ${user.tag}`, ephemeral: true });
        }

        case 'warn': {
          if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: '❌ You need Moderate Members permission', ephemeral: true });
          }

          const user = interaction.options.getUser('user');
          const reason = interaction.options.getString('reason');

          addWarning(user.id, interaction.guildId, reason, interaction.user.id);
          logModAction(interaction.guild, 'WARN', user, interaction.user, reason, CONFIG);

          return interaction.reply({ content: `⚠️ Warned ${user.tag}`, ephemeral: true });
        }

        case 'warnings': {
          const user = interaction.options.getUser('user') || interaction.user;
          const warnings = getWarnings(user.id, interaction.guildId);

          const embed = new EmbedBuilder()
            .setColor('#FF9800')
            .setTitle(`⚠️ Warnings for ${user.tag}`)
            .setDescription(warnings.length === 0 ? 'No warnings' : warnings.map((w, i) => 
              `${i + 1}. **${w.reason}** (by <@${w.moderator}>)`
            ).join('\n'));

          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        case 'purge': {
          if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: '❌ You need Manage Messages permission', ephemeral: true });
          }

          const amount = interaction.options.getInteger('amount');

          if (amount < 1 || amount > 100) {
            return interaction.reply({ content: '❌ Amount must be between 1 and 100', ephemeral: true });
          }

          const fetched = await interaction.channel.messages.fetch({ limit: amount }).catch(() => null);
          if (fetched) {
            await interaction.channel.bulkDelete(fetched).catch(() => {});
          }

          return interaction.reply({ content: `✅ Deleted ${amount} messages`, ephemeral: true });
        }

        case 'slowmode': {
          if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ You need Manage Channels permission', ephemeral: true });
          }

          const seconds = interaction.options.getInteger('seconds');

          if (seconds < 0 || seconds > 21600) {
            return interaction.reply({ content: '❌ Slowmode must be between 0 and 21600 seconds', ephemeral: true });
          }

          await interaction.channel.setRateLimitPerUser(seconds).catch(() => {});
          return interaction.reply({ content: `✅ Slowmode set to ${seconds}s`, ephemeral: true });
        }

        case 'lock': {
          if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ You need Manage Channels permission', ephemeral: true });
          }

          await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false }).catch(() => {});
          return interaction.reply({ content: '🔒 Channel locked', ephemeral: true });
        }

        case 'unlock': {
          if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ You need Manage Channels permission', ephemeral: true });
          }

          await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: null }).catch(() => {});
          return interaction.reply({ content: '🔓 Channel unlocked', ephemeral: true });
        }

        case 'serverinfo': {
          const guild = interaction.guild;

          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`📊 ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
              { name: 'Members', value: `${guild.memberCount}`, inline: true },
              { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
              { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
              { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
              { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:d>`, inline: true },
            )
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        }

        case 'userinfo': {
          const user = interaction.options.getUser('user') || interaction.user;
          const member = await interaction.guild.members.fetch(user.id).catch(() => null);

          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(user.tag)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
              { name: 'ID', value: user.id, inline: true },
              { name: 'Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:d>`, inline: true },
              { name: 'Joined', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:d>` : 'N/A', inline: true },
              { name: 'Roles', value: member ? (member.roles.cache.size > 1 ? member.roles.cache.map(r => r.name).slice(0, -1).join(', ') : 'None') : 'N/A', inline: false },
            )
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        }

        // MUSIC COMMANDS
        case 'play':
          return await playMusic(interaction);

        case 'skip':
          return await skipMusic(interaction);

        case 'stop':
          return await stopMusic(interaction);

        case 'pause':
          return await pauseMusic(interaction);

        case 'resume':
          return await resumeMusic(interaction);

        case 'queue':
          return await showQueue(interaction);

        default:
          return interaction.reply({ content: '❌ Unknown command', ephemeral: true });
      }
    } catch (error) {
      console.error('Interaction error:', error);
      if (interaction.isAutocomplete()) return;
      if (!interaction.replied && !interaction.deferred) {
        interaction.reply({ content: '❌ An error occurred', ephemeral: true }).catch(() => {});
      }
    }
  });
};
