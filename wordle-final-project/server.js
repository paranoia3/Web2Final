const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors'); // Рекомендую добавить npm install cors
require('dotenv').config();

// Импорт моделей
const User = require('./src/models/User');
const Game = require('./src/models/Game');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. MIDDLEWARE (Исправляем ошибки чтения данных) ---
app.use(cors()); // Разрешает запросы, если фронтенд на другом порту
app.use(express.json()); // ВАЖНО: Позволяет серверу читать JSON из fetch()
app.use(express.urlencoded({ extended: true }));

// --- 2. ПОДКЛЮЧЕНИЕ К БАЗЕ ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Atlas Connected'))
    .catch(err => console.error('❌ DB Connection Error:', err));

// --- 3. РАЗДАЧА ФРОНТЕНДА ---
// Сервер говорит: "Ищи файлы index.html, styles.css в папке public"
app.use(express.static(path.join(__dirname, 'public')));

// --- 4. API РОУТЫ (Бэкенд логика) ---

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Register request:', req.body); // Лог для отладки
    const { username, email, password } = req.body;

    // Проверка дубликатов
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User or Email already exists' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error during registration' });
  }
});

// Логин
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password }); // В реальном проекте используй bcrypt для сравнения хешей!

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Возвращаем данные пользователя клиенту
    res.json({
      message: 'Login successful',
      user: { id: user._id, username: user.username }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error during login' });
  }
});

// Любой другой запрос отправляет index.html (для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- ЗАПУСК ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});