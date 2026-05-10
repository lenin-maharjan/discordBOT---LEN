// Fixed music.js — YouTube primary, SoundCloud fallback
// Removes useYoutubeDL bridge (breaks on Railway) and adds SoundCloud fallback
// Fixed music.js — YouTube primary, SoundCloud fallback
// Removes useYoutubeDL bridge (breaks on Railway) and adds SoundCloud fallback

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('[YOUTUBEJS]')) return;
  originalConsoleWarn.apply(console, args);
};

const { PermissionFlagsBits } = require('discord.js');
const { Player, QueryType } = require('discord-player');
const { SoundCloudExtractor } = require('@discord-player/extractor');
const { YoutubeiExtractor } = require('discord-player-youtubei');

require('@discord-player/opus');

try {
  require('libsodium-wrappers').ready.then(() => {
    console.log('[AUDIO] ✅ libsodium loaded (voice encryption ready)');
  });
} catch (err) {
  console.warn('[AUDIO] ⚠️ libsodium not available');
}

const ffmpegPath = require('ffmpeg-static');
if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
  console.log(`[AUDIO] ✅ FFmpeg path set: ${ffmpegPath}`);
}

let player = null;
const AUTOCOMPLETE_CACHE_TTL_MS = 30_000;
const autocompleteCache = new Map();

function getPlaybackChannel(metadata) {
  if (!metadata) return null;
  return metadata.channel || metadata;
}

function isStreamExtractionError(error) {
  const message = String(error?.message || '');
  return error?.name === 'NoResultError' || /Could not extract stream|extract stream|No result/i.test(message);
}

function getFallbackSearchTerm(queue) {
  const metadata = queue?.metadata;
  const currentTitle = queue?.currentTrack?.title;
  const originalQuery = metadata?.originalQuery;
  const title = currentTitle || metadata?.trackTitle || originalQuery || '';

  if (/^https?:\/\//i.test(String(title))) {
    return currentTitle || metadata?.trackTitle || '';
  }

  return title;
}

async function retryWithSoundCloudFallback(queue, error) {
  const metadata = queue?.metadata || {};
  if (!queue || metadata.fallbackAttempted || !isStreamExtractionError(error)) {
    return false;
  }

  const fallbackTerm = getFallbackSearchTerm(queue).trim();
  if (!fallbackTerm) {
    return false;
  }

  metadata.fallbackAttempted = true;
  console.log(`[MUSIC] ❌ YouTube stream blocked, trying SoundCloud... (${fallbackTerm})`);

  const voiceChannelId = metadata.voiceChannelId || queue.connection?.joinConfig?.channelId;
  const voiceChannel = queue.guild?.channels?.cache?.get(voiceChannelId) || null;
  if (!voiceChannel) {
    console.warn('[MUSIC] ⚠️ Could not resolve voice channel for SoundCloud fallback');
    return false;
  }

  const channel = getPlaybackChannel(metadata);

  try {
    const result = await player.play(voiceChannel, fallbackTerm, {
      searchEngine: QueryType.SOUNDCLOUD_SEARCH,
      nodeOptions: {
        metadata,
        ...NODE_OPTIONS,
      },
    });

    const track = result.track;
    if (!track) {
      return false;
    }

    console.log(`[MUSIC] ✅ Found on SoundCloud: "${track.title}"`);
    if (channel?.send) {
      channel.send(`☁️ Playing from SoundCloud instead: **${track.title}**`).catch(() => {});
    }
    return true;
  } catch (fallbackError) {
    logMusicError('[MUSIC] SoundCloud fallback failed:', fallbackError);
    if (channel?.send) {
      channel.send('❌ SoundCloud fallback also failed.').catch(() => {});
    }
    return false;
  }
}

function logMusicError(label, error) {
  console.error(label, {
    name: error?.name,
    message: error?.message,
    cause: error?.cause,
  });
}

async function respondAutocompleteSafely(interaction, choices) {
  try {
    if (interaction.responded) return;
    await interaction.respond(choices);
  } catch (error) {
    if (error?.code === 10062 || error?.code === 40060) return;
    logMusicError('Autocomplete respond error:', error);
  }
}

async function deferInteractionSafely(interaction) {
  try {
    if (interaction.deferred || interaction.replied) return true;
    await interaction.deferReply();
    return true;
  } catch (error) {
    if (error?.code === 10062 || error?.code === 40060) return false;
    throw error;
  }
}

async function editOrFollowUp(interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(payload);
    }
    return await interaction.reply(payload);
  } catch (error) {
    if (error?.code === 10062 || error?.code === 40060) return null;
    throw error;
  }
}

async function initializePlayer(client) {
  player = new Player(client, {
    skipFFmpeg: false,
  });

  // ── 1. YouTube (primary) ──────────────────────────────────────
  // NO useYoutubeDL, NO overrideBridgeMode — those break on Railway
  try {
    await player.extractors.register(YoutubeiExtractor, {});
    console.log('[MUSIC] ✅ YoutubeiExtractor registered (YouTube primary)');
  } catch (err) {
    console.warn('[MUSIC] ⚠️ YoutubeiExtractor registration failed:', err.message);
  }

  // ── 2. SoundCloud (fallback) ──────────────────────────────────
  // discord-player tries extractors in registration order
  // so SoundCloud is only used when YouTube stream fails
  try {
    await player.extractors.register(SoundCloudExtractor, {});
    console.log('[MUSIC] ✅ SoundCloudExtractor registered (SoundCloud fallback)');
  } catch (err) {
    console.warn('[MUSIC] ⚠️ SoundCloudExtractor registration failed:', err.message);
  }

  // ── Events ────────────────────────────────────────────────────
  player.events.on('playerError', async (queue, error) => {
    console.error('[MUSIC] ❌ Player error:', error.message);

    const channel = getPlaybackChannel(queue?.metadata);
    if (channel?.send) {
      channel.send('⚠️ YouTube stream failed — trying SoundCloud fallback...').catch(() => {});
    }

    await retryWithSoundCloudFallback(queue, error);
  });

  player.events.on('error', (queue, error) => {
    console.error('[MUSIC] ❌ Queue error:', error.message);
  });

  player.events.on('trackStart', (queue, track) => {
    const source = track.extractor?.identifier?.includes('soundcloud') ? '☁️ SoundCloud' : '▶️ YouTube';
    console.log(`[MUSIC] 🎵 Now playing: "${track.title}" via ${source}`);

    const channel = getPlaybackChannel(queue?.metadata);
    if (channel?.send) {
      channel.send(`🎵 Now playing: **${track.title}** ${source}`).catch(() => {});
    }
  });

  player.events.on('queueEnd', (queue) => {
    console.log('[MUSIC] 🏁 Queue ended');
  });

  player.events.on('disconnect', (queue) => {
    console.log('[MUSIC] 🔌 Bot disconnected from voice');
  });

  console.log('✅ Music player initialized');
}

// ── NODE OPTIONS ──────────────────────────────────────────────
const NODE_OPTIONS = {
  selfDeaf: true,
  leaveOnEmpty: true,
  leaveOnEmptyCooldown: 60_000,
  leaveOnEnd: true,
  leaveOnEndCooldown: 60_000,
  inlineVolume: true,
  volume: 100,
  bufferingTimeout: 10_000,
};

async function playMusic(interaction) {
  const deferred = await deferInteractionSafely(interaction);
  if (!deferred) return null;

  const query = interaction.options.getString('song');
  const voiceChannel = interaction.member.voice.channel;

  if (!voiceChannel) {
    return editOrFollowUp(interaction, '❌ You must be in a voice channel!');
  }

  const botPermissions = voiceChannel.permissionsFor(interaction.guild.members.me);
  if (!botPermissions?.has([
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
  ])) {
    return editOrFollowUp(
      interaction,
      '❌ I need View Channel, Connect, and Speak permissions.'
    );
  }

  // Determine search engine
  let searchEngine;
  if (/youtube\.com\/playlist|[?&]list=/i.test(query)) {
    searchEngine = QueryType.YOUTUBE_PLAYLIST;
  } else if (/soundcloud\.com\/.+\/sets\//i.test(query)) {
    searchEngine = QueryType.SOUNDCLOUD_PLAYLIST;
  } else if (/soundcloud\.com/i.test(query)) {
    searchEngine = QueryType.SOUNDCLOUD_TRACK;
  } else if (/^https?:\/\//i.test(query)) {
    searchEngine = QueryType.AUTO;
  } else {
    searchEngine = QueryType.AUTO; // Let discord-player pick best extractor
  }

  console.log(`[MUSIC] 🔎 Searching: "${query}" | Engine: ${searchEngine}`);

  try {
    const result = await player.play(voiceChannel, query, {
      searchEngine,
      nodeOptions: {
        metadata: {
          channel: interaction.channel,
          originalQuery: query,
          voiceChannelId: voiceChannel.id,
          userId: interaction.user.id,
          fallbackAttempted: false,
        },
        ...NODE_OPTIONS,
      },
    });

    const track = result.track;
    const playlist = result.playlist;
    const isPlaylist = !!playlist || (result.tracks?.length > 1);

    if (!track && !playlist) {
      return editOrFollowUp(interaction, '❌ No results found! Try a different song name.');
    }

    const title = playlist?.title || track?.title || 'Unknown';
    const author = track?.author || '';
    const queueSize = player.nodes.get(interaction.guildId)?.tracks?.size || 0;

    if (isPlaylist) {
      return editOrFollowUp(interaction, `📋 Queued **${result.tracks?.length || 0} tracks** from **${title}**!`);
    }

    // Don't send "now playing" here — trackStart event handles it
    // Just confirm the track was queued
    if (queueSize > 0) {
      return editOrFollowUp(interaction, `➕ Added to queue: **${title}** by ${author}`);
    }

    return editOrFollowUp(interaction, `🎵 Loading: **${title}** by ${author}...`);

  } catch (error) {
    logMusicError('[MUSIC] Play error:', error);

    // If YouTube failed, try SoundCloud explicitly
    if (error?.message?.includes('No result') || error?.name === 'NoResultError') {
      console.log('[MUSIC] ⚠️ Primary failed — retrying on SoundCloud...');
      try {
        const result = await player.play(voiceChannel, query, {
          searchEngine: QueryType.SOUNDCLOUD_SEARCH,
          nodeOptions: {
            metadata: {
              channel: interaction.channel,
              originalQuery: query,
              voiceChannelId: voiceChannel.id,
              userId: interaction.user.id,
              fallbackAttempted: true,
            },
            ...NODE_OPTIONS,
          },
        });
        const track = result.track;
        if (track) {
          return editOrFollowUp(interaction, `☁️ Playing from SoundCloud: **${track.title}** by ${track.author}`);
        }
      } catch (scError) {
        logMusicError('[MUSIC] SoundCloud fallback also failed:', scError);
      }
    }

    return editOrFollowUp(interaction, '❌ Could not play that track. Try a different song name!');
  }
}

async function skipMusic(interaction) {
  const queue = player.nodes.get(interaction.guildId);
  if (!queue || !queue.isPlaying()) {
    return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
  }
  const currentTrack = queue.currentTrack;
  queue.node.skip();
  return interaction.reply(`⏭️ Skipped **${currentTrack?.title || 'track'}**`);
}

async function stopMusic(interaction) {
  const queue = player.nodes.get(interaction.guildId);
  if (!queue) {
    return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
  }
  queue.delete();
  return interaction.reply('⏹️ Music stopped and queue cleared!');
}

async function pauseMusic(interaction) {
  const queue = player.nodes.get(interaction.guildId);
  if (!queue || !queue.isPlaying()) {
    return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
  }
  queue.node.setPaused(true);
  return interaction.reply('⏸️ Music paused!');
}

async function resumeMusic(interaction) {
  const queue = player.nodes.get(interaction.guildId);
  if (!queue) {
    return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
  }
  queue.node.setPaused(false);
  return interaction.reply('▶️ Music resumed!');
}

async function showQueue(interaction) {
  const queue = player.nodes.get(interaction.guildId);
  if (!queue || (queue.tracks.size === 0 && !queue.currentTrack)) {
    return interaction.reply({ content: '📭 Queue is empty!', ephemeral: true });
  }

  const current = queue.currentTrack ? `▶️ **${queue.currentTrack.title}** (now playing)\n\n` : '';
  const tracks = queue.tracks.toArray().slice(0, 10)
    .map((t, i) => `${i + 1}. **${t.title}** (${t.duration})`).join('\n');

  return interaction.reply({
    embeds: [{
      color: 0x5865F2,
      title: '🎵 Music Queue',
      description: current + (tracks || 'No upcoming tracks'),
      footer: { text: `${queue.tracks.size} track(s) in queue` },
    }],
  });
}

async function searchMusic(interaction) {
  const query = interaction.options.getString('song');
  if (!query || query.length < 3) return respondAutocompleteSafely(interaction, []);

  if (/^https?:\/\//i.test(query)) return respondAutocompleteSafely(interaction, []);

  const cacheKey = query.toLowerCase().trim();
  const cached = autocompleteCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AUTOCOMPLETE_CACHE_TTL_MS) {
    return respondAutocompleteSafely(interaction, cached.choices);
  }

  try {
    const searchPromise = player.search(query, { searchEngine: QueryType.AUTO });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 1200).unref()
    );
    const results = await Promise.race([searchPromise, timeoutPromise]);
    const choices = results.hasTracks()
      ? results.tracks.slice(0, 10).map(track => ({
          name: `🎵 ${track.title} (${track.duration})`.slice(0, 100),
          value: track.url.slice(0, 100),
        }))
      : [];

    autocompleteCache.set(cacheKey, { timestamp: Date.now(), choices });
    return respondAutocompleteSafely(interaction, choices.slice(0, 10));
  } catch (error) {
    return respondAutocompleteSafely(interaction, []);
  }
}

module.exports = {
  initializePlayer,
  searchMusic,
  playMusic,
  skipMusic,
  stopMusic,
  pauseMusic,
  resumeMusic,
  showQueue,
  getPlayer: () => player,
};


