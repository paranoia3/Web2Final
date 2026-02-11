const mongoose = require('mongoose');

const DB_URI = 'mongodb+srv://Erkegali:Erkegali123@cluster0.c28yytf.mongodb.net/';

mongoose.connect(DB_URI)
    .then(() => console.log('✅ Успешное подключение к MongoDB'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));