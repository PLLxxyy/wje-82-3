const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'concert-fan.db');

async function initDb() {
  const SQL = await initSqlJs();
  let db;
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT,
    city TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    avatar TEXT,
    description TEXT,
    genre TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    artist_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, artist_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS concerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist_id INTEGER NOT NULL,
    venue TEXT NOT NULL,
    city TEXT NOT NULL,
    concert_date DATE NOT NULL,
    poster TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    concert_id INTEGER,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS post_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    image_url TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS post_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    tag TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    parent_id INTEGER,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'approved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reposts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    concert_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    original_price REAL,
    seat_info TEXT,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ticket_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_confirm INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS user_concerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    concert_id INTEGER NOT NULL,
    status TEXT DEFAULT 'attended',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, concert_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const salt = bcrypt.genSaltSync(10);
  const adminPassword = bcrypt.hashSync('admin123', salt);
  
  const adminStmt = db.prepare('SELECT id FROM admins WHERE username = ?');
  adminStmt.bind(['admin']);
  if (!adminStmt.step()) {
    const insertAdmin = db.prepare('INSERT INTO admins (username, password, name) VALUES (?, ?, ?)');
    insertAdmin.bind(['admin', adminPassword, '管理员']);
    insertAdmin.step();
    insertAdmin.free();
  }
  adminStmt.free();

  const artists = [
    ['周杰伦', '华语流行天王', '流行'],
    ['林俊杰', '实力唱将', '流行'],
    ['五月天', '摇滚天团', '摇滚'],
    ['邓紫棋', '铁肺天后', '流行'],
    ['陈奕迅', '歌神', '流行'],
    ['Taylor Swift', '国际巨星', '流行'],
    ['BTS', '防弹少年团', 'K-Pop'],
    ['Blackpink', '粉墨', 'K-Pop'],
    ['薛之谦', '段子手歌手', '流行'],
    ['李荣浩', '音乐才子', '流行']
  ];

  const checkArtist = db.prepare('SELECT id FROM artists WHERE name = ?');
  const insertArtist = db.prepare('INSERT INTO artists (name, description, genre) VALUES (?, ?, ?)');
  for (const a of artists) {
    checkArtist.reset();
    checkArtist.bind([a[0]]);
    if (!checkArtist.step()) {
      insertArtist.reset();
      insertArtist.bind([a[0], a[1], a[2]]);
      insertArtist.step();
    }
  }
  checkArtist.free();
  insertArtist.free();

  const concerts = [
    ['周杰伦「嘉年华」世界巡回演唱会', 1, '国家体育场（鸟巢）', '北京', '2026-07-15'],
    ['林俊杰「JJ20」世界巡回演唱会', 2, '梅赛德斯奔驰文化中心', '上海', '2026-06-20'],
    ['五月天「人生无限公司」演唱会', 3, '天河体育中心', '广州', '2026-08-10'],
    ['邓紫棋「I AM GLORIA」世界巡回演唱会', 4, '华润深圳湾体育中心', '深圳', '2026-09-05'],
    ['陈奕迅「Fear and Dreams」世界巡回演唱会', 5, '奥体中心体育场', '杭州', '2026-07-25'],
    ['Taylor Swift Eras Tour', 6, 'SoFi Stadium', '洛杉矶', '2026-10-15'],
    ['BTS World Tour', 7, '首尔奥林匹克体育场', '首尔', '2026-11-20'],
    ['Blackpink World Tour', 8, '东京巨蛋', '东京', '2026-12-01'],
    ['薛之谦「天外来物」巡回演唱会', 9, '南京奥体中心', '南京', '2026-08-25'],
    ['李荣浩「纵横四海」巡回演唱会', 10, '成都凤凰山体育公园', '成都', '2026-09-20']
  ];

  const checkConcert = db.prepare('SELECT id FROM concerts WHERE title = ?');
  const insertConcert = db.prepare('INSERT INTO concerts (title, artist_id, venue, city, concert_date) VALUES (?, ?, ?, ?, ?)');
  for (const c of concerts) {
    checkConcert.reset();
    checkConcert.bind([c[0]]);
    if (!checkConcert.step()) {
      insertConcert.reset();
      insertConcert.bind([c[0], c[1], c[2], c[3], c[4]]);
      insertConcert.step();
    }
  }
  checkConcert.free();
  insertConcert.free();

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  console.log('数据库初始化完成！');
  console.log('默认管理员账号: admin / admin123');

  db.close();
}

initDb().catch(err => {
  console.error('初始化失败:', err);
  process.exit(1);
});
