const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const sharedSession = require('express-socket.io-session');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session config
const sessionMiddleware = session({
  secret: 'your_secret_key2eesee',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
});
app.use(sessionMiddleware);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
io.use(sharedSession(sessionMiddleware, { autoSave: true }));

// User storage
const users = {};

// Auth middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.status(401).redirect('/');
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'error.html'));
});

app.post('/', (req, res) => {
  const { username, password } = req.body;
  if (username && password && password === 'password9900p') {
    req.session.user = { username };
    return res.json({ message: 'Login successful', redirect: '/secure/chat/api' });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

app.get('/secure/chat/api', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/get-username', (req, res) => {
  req.session.user 
    ? res.json({ username: req.session.user.username })
    : res.status(401).json({ message: "Unauthorized" });
});

// Socket.IO handlers
io.on("connection", (socket) => {
  if (!socket.handshake.session?.user) {
    socket.emit("message", { userId: "system", message: "⚠️ Please log in." });
    return socket.disconnect();
  }

  const username = socket.handshake.session.user.username;

  if (Object.values(users).includes(username)) {
    socket.emit("message", { userId: "system", message: "⚠️ Username already in use." });
    return socket.disconnect();
  }

  if (Object.keys(users).length >= 2 ) {
    socket.emit("message", { userId: "system", message: "⚠️ Room is full. Only 2 users allowed." });
    socket.disconnect();
    return;
  }

  users[socket.id] = username;
  io.emit('active-users', Object.values(users)); // New active users update

  socket.emit("message", { userId: "system", message: `Welcome, ${username}!` });
  socket.broadcast.emit("user-connected", { userId: username });

  socket.on("user-message", (data) => {
    io.emit("message", { message: data.message, userId: username });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit('active-users', Object.values(users)); // New active users update
    socket.broadcast.emit("user-disconnected", { userId: username });
  });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

server.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
