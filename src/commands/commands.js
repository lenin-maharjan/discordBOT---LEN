const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask the AI anything')
    .addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true)),

  new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Get roasted by the AI (friendly)')
    .addUserOption(opt => opt.setName('user').setDescription('Who to roast').setRequired(false)),

  new SlashCommandBuilder()
    .setName('compliment')
    .setDescription('Get a compliment from the AI')
    .addUserOption(opt => opt.setName('user').setDescription('Who to compliment').setRequired(false)),

  new SlashCommandBuilder()
    .setName('advice')
    .setDescription('Get AI advice')
    .addStringOption(opt => opt.setName('situation').setDescription('Your situation').setRequired(true)),

  new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate text to another language')
    .addStringOption(opt => opt.setName('text').setDescription('Text to translate').setRequired(true))
    .addStringOption(opt => opt.setName('language').setDescription('Target language').setRequired(true)),

  new SlashCommandBuilder()
    .setName('explain')
    .setDescription('AI explains a topic simply')
    .addStringOption(opt => opt.setName('topic').setDescription('Topic to explain').setRequired(true)),

  new SlashCommandBuilder()
    .setName('story')
    .setDescription('AI generates a short story')
    .addStringOption(opt => opt.setName('prompt').setDescription('Story prompt').setRequired(true)),

  new SlashCommandBuilder()
    .setName('summarize')
    .setDescription('AI summarizes recent messages'),

  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('AI generates a fun poll')
    .addStringOption(opt => opt.setName('topic').setDescription('Poll topic').setRequired(true)),

  new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('AI generates a trivia question'),

  new SlashCommandBuilder()
    .setName('debate')
    .setDescription('AI argues both sides of a topic')
    .addStringOption(opt => opt.setName('topic').setDescription('Topic to debate').setRequired(true)),

  new SlashCommandBuilder()
    .setName('wordoftheday')
    .setDescription('AI picks and explains a cool word'),

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('AI hypes up a giveaway')
    .addStringOption(opt => opt.setName('prize').setDescription('Prize to giveaway').setRequired(true)),

  // LEVELING
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your level and XP')
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(false)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View top 10 members by level'),

  // ROLES
  new SlashCommandBuilder()
    .setName('rolepanel')
    .setDescription('Create a role selection panel'),

  // MODERATION
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Ban reason').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Kick reason').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(true))
    .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in seconds').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Warning reason').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a member')
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages in bulk')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set channel slowmode')
    .addIntegerOption(opt => opt.setName('seconds').setDescription('Slowmode duration').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock the current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Get server information'),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get user information')
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(false)),

  // MUSIC COMMANDS
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube or other platforms')
    .addStringOption(opt => opt.setName('song').setDescription('Song name or URL').setRequired(true).setAutocomplete(true)),

  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),

  new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the music'),

  new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the music'),

  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the music queue'),
];

module.exports = commands;
