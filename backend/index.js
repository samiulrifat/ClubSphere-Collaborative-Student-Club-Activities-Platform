require('dotenv').config();
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
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Register routes (order matters: always after middleware, before listen)
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/uploads', express.static('uploads'));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

