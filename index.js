const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: null }
}));

// Dummy database of users (username: password)
const usersDb = {
  'User1': 'password9900p',
  'User2': 'password9900p'
};

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).redirect("/")
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'error.html'));
});

app.post('/', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  if (usersDb[username] && usersDb[username] === password) {
    req.session.user = { username };
    return res.json({ message: 'Login successful' });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out, please try again.' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

app.get('/secure/chat/api', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Notify all users including the newly connected one
    io.emit("message", { userId: "system", message: `User ${socket.id} connected` });

    socket.on("user-message", (data) => {
        io.emit("message", data); // Broadcast message to all clients
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        io.emit("message", { userId: "system", message: `User ${socket.id} disconnected` });
    });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
