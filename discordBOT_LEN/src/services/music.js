// Not forcing ytdl-core to allow discord-player to use better alternatives like youtube-ext or youtubei

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('[YOUTUBEJS]')) return;
  originalConsoleWarn.apply(console, args);
};

const { PermissionFlagsBits } = require('discord.js');
const { Player, QueryType } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const ffmpegPath = require('ffmpeg-static');

let player = null;
const AUTOCOMPLETE_CACHE_TTL_MS = 30_000;
const autocompleteCache = new Map();

function logMusicError(label, error) {
  console.error(label, {
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
    cause: error?.cause,
  });
}

async function respondAutocompleteSafely(interaction, choices) {
  try {
    await interaction.respond(choices);
  } catch (error) {
    logMusicError('Autocomplete respond error:', error);
  }
}

async function initializePlayer(client) {
  player = new Player(client, {
    ffmpegPath: ffmpegPath || undefined,
    ytdlOptions: {
      quality: 'lowestaudio',
      dlChunkSize: 0,
    },
  });

  // Load extractors
  await player.extractors.loadMulti(DefaultExtractors);
  await player.extractors.register(YoutubeiExtractor, {
    overrideBridgeMode: 'yt',
    useYoutubeDL: true,
  });

  // Player events
  player.events.on('error', (queue, error) => {
    logMusicError('Player error:', error);
  });

  player.events.on('playerError', (queue, error) => {
    logMusicError('Player error event:', error);
  });

  player.events.on('connectionError', (queue, error) => {
    logMusicError('Connection error:', error);
  });

  console.log('✅ Music player initialized');
}

async function playMusic(interaction) {
  const query = interaction.options.getString('song');
  const voiceChannel = interaction.member.voice.channel;

  if (!voiceChannel) {
    return interaction.reply({ content: '❌ You must be in a voice channel!', ephemeral: true });
  }

  const botPermissions = voiceChannel.permissionsFor(interaction.guild.members.me);
  if (!botPermissions?.has([
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
  ])) {
    return interaction.reply({
      content: '❌ I need View Channel, Connect, and Speak permissions in that voice channel.',
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  // Determine the correct search engine based on query type
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
    searchEngine = QueryType.SOUNDCLOUD_SEARCH;
  }

  console.log(`[MUSIC] Playing: "${query}" | Engine: ${searchEngine}`);

  try {
    const result = await player.play(voiceChannel, query, {
      searchEngine,
      nodeOptions: {
        metadata: interaction.channel,
        selfDeaf: true,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 60000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 60000,
      }
    });
      const queue = player.nodes.get(interaction.guildId);
      // result may contain different shapes depending on extractor/version: prefer track, then first track, then playlist title
      const track = result.track || (result.tracks && result.tracks[0]) || null;
      const playlistTracksCount = result.playlist?.tracks?.length || (result.tracks ? result.tracks.length : 0);
      const queueSize = queue ? queue.tracks.size : playlistTracksCount || 0;

      const title = track?.title || result.playlist?.title || 'Unknown';
      const extractorId = track?.extractor?.identifier || result.extractor?.identifier || 'unknown';

      console.log(`[MUSIC] Success: "${title}" via ${extractorId} | Queue: ${queueSize}`);

      // Debug: log queue/playback state and attempt to start playback if nothing is playing
      try {
        if (queue) {
          console.log('[MUSIC] Queue exists. isPlaying:', queue.isPlaying());
          if (!queue.isPlaying()) {
            console.log('[MUSIC] Queue not playing — attempting fallback start...');
            try {
              // Force the node to start playing the queue
              await queue.node.play();
              console.log('[MUSIC] Fallback play invoked');
            } catch (e) {
              logMusicError('Fallback play error:', e);
            }
          }
        } else {
          console.log('[MUSIC] No queue object present after play call');
        }
      } catch (e) {
        logMusicError('Queue debug error:', e);
      }

      // Show different message for playlists vs single tracks
      if (searchEngine === QueryType.YOUTUBE_PLAYLIST || searchEngine === QueryType.SOUNDCLOUD_PLAYLIST || playlistTracksCount > 1) {
        return interaction.editReply(`📋 Queued **${queueSize} tracks** from playlist! Now playing: **${title}**`);
      }

      return interaction.editReply(`🎵 Now playing: **${title}** by ${track?.author || 'unknown'}`);
  } catch (error) {
    logMusicError('Play command error:', error);

    // If AUTO failed for a YouTube URL, try with youtubei directly
    if (/youtube\.com|youtu\.be/i.test(query)) {
      try {
        console.log('[MUSIC] Retrying YouTube URL with YOUTUBE search engine...');
        const { track } = await player.play(voiceChannel, query, {
          searchEngine: QueryType.YOUTUBE,
          nodeOptions: {
            metadata: interaction.channel,
            selfDeaf: true,
          }
        });
        console.log(`[MUSIC] Retry success: "${track.title}"`);
        return interaction.editReply(`🎵 Now playing: **${track.title}** by ${track.author}`);
      } catch (retryError) {
        logMusicError('Retry also failed:', retryError);
      }
    }

    return interaction.editReply('❌ Could not play that track. Try searching by song name instead!');
  }
}

async function skipMusic(interaction) {
  const queue = player.nodes.get(interaction.guildId);

  if (!queue || !queue.isPlaying()) {
    return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
  }

  const currentTrack = queue.currentTrack;
  queue.node.skip();

  return interaction.reply(`⏭️ Skipped **${currentTrack.title}**`);
}

async function stopMusic(interaction) {
  const queue = player.nodes.get(interaction.guildId);

  if (!queue) {
    return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
  }

  queue.delete();
  return interaction.reply('⏹️ Music stopped!');
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

  if (!queue || queue.tracks.size === 0) {
    return interaction.reply({ content: '📭 Queue is empty!', ephemeral: true });
  }

  const tracks = queue.tracks.toArray().slice(0, 10).map((t, i) => `${i + 1}. **${t.title}** (${t.duration})`).join('\n');
  const currentTrack = queue.currentTrack ? `Now: **${queue.currentTrack.title}**` : 'None';

  return interaction.reply({
    embeds: [
      {
        color: '#5865F2',
        title: '🎵 Music Queue',
        description: currentTrack + '\n\n' + tracks,
        footer: { text: `Queue size: ${queue.tracks.size}` },
      },
    ],
  });
}

async function searchMusic(interaction) {
  const query = interaction.options.getString('song');
  if (!query || query.length < 3) return respondAutocompleteSafely(interaction, []);

  const cacheKey = query.toLowerCase().trim();
  const cached = autocompleteCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AUTOCOMPLETE_CACHE_TTL_MS) {
    return respondAutocompleteSafely(interaction, cached.choices);
  }

  // Autocomplete should stay cheap; skip URL validation and only search text queries.
  if (/^https?:\/\//i.test(query)) {
    return respondAutocompleteSafely(interaction, []);
  }

  // For text queries: search YouTube once, cache the result, and keep autocomplete fast.
  try {
    const searchPromise = player.search(query, { searchEngine: QueryType.YOUTUBE_SEARCH });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Autocomplete search timed out')), 1200).unref();
    });
    const results = await Promise.race([searchPromise, timeoutPromise]);
    const choices = results.hasTracks()
      ? results.tracks.slice(0, 10).map(track => ({
          name: `🎬 ${track.title} (${track.duration})`.slice(0, 100),
          value: track.url.slice(0, 100),
        }))
      : [];

    autocompleteCache.set(cacheKey, {
      timestamp: Date.now(),
      choices,
    });

    // Discord allows max 25 autocomplete choices
    return respondAutocompleteSafely(interaction, choices.slice(0, 10));
  } catch (error) {
    logMusicError('Autocomplete error:', error);
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
