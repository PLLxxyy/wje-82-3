const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'concert-fan-secret-key-2024';
const dbPath = path.join(__dirname, 'concert-fan.db');

const TicketStatus = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  REMOVED: 'removed'
};

const VALID_TICKET_STATUSES = Object.values(TicketStatus);

function isValidTicketStatus(status) {
  return VALID_TICKET_STATUSES.includes(status);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

let db;
let SQL;

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

async function initDatabase() {
  SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  console.log('数据库连接成功');
}

const dbAll = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result;
};

const dbRun = (sql, params = []) => {
  db.run(sql, params);
  const result = db.exec('SELECT last_insert_rowid() as id, changes() as changes')[0].values[0];
  saveDb();
  return { lastInsertRowid: result[0], changes: result[1] };
};

const dbGet = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
};

const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未授权访问' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: '无效的令牌' });
  }
};

const adminAuthenticate = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '未授权访问' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ error: '需要管理员权限' });
    req.admin = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: '无效的令牌' });
  }
};

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, nickname, city } = req.body;
    if (!username || !password || !nickname) {
      return res.status(400).json({ error: '用户名、密码和昵称不能为空' });
    }
    const existing = dbGet('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) return res.status(400).json({ error: '用户名已存在' });
    const hashed = bcrypt.hashSync(password, 10);
    const result = dbRun(
      'INSERT INTO users (username, password, nickname, city) VALUES (?, ?, ?, ?)',
      [username, hashed, nickname, city || '']
    );
    res.json({ success: true, userId: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }
    dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, nickname: user.nickname, city: user.city, avatar: user.avatar } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = dbGet('SELECT * FROM admins WHERE username = ?', [username]);
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }
    const token = jwt.sign({ id: admin.id, username: admin.username, isAdmin: true }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, admin: { id: admin.id, name: admin.name } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/artists', (req, res) => {
  try {
    const artists = dbAll('SELECT * FROM artists ORDER BY name');
    res.json(artists);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/concerts', (req, res) => {
  try {
    const { artistId, city } = req.query;
    let sql = `SELECT c.*, a.name as artist_name FROM concerts c 
               JOIN artists a ON c.artist_id = a.id WHERE 1=1`;
    let params = [];
    if (artistId) { sql += ' AND c.artist_id = ?'; params.push(artistId); }
    if (city) { sql += ' AND c.city LIKE ?'; params.push(`%${city}%`); }
    sql += ' ORDER BY c.concert_date DESC';
    const concerts = dbAll(sql, params);
    res.json(concerts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/user/artists', authenticate, (req, res) => {
  try {
    const { artistIds } = req.body;
    const userId = req.user.id;
    dbRun('DELETE FROM user_artists WHERE user_id = ?', [userId]);
    for (const artistId of artistIds) {
      dbRun('INSERT OR IGNORE INTO user_artists (user_id, artist_id) VALUES (?, ?)', [userId, artistId]);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/user/artists', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const artists = dbAll(
      `SELECT a.* FROM artists a JOIN user_artists ua ON a.id = ua.artist_id 
       WHERE ua.user_id = ? ORDER BY a.name`,
      [userId]
    );
    res.json(artists);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/user/followed-artist-ids', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const rows = dbAll('SELECT artist_id FROM user_artists WHERE user_id = ?', [userId]);
    res.json(rows.map(r => r.artist_id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/feed', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const posts = dbAll(`
      SELECT p.*, u.nickname as user_nickname, u.avatar as user_avatar,
             c.title as concert_title, c.concert_date, c.venue, c.city, a.name as artist_name,
             (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
             (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) as comment_count,
             (SELECT COUNT(*) FROM reposts r WHERE r.post_id = p.id) as repost_count,
             EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as liked,
             EXISTS(SELECT 1 FROM reposts r WHERE r.post_id = p.id AND r.user_id = ?) as reposted
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN concerts c ON p.concert_id = c.id
      LEFT JOIN artists a ON c.artist_id = a.id
      WHERE p.status = 'approved' AND (
        p.concert_id IN (SELECT concert_id FROM concerts WHERE artist_id IN 
          (SELECT artist_id FROM user_artists WHERE user_id = ?))
        OR p.user_id = ?
        OR p.user_id IN (SELECT user_id FROM user_artists WHERE artist_id IN 
          (SELECT artist_id FROM user_artists WHERE user_id = ?))
      )
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `, [userId, userId, userId, userId, userId, limit, offset]);

    for (const post of posts) {
      post.images = dbAll('SELECT image_url FROM post_images WHERE post_id = ?', [post.id]);
      post.tags = dbAll('SELECT tag FROM post_tags WHERE post_id = ?', [post.id]);
    }
    
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/posts', authenticate, upload.array('images', 9), (req, res) => {
  try {
    const userId = req.user.id;
    const { content, concertId, tags } = req.body;
    
    const result = dbRun(
      'INSERT INTO posts (user_id, content, concert_id, status) VALUES (?, ?, ?, ?)',
      [userId, content, concertId || null, 'approved']
    );
    
    const postId = result.lastInsertRowid;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        dbRun('INSERT INTO post_images (post_id, image_url) VALUES (?, ?)',
          [postId, `/uploads/${file.filename}`]);
      }
    }
    
    if (tags && tags.length > 0) {
      const tagList = typeof tags === 'string' ? JSON.parse(tags) : tags;
      for (const tag of tagList) {
        dbRun('INSERT INTO post_tags (post_id, tag) VALUES (?, ?)', [postId, tag]);
      }
    }
    
    res.json({ success: true, postId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/posts/:id/like', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const existing = dbGet('SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
    let liked;
    if (existing) {
      dbRun('DELETE FROM likes WHERE id = ?', [existing.id]);
      liked = false;
    } else {
      dbRun('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      liked = true;
    }
    const likeCount = dbGet('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]).count;
    res.json({ liked, likeCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/posts/:id/repost', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { content } = req.body;
    const existing = dbGet('SELECT id FROM reposts WHERE user_id = ? AND post_id = ?', [userId, postId]);
    let reposted;
    if (existing) {
      dbRun('DELETE FROM reposts WHERE id = ?', [existing.id]);
      reposted = false;
    } else {
      dbRun('INSERT INTO reposts (user_id, post_id, content) VALUES (?, ?, ?)', [userId, postId, content || null]);
      reposted = true;
    }
    const repostCount = dbGet('SELECT COUNT(*) as count FROM reposts WHERE post_id = ?', [postId]).count;
    res.json({ reposted, repostCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/posts/:id/comments', (req, res) => {
  try {
    const postId = req.params.id;
    const comments = dbAll(`
      SELECT c.*, u.nickname as user_nickname, u.avatar as user_avatar
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.status = 'approved'
      ORDER BY c.created_at ASC
    `, [postId]);
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/posts/:id/comments', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { content, parentId } = req.body;
    const result = dbRun(
      'INSERT INTO comments (user_id, post_id, parent_id, content) VALUES (?, ?, ?, ?)',
      [userId, postId, parentId || null, content]
    );
    const comment = dbGet(`
      SELECT c.*, u.nickname as user_nickname, u.avatar as user_avatar
      FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
    `, [result.lastInsertRowid]);
    res.json(comment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/messages', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = dbAll(`
      SELECT 
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.nickname as other_nickname, u.avatar as other_avatar,
        MAX(m.created_at) as last_message_time,
        SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM messages m JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY other_user_id
      ORDER BY last_message_time DESC
    `, [userId, userId, userId, userId, userId]);
    
    for (const conv of conversations) {
      const lastMsg = dbGet(`
        SELECT content FROM messages m2 
        WHERE (m2.sender_id = ? AND m2.receiver_id = ?) 
           OR (m2.sender_id = ? AND m2.receiver_id = ?)
        ORDER BY m2.created_at DESC LIMIT 1
      `, [userId, conv.other_user_id, conv.other_user_id, userId]);
      conv.last_message = lastMsg?.content || '';
    }
    
    res.json(conversations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/messages/:userId', authenticate, (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    dbRun(
      'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?',
      [otherUserId, currentUserId]
    );
    const messages = dbAll(`
      SELECT m.*, u.nickname as sender_nickname
      FROM messages m JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [currentUserId, otherUserId, otherUserId, currentUserId]);
    const otherUser = dbGet('SELECT id, nickname, avatar, city FROM users WHERE id = ?', [otherUserId]);
    res.json({ messages, otherUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/messages/:userId', authenticate, (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.userId;
    const { content } = req.body;
    const result = dbRun(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content]
    );
    const message = dbGet(`
      SELECT m.*, u.nickname as sender_nickname
      FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?
    `, [result.lastInsertRowid]);
    res.json(message);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users/same-city', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const user = dbGet('SELECT city FROM users WHERE id = ?', [userId]);
    if (!user || !user.city) return res.json([]);
    
    const users = dbAll(`
      SELECT u.*, 
        (SELECT GROUP_CONCAT(a.name, ', ') FROM user_artists ua 
         JOIN artists a ON ua.artist_id = a.id WHERE ua.user_id = u.id) as artists
      FROM users u
      WHERE u.city = ? AND u.id != ?
      ORDER BY u.last_login DESC
    `, [user.city, userId]);
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const userId = req.params.id;
    const user = dbGet(`
      SELECT u.id, u.nickname, u.avatar, u.city, u.bio, u.created_at
      FROM users u WHERE u.id = ?
    `, [userId]);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    
    const concerts = dbAll(`
      SELECT c.*, a.name as artist_name FROM user_concerts uc
      JOIN concerts c ON uc.concert_id = c.id
      JOIN artists a ON c.artist_id = a.id
      WHERE uc.user_id = ? AND uc.status = 'attended'
      ORDER BY c.concert_date DESC
    `, [userId]);
    
    const posts = dbAll(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM reposts r WHERE r.post_id = p.id) as repost_count
      FROM posts p
      WHERE p.user_id = ? AND p.status = 'approved'
      ORDER BY p.created_at DESC
    `, [userId]);
    
    for (const post of posts) {
      post.images = dbAll('SELECT image_url FROM post_images WHERE post_id = ?', [post.id]);
    }
    
    res.json({ user, concerts, posts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tickets', (req, res) => {
  try {
    const { artist, city } = req.query;
    let sql = `
      SELECT t.*, u.nickname as seller_nickname, u.avatar as seller_avatar, u.id as seller_id,
             c.title as concert_title, c.venue, c.city, c.concert_date, a.name as artist_name
      FROM tickets t JOIN users u ON t.user_id = u.id
      JOIN concerts c ON t.concert_id = c.id
      JOIN artists a ON c.artist_id = a.id
      WHERE t.status = '${TicketStatus.AVAILABLE}'
    `;
    const params = [];
    if (artist) { sql += ' AND a.name = ?'; params.push(artist); }
    if (city) { sql += ' AND c.city LIKE ?'; params.push(`%${city}%`); }
    sql += ' ORDER BY t.created_at DESC';
    const tickets = dbAll(sql, params);
    
    const artists = dbAll('SELECT DISTINCT a.name FROM tickets t JOIN concerts c ON t.concert_id = c.id JOIN artists a ON c.artist_id = a.id WHERE t.status = ? ORDER BY a.name', [TicketStatus.AVAILABLE]).map(a => a.name);
    const cities = dbAll('SELECT DISTINCT c.city FROM tickets t JOIN concerts c ON t.concert_id = c.id WHERE t.status = ? ORDER BY c.city', [TicketStatus.AVAILABLE]).map(c => c.city);
    
    res.json({ tickets, artists, cities });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tickets', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { concertId, title, description, price, originalPrice, seatInfo } = req.body;
    const result = dbRun(
      `INSERT INTO tickets (user_id, concert_id, title, description, price, original_price, seat_info)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, concertId, title, description, price, originalPrice, seatInfo]
    );
    res.json({ success: true, ticketId: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tickets/:id', (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = dbGet(`
      SELECT t.*, u.nickname as seller_nickname, u.avatar as seller_avatar, u.id as seller_id,
             c.title as concert_title, c.venue, c.city, c.concert_date, a.name as artist_name
      FROM tickets t JOIN users u ON t.user_id = u.id
      JOIN concerts c ON t.concert_id = c.id
      JOIN artists a ON c.artist_id = a.id
      WHERE t.id = ?
    `, [ticketId]);
    
    const messages = dbAll(`
      SELECT tm.*, u.nickname as user_nickname, u.avatar as user_avatar
      FROM ticket_messages tm JOIN users u ON tm.user_id = u.id
      WHERE tm.ticket_id = ? ORDER BY tm.created_at ASC
    `, [ticketId]);
    
    res.json({ ticket, messages });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tickets/:id/messages', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;
    const { content, isConfirm } = req.body;
    const result = dbRun(
      'INSERT INTO ticket_messages (ticket_id, user_id, content, is_confirm) VALUES (?, ?, ?, ?)',
      [ticketId, userId, content, isConfirm ? 1 : 0]
    );
    const message = dbGet(`
      SELECT tm.*, u.nickname as user_nickname, u.avatar as user_avatar
      FROM ticket_messages tm JOIN users u ON tm.user_id = u.id WHERE tm.id = ?
    `, [result.lastInsertRowid]);
    res.json(message);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/tickets/:id/mark-sold', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const ticketId = req.params.id;
    const ticket = dbGet('SELECT user_id FROM tickets WHERE id = ?', [ticketId]);
    if (!ticket || ticket.user_id !== userId) {
      return res.status(403).json({ error: '无权操作此票务' });
    }
    dbRun('UPDATE tickets SET status = ? WHERE id = ?', [TicketStatus.SOLD, ticketId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/user/concerts', authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { concertId } = req.body;
    dbRun(
      'INSERT OR IGNORE INTO user_concerts (user_id, concert_id, status) VALUES (?, ?, ?)',
      [userId, concertId, 'attended']
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/stats', adminAuthenticate, (req, res) => {
  try {
    const totalUsers = dbGet('SELECT COUNT(*) as count FROM users');
    const totalPosts = dbGet('SELECT COUNT(*) as count FROM posts');
    const totalTickets = dbGet('SELECT COUNT(*) as count FROM tickets');
    
    const todayPosts = dbGet(
      "SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = DATE('now')"
    );
    const activeUsers = dbGet(
      "SELECT COUNT(DISTINCT user_id) as count FROM posts WHERE created_at >= DATETIME('now', '-7 days')"
    );
    
    const dailyStats = dbAll(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM posts 
      WHERE created_at >= DATETIME('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    res.json({
      totalUsers: totalUsers.count,
      totalPosts: totalPosts.count,
      totalTickets: totalTickets.count,
      todayPosts: todayPosts.count,
      activeUsers: activeUsers.count,
      dailyStats
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/posts', adminAuthenticate, (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const posts = dbAll(`
      SELECT p.*, u.nickname as user_nickname, c.title as concert_title
      FROM posts p JOIN users u ON p.user_id = u.id
      LEFT JOIN concerts c ON p.concert_id = c.id
      WHERE p.status = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `, [status, limit, offset]);
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/posts/:id/approve', adminAuthenticate, (req, res) => {
  try {
    const postId = req.params.id;
    dbRun('UPDATE posts SET status = ? WHERE id = ?', ['approved', postId]);
    dbRun(
      'INSERT INTO audit_logs (admin_id, target_type, target_id, action) VALUES (?, ?, ?, ?)',
      [req.admin.id, 'post', postId, 'approve']
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/posts/:id/reject', adminAuthenticate, (req, res) => {
  try {
    const postId = req.params.id;
    const { reason } = req.body;
    dbRun('UPDATE posts SET status = ? WHERE id = ?', ['rejected', postId]);
    dbRun(
      'INSERT INTO audit_logs (admin_id, target_type, target_id, action, reason) VALUES (?, ?, ?, ?, ?)',
      [req.admin.id, 'post', postId, 'reject', reason]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/tickets', adminAuthenticate, (req, res) => {
  try {
    const { status = TicketStatus.AVAILABLE, page = 1, limit = 20 } = req.query;
    if (!isValidTicketStatus(status)) {
      return res.status(400).json({ error: '无效的票务状态' });
    }
    const offset = (page - 1) * limit;
    const tickets = dbAll(`
      SELECT t.*, u.nickname as seller_nickname, c.title as concert_title
      FROM tickets t JOIN users u ON t.user_id = u.id
      JOIN concerts c ON t.concert_id = c.id
      WHERE t.status = ? ORDER BY t.created_at DESC LIMIT ? OFFSET ?
    `, [status, limit, offset]);
    res.json(tickets);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/tickets/:id/remove', adminAuthenticate, (req, res) => {
  try {
    const ticketId = req.params.id;
    const { reason } = req.body;
    dbRun('UPDATE tickets SET status = ? WHERE id = ?', [TicketStatus.REMOVED, ticketId]);
    dbRun(
      'INSERT INTO audit_logs (admin_id, target_type, target_id, action, reason) VALUES (?, ?, ?, ?, ?)',
      [req.admin.id, 'ticket', ticketId, 'remove', reason]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/user/profile', authenticate, (req, res) => {
  try {
    const user = dbGet(
      'SELECT id, username, nickname, avatar, city, bio FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/user/profile', authenticate, (req, res) => {
  try {
    const { nickname, city, bio, avatar } = req.body;
    dbRun(
      'UPDATE users SET nickname = ?, city = ?, bio = ?, avatar = ? WHERE id = ?',
      [nickname, city, bio, avatar, req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users/search', authenticate, (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = dbAll(`
      SELECT u.id, u.nickname, u.avatar, u.city
      FROM users u
      WHERE u.nickname LIKE ? OR u.username LIKE ?
      LIMIT 20
    `, [`%${q}%`, `%${q}%`]);
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

if (fs.existsSync(frontendDist)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
