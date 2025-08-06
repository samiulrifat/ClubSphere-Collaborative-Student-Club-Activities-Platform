const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import route handlers
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const clubRoutes = require('./routes/club');
const announcementRoutes = require('./routes/announcement');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect('mongodb://localhost:27017/clubsphere', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Register routes (order matters: always after middleware, before listen)
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/announcements', announcementRoutes);
// Start the server
app.listen(5000, () => console.log('Server started on port 5000'));
