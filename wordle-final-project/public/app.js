document.addEventListener('DOMContentLoaded', () => {
  // --- ЧАСТЬ 1: АВТОРИЗАЦИЯ (Оставляем как было) ---
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authMsg = document.getElementById('authMsg');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const logoutBtn = document.getElementById('logoutBtn');

  // Проверка, вошел ли пользователь (из LocalStorage)
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    showGameInterface(JSON.parse(storedUser));
  }

  // Переключение табов
  if(tabLogin) {
    tabLogin.addEventListener('click', () => {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      authMsg.textContent = '';
    });
  }

  if(tabRegister) {
    tabRegister.addEventListener('click', () => {
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      authMsg.textContent = '';
    });
  }

  // Логика регистрации
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
          authMsg.style.color = '#4ade80'; // Green
          authMsg.textContent = 'Success! Please login.';
          setTimeout(() => tabLogin.click(), 1500);
        } else {
          authMsg.style.color = '#f87171'; // Red
          authMsg.textContent = result.message || 'Registration failed';
        }
      } catch (err) { console.error(err); }
    });
  }

  // Логика входа
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json();

        if (response.ok) {
          localStorage.setItem('user', JSON.stringify(result.user));
          showGameInterface(result.user);
        } else {
          authMsg.style.color = '#f87171';
          authMsg.textContent = result.message || 'Login failed';
        }
      } catch (err) { authMsg.textContent = 'Network error.'; }
    });
  }

  // Логика выхода
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user');
      location.reload();
    });
  }

  function showGameInterface(user) {
    document.getElementById('authCard').classList.add('hidden');
    document.getElementById('appCard').classList.remove('hidden');
    document.getElementById('userLine').textContent = `Player: ${user.username}`;
    // ЗАПУСК ИГРЫ
    initGame();
  }


  // --- ЧАСТЬ 2: ЛОГИКА ИГРЫ (НОВОЕ!) ---

  const board = document.getElementById('board');
  const secretWord = "WORLD"; // Пока хардкод для теста (5 букв)
  let currentRow = 0;
  let currentTile = 0;
  const rows = 6;
  const cols = 5;
  let guesses = [
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""]
  ];

  function initGame() {
    createBoard();
    document.addEventListener('keydown', handleKey);
    console.log("Game initialized!");
  }

  // 1. Создание сетки 6x5
  function createBoard() {
    board.innerHTML = ''; // Очистить, если было что-то
    // Мы используем CSS Grid, поэтому просто добавляем 30 дивов
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = document.createElement('div');
        tile.id = `tile-${r}-${c}`;
        tile.classList.add('tile'); // Класс для стилей
        board.appendChild(tile);
      }
    }
  }

  // 2. Обработка нажатий клавиш
  function handleKey(e) {
    const key = e.key.toUpperCase();

    if (key === 'ENTER') {
      checkGuess();
      return;
    }
    if (key === 'BACKSPACE') {
      deleteLetter();
      return;
    }
    if (key.length === 1 && key >= 'A' && key <= 'Z') {
      addLetter(key);
    }
  }

  function addLetter(letter) {
    if (currentTile < 5 && currentRow < 6) {
      const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
      tile.textContent = letter;
      tile.classList.add('active'); // Анимация ввода
      guesses[currentRow][currentTile] = letter;
      currentTile++;
    }
  }

  function deleteLetter() {
    if (currentTile > 0) {
      currentTile--;
      const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
      tile.textContent = '';
      guesses[currentRow][currentTile] = '';
    }
  }

  function checkGuess() {
    if (currentTile !== 5) {
      showMessage("Not enough letters!");
      return;
    }

    const guess = guesses[currentRow].join("");

    // Анимация проверки (покраска)
    for (let i = 0; i < 5; i++) {
      const tile = document.getElementById(`tile-${currentRow}-${i}`);
      const letter = guess[i];

      // Логика цветов
      setTimeout(() => {
        if (letter === secretWord[i]) {
          tile.classList.add('correct'); // Зеленый
        } else if (secretWord.includes(letter)) {
          tile.classList.add('present'); // Желтый
        } else {
          tile.classList.add('absent'); // Серый
        }
      }, i * 200); // Задержка для красоты
    }

    if (guess === secretWord) {
      showMessage("YOU WON! 🎉");
      document.removeEventListener('keydown', handleKey);
    } else {
      if (currentRow >= 5) {
        showMessage(`Game Over! Word was: ${secretWord}`);
      } else {
        currentRow++;
        currentTile = 0;
      }
    }
  }

  function showMessage(msg) {
    const msgBox = document.getElementById('gameMsg');
    msgBox.textContent = msg;
    setTimeout(() => msgBox.textContent = '', 3000);
  }

  // Кнопка "New Game"
  const newGameBtn = document.getElementById('newRandomBtn');
  if(newGameBtn) {
    newGameBtn.addEventListener('click', () => {
      currentRow = 0;
      currentTile = 0;
      guesses = Array(6).fill(null).map(() => Array(5).fill(""));
      createBoard();
      document.addEventListener('keydown', handleKey);
      showMessage("New Game Started!");
    });
  }
});