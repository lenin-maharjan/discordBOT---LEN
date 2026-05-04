const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, '..', '..', 'bot.db');
let dbInstance = null;
let sqlJs = null;

async function initializeDb() {
  if (sqlJs) return;
  sqlJs = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    dbInstance = new sqlJs.Database(buffer);
  } else {
    dbInstance = new sqlJs.Database();
  }

  // Create tables
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      userId TEXT PRIMARY KEY,
      guildId TEXT,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      lastMsg INTEGER DEFAULT 0,
      username TEXT
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      guildId TEXT,
      reason TEXT,
      moderator TEXT,
      timestamp INTEGER
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS mutes (
      userId TEXT PRIMARY KEY,
      guildId TEXT,
      muteEnd INTEGER
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS userHistory (
      userId TEXT,
      guildId TEXT,
      channelId TEXT,
      role TEXT,
      content TEXT,
      timestamp INTEGER,
      PRIMARY KEY (userId, guildId, channelId, timestamp)
    )
  `);

  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS rateLimits (
      userId TEXT PRIMARY KEY,
      callCount INTEGER DEFAULT 0,
      resetTime INTEGER
    )
  `);

  saveDb();
}

function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initDatabase() {
  return initializeDb();
}

function getOrCreateUser(userId, guildId, username = 'Unknown') {
  if (!dbInstance) return { userId, guildId, xp: 0, level: 0, lastMsg: 0, username };

  const result = dbInstance.exec(
    `SELECT * FROM users WHERE userId = ? AND guildId = ?`,
    [userId, guildId]
  );

  if (result.length > 0 && result[0].values.length > 0) {
    const row = result[0].values[0];
    return {
      userId: row[0],
      guildId: row[1],
      xp: row[2],
      level: row[3],
      lastMsg: row[4],
      username: row[5],
    };
  }

  dbInstance.run(
    `INSERT INTO users (userId, guildId, xp, level, lastMsg, username) VALUES (?, ?, 0, 0, 0, ?)`,
    [userId, guildId, username]
  );
  saveDb();

  return { userId, guildId, xp: 0, level: 0, lastMsg: 0, username };
}

function addXP(userId, guildId, amount) {
  if (!dbInstance) return { user: { userId, guildId, xp: 0, level: 0, lastMsg: 0, username: 'Unknown' }, levelUp: false, newLevel: 0 };

  const user = getOrCreateUser(userId, guildId);
  const newXp = user.xp + amount;

  let levelUp = false;
  let newLevel = user.level;

  while (newXp >= 100 * Math.pow(newLevel + 1, 1.5)) {
    newLevel++;
    levelUp = true;
  }

  dbInstance.run(
    `UPDATE users SET xp = ?, level = ? WHERE userId = ? AND guildId = ?`,
    [newXp, newLevel, userId, guildId]
  );
  saveDb();

  return { user: { ...user, xp: newXp, level: newLevel }, levelUp, newLevel };
}

function addWarning(userId, guildId, reason, moderator) {
  if (!dbInstance) return;

  dbInstance.run(
    `INSERT INTO warnings (userId, guildId, reason, moderator, timestamp) VALUES (?, ?, ?, ?, ?)`,
    [userId, guildId, reason, moderator, Date.now()]
  );
  saveDb();
}

function getWarnings(userId, guildId) {
  if (!dbInstance) return [];

  const result = dbInstance.exec(
    `SELECT * FROM warnings WHERE userId = ? AND guildId = ?`,
    [userId, guildId]
  );

  if (result.length === 0) return [];

  const cols = result[0].columns;
  return result[0].values.map(row => ({
    id: row[0],
    userId: row[1],
    guildId: row[2],
    reason: row[3],
    moderator: row[4],
    timestamp: row[5],
  }));
}

function getLeaderboard(guildId) {
  if (!dbInstance) return [];

  try {
    const result = dbInstance.exec(
      `SELECT userId, level, xp FROM users WHERE guildId = ? ORDER BY level DESC, xp DESC LIMIT 10`,
      [guildId]
    );

    if (result.length === 0) return [];

    return result[0].values.map(row => ({
      userId: row[0],
      level: row[1],
      xp: row[2]
    }));
  } catch (err) {
    console.error('Leaderboard query error:', err);
    return [];
  }
}

module.exports = {
  initDatabase,
  getOrCreateUser,
  addXP,
  addWarning,
  getWarnings,
  getLeaderboard,
};
