const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 3000;

const cors = require('cors');
const { subscribe } = require('diagnostics_channel');
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const USERS_PATH = path.join(__dirname, 'users.json');
const POSTS_PATH = path.join(__dirname, 'posts.json');

function readJson(file) {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
function writeJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Эндпоинт для отдачи users.json (для фронта)
app.get('/users.json', (req, res) => {
    const usersPath = path.join(__dirname, 'users.json');

    fs.readFile(usersPath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'users.json not found' });
        }

        try {
            const users = JSON.parse(data);

            // Удаляем поле password у каждого пользователя
            const sanitizedUsers = users.map(user => {
                const { password, ...rest } = user;
                return rest;
            });

            res.setHeader('Content-Type', 'application/json');
            res.json(sanitizedUsers);
        } catch (e) {
            res.status(500).json({ error: 'Invalid JSON in users.json' });
        }
    });
});

// Эндпоинт для posts.json
app.get('/posts.json', (req, res) => {
    const postsPath = path.join(__dirname, 'posts.json');

    fs.readFile(postsPath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'posts.json not found' });
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    });
});;

// Регистрация
app.post('/api/register', (req, res) => {
    const { login, password } = req.body;
    const name = login;
    let users = readJson(USERS_PATH);
    
    if (users.find(u => u.login === login)) {
        return res.status(409).json({ error: 'User exists' });
    }
    
    const id = Date.now();
    
    const defaultUserFields = {
        about: "",
        avatar: "http://localhost:3000/uploads/Profile.svg",
        subscriptions: []
    };
    
    const newUser = {
        id,
        login,
        password,
        name,
        ...defaultUserFields
    };
    
    users.push(newUser);
    writeJson(USERS_PATH, users);

    const userResponse = {
        id,
        login,
        name,
        ...defaultUserFields
    };
    
    res.cookie('user_id', id, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
    }).json(userResponse);
});

// Логин
app.post('/api/login', (req, res) => {
    const { login, password } = req.body;
    let users = readJson(USERS_PATH);
    const user = users.find(u => u.login === login && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const userResponse = {
        id: user.id,
        login: user.login,
        name: user.name,
        about: user.about,
        avatar: user.avatar,
        subscriptions: user.subscriptions
    };
    
    res.cookie('user_id', user.id, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
    }).json(userResponse);
});

// Логаут
app.post('/api/logout', (req, res) => {
    res.clearCookie('user_id');
    res.json({ success: true });
});

// Получить посты (лента или все по поиску)
app.get('/api/posts', (req, res) => {
  let posts = readJson(POSTS_PATH);
  let users = readJson(USERS_PATH);
  const search = (req.query.search || '').toLowerCase().trim();
  if (search) {
    // Вернуть все посты, совпадающие по содержимому или имени автора
    const found = posts.filter(post => {
      const content = (post.content || '').toLowerCase();
      const author = users.find(u => u.id === post.author_id);
      const authorName = (author && author.name ? author.name : '').toLowerCase();
      return content.includes(search) || authorName.includes(search);
    }).map(post => {
      const author = users.find(u => u.id === post.author_id);
      const enrichedComments = (post.comments || []).map(comment => {
        const commenter = users.find(u => u.id === comment.userId);
        return {
          ...comment,
          user_name: commenter?.name || 'Пользователь',
          user_avatar: commenter?.avatar || ''
        };
      });
      return {
        ...post,
        author_name: author?.name || 'Пользователь',
        author_avatar: author?.avatar || '',
        comments: enrichedComments
      };
    });
    return res.json(found);
  }
  // Лента (только подписки и свои)
  const userId = Number(req.cookies.user_id);
  if (!userId) return res.json([]);
  const user = users.find(u => u.id === userId);
  if (!user) return res.json([]);
  const allowedAuthorIds = new Set([user.id, ...(user.subscriptions || [])]);
  const visiblePosts = posts
    .filter(post => allowedAuthorIds.has(post.author_id))
    .map(post => {
      const author = users.find(u => u.id === post.author_id);
      const enrichedComments = (post.comments || []).map(comment => {
        const commenter = users.find(u => u.id === comment.userId);
        return {
          ...comment,
          user_name: commenter?.name || 'Пользователь',
          user_avatar: commenter?.avatar || ''
        };
      });
      return {
        ...post,
        author_name: author?.name || 'Пользователь',
        author_avatar: author?.avatar || '',
        comments: enrichedComments
      };
    });
  res.json(visiblePosts);
});

// Получить все посты пользователя по id (для профиля)
app.get('/api/user/:id/posts', (req, res) => {
  const userId = String(req.params.id);
  let posts = readJson(POSTS_PATH);
  let users = readJson(USERS_PATH);
  const user = users.find(u => String(u.id) === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const userPosts = posts.filter(p => String(p.author_id) === userId).map(post => {
    const author = users.find(u => u.id === post.author_id);
    const enrichedComments = (post.comments || []).map(comment => {
      const commenter = users.find(u => u.id === comment.userId);
      return {
        ...comment,
        user_name: commenter?.name || 'Пользователь',
        user_avatar: commenter?.avatar || ''
      };
    });
    return {
      ...post,
      author_name: author?.name || 'Пользователь',
      author_avatar: author?.avatar || '',
      comments: enrichedComments
    };
  });
  res.json(userPosts);
});

// Создание нового поста
app.post('/api/posts', (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authorized' });
  let posts = readJson(POSTS_PATH);
  const { content } = req.body;
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Пустой пост' });
  }
  const newPost = {
    id: Date.now(),
    author_id: user.id,
    author_name: user.name || 'Пользователь',
    author_avatar: user.avatar || '/src/images/Profile.svg',
    content: content.trim(),
    likes: [],
    comments: [],
    created_at: new Date().toISOString()
  };
  posts.unshift(newPost);
  writeJson(POSTS_PATH, posts);
  res.json(newPost);
});

// Удаление поста (только автор)
app.delete('/api/posts/:id', (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authorized' });
  let posts = readJson(POSTS_PATH);
  const postId = Number(req.params.id);
  const post = posts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ error: 'Пост не найден' });
  if (post.author_id !== user.id) return res.status(403).json({ error: 'Можно удалять только свои посты' });
  posts = posts.filter(p => p.id !== postId);
  writeJson(POSTS_PATH, posts);
  res.json({ success: true });
});

// Поиск по постам и пользователям
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const posts = readJson(POSTS_PATH);
  const users = readJson(USERS_PATH);
  // Поиск пользователей по имени
  const foundUsers = users.filter(u => (u.name || '').toLowerCase().includes(q));
  // Поиск постов по содержимому и имени автора
  const foundPosts = posts.filter(post => {
    const content = (post.content || '').toLowerCase();
    const author = users.find(u => u.id === post.author_id);
    const authorName = (author && author.name ? author.name : '').toLowerCase();
    return content.includes(q) || authorName.includes(q);
  }).map(post => {
    const author = users.find(u => u.id === post.author_id);
    const enrichedComments = (post.comments || []).map(comment => {
      const commenter = users.find(u => u.id === comment.userId);
      return {
        ...comment,
        author_name: commenter?.name || 'Пользователь',
        author_avatar: commenter?.avatar || ''
      };
    });
    return {
      ...post,
      author_name: author?.name || 'Пользователь',
      author_avatar: author?.avatar || '',
      comments: enrichedComments
    };
  });
  res.json({ users: foundUsers, posts: foundPosts });
});

// Лайк/анлайк (ожидает postId и userId)
app.post('/api/likes', (req, res) => {
    const userId = Number(req.cookies.user_id);
    if (!userId && userId !== 0) return res.status(401).json({ error: 'Not authorized' });
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ error: 'No postId' });
    let posts = readJson(POSTS_PATH);
    const post = posts.find(p => Number(p.id) === Number(postId));
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // Приводим все id к числу, фильтруем дубликаты
    post.likes = (post.likes || []).map(id => Number(id)).filter((id, idx, arr) => arr.indexOf(id) === idx && !isNaN(id));
    const hasLike = post.likes.includes(userId);
    if (hasLike) {
        post.likes = post.likes.filter(id => id !== userId);
    } else {
        post.likes.push(Number(userId));
    }
    writeJson(POSTS_PATH, posts);
    res.json({ success: true, likes: post.likes });
});

// Добавить комментарий
app.post('/api/comments', (req, res) => {
    const userId = Number(req.cookies.user_id);
    if (!userId) return res.status(401).json({ error: 'Not authorized' });
    const { postId, content } = req.body;
    let posts = readJson(POSTS_PATH);
    let users = readJson(USERS_PATH);
    const post = posts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments = post.comments || [];
    const user = users.find(u => Number(u.id) === userId);
    let commentId = Date.now();
    // Проверка уникальности id среди всех комментариев
    const allComments = posts.flatMap(p => p.comments || []);
    while (allComments.some(c => Number(c.id) === commentId)) {
        commentId++;
    }
    post.comments.push({
        id: commentId,
        userId,
        content,
        user_name: user && user.name ? user.name : 'Пользователь',
        user_avatar: user && user.avatar ? user.avatar : '/src/images/Profile.svg'
    });
    writeJson(POSTS_PATH, posts);
    res.json({ success: true, commentId });
});

// Удаление комментария (только автор)
app.delete('/api/comments/:commentId', (req, res) => {
    const userId = Number(req.cookies.user_id);
    if (!userId) return res.status(401).json({ error: 'Not authorized' });
    const commentId = Number(req.params.commentId);
    let posts = readJson(POSTS_PATH);
    let found = false;
    for (const post of posts) {
        if (!post.comments) continue;
        const idx = post.comments.findIndex(c => Number(c.id) === commentId);
        if (idx !== -1) {
            const comment = post.comments[idx];
            if (Number(comment.userId) !== userId) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            post.comments.splice(idx, 1);
            found = true;
            break;
        }
    }
    if (found) {
        writeJson(POSTS_PATH, posts);
        return res.json({ success: true });
    } else {
        return res.status(404).json({ error: 'Comment not found' });
    }
});

// Получить пользователя по id
app.get('/api/user/:userId', (req, res) => {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(401).json({ error: 'Not authorized' });
    let users = readJson(USERS_PATH);
    const user = users.find(u => u.id == userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, login: user.login, name: user.name, about: user.about, avatar: user.avatar, subscriptions: user.subscriptions});
});

// PATCH: смена имени пользователя
app.patch('/api/user/name', (req, res) => {
    const { name } = req.body;
    const userId = req.cookies.user_id;
    if (!userId) return res.status(401).json({ error: 'Not authorized' });
    if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Invalid name' });
    let users = readJson(USERS_PATH);
    const user = users.find(u => String(u.id) === String(userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.name = name.trim();
    writeJson(USERS_PATH, users);
    res.json({ success: true, name: user.name });
});

// PATCH: смена "Обо мне"
app.patch('/api/user/about', (req, res) => {
    const { about } = req.body;
    const userId = req.cookies.user_id;
    if (!userId) return res.status(401).json({ error: 'Not authorized' });
    if (typeof about !== 'string') return res.status(400).json({ error: 'Invalid about' });
    let users = readJson(USERS_PATH);
    const user = users.find(u => String(u.id) === String(userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.about = about.trim();
    writeJson(USERS_PATH, users);
    res.json({ success: true, about: user.about });
});

// Подписка/отписка на пользователя
app.post('/api/subscribe', (req, res) => {
    const userId = req.cookies.user_id;
    let { targetId, action } = req.body; // action: 'subscribe' | 'unsubscribe'
    if (!userId) return res.status(401).json({ error: 'Not authorized' });
    let users = readJson(USERS_PATH);
    const user = users.find(u => u.id == userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.subscriptions = user.subscriptions || [];
    // Приводим targetId и все id к числу для корректного сравнения
    targetId = Number(targetId);
    user.subscriptions = user.subscriptions.map(Number).filter(id => !isNaN(id));
    if (action === 'subscribe') {
        if (!user.subscriptions.includes(targetId)) user.subscriptions.push(targetId);
    } else if (action === 'unsubscribe') {
        user.subscriptions = user.subscriptions.filter(id => id !== targetId);
    }
    writeJson(USERS_PATH, users);
    res.json({ success: true, subscriptions: user.subscriptions });
});

// Загрузка аватара пользователя (dataURL -> файл на диске)
app.post('/api/user/avatar', (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not authorized' });
  const { dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid image' });
  }
  // data:image/<ext>;base64,<data>
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Unsupported image format' });
  let ext = match[1];
  if (ext === 'jpeg') ext = 'jpg';
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');

  // Ensure uploads dir exists
  const publicDir = path.join(__dirname, 'public');
  const uploadsDir = path.join(publicDir, 'uploads');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

  const fileName = `${user.id}_${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  try {
    fs.writeFileSync(filePath, buffer);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to save image' });
  }

  // Update user record
  const users = readJson(USERS_PATH);
  const u = users.find(u => String(u.id) === String(user.id));
  if (!u) return res.status(404).json({ error: 'User not found' });
  // Store absolute URL to ensure it loads from API host
  u.avatar = `http://localhost:${PORT}/uploads/${fileName}`;
  writeJson(USERS_PATH, users);
  return res.json({ success: true, avatar: u.avatar });
});

// Получить пользователя по req (cookie user_id)
function getUserFromRequest(req) {
  const userId = Number(req.cookies.user_id);
  if (!userId) return null;
  const users = readJson(USERS_PATH);
  return users.find(u => u.id === userId) || null;
}

app.listen(PORT, () => console.log('Simple server running on port', PORT));
