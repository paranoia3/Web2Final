const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Erkegali:Erkegali123@cluster0.c28yytf.mongodb.net/')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server started: http://localhost:${PORT}`);
});