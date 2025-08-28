require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection failed', err));

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to ClubSphere backend API');
});


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/club', require('./routes/clubRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
