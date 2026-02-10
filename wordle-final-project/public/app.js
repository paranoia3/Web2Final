document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 App Started");

  // Ссылки на элементы
  const authCard = document.getElementById('authCard');
  const appCard = document.getElementById('appCard');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const authMsg = document.getElementById('authMsg');

  // Игра
  const logoutBtn = document.getElementById('logoutBtn');
  const newGameBtn = document.getElementById('newGameBtn');
  const boardDiv = document.getElementById('board');
  const gameMsg = document.getElementById('gameMsg');
  const themeBtn = document.getElementById('themeToggle');

  // 1. Проверка входа
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      showGame(user);
    } catch (e) { localStorage.removeItem('user'); showAuth(); }
  } else {
    showAuth();
  }

  // 2. Функции переключения
  function showAuth() {
    authCard.classList.remove('hidden');
    appCard.classList.add('hidden');
    document.removeEventListener('keydown', handleKey);
  }

  function showGame(user) {
    authCard.classList.add('hidden');
    appCard.classList.remove('hidden');
    document.getElementById('userLine').textContent = `Player: ${user.username}`;

    // ВАЖНО: Запуск игры с небольшой задержкой, чтобы успела отрисоваться карточка
    setTimeout(initGame, 50);
  }

  // 3. Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user');
      location.reload(); // Перезагружаем страницу для чистого выхода
    });
  }

  // 4. Логика форм
  tabLogin.addEventListener('click', () => {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  });

  tabRegister.addEventListener('click', () => {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm));
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(result.user));
        showGame(result.user);
      } else {
        authMsg.textContent = result.message;
        authMsg.style.color = 'red';
      }
    } catch (err) { console.error(err); }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(registerForm));
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        authMsg.textContent = "Success! Login now.";
        authMsg.style.color = "green";
        setTimeout(() => tabLogin.click(), 1000);
      } else {
        authMsg.textContent = "Error registering";
        authMsg.style.color = "red";
      }
    } catch (err) { console.error(err); }
  });

  // 5. ИГРОВАЯ ЛОГИКА
  const secretWord = "WORLD";
  let currentRow = 0;
  let currentTile = 0;
  const rows = 6;
  const cols = 5;
  let guesses = [];
  let isGameOver = false;

  function initGame() {
    console.log("Game Init...");
    currentRow = 0;
    currentTile = 0;
    isGameOver = false;
    guesses = Array(6).fill(null).map(() => Array(5).fill(""));
    gameMsg.textContent = "";

    // Строим сетку
    boardDiv.innerHTML = '';
    for (let r = 0; r < rows; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'game-row';
      for (let c = 0; c < cols; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.id = `tile-${r}-${c}`;
        rowDiv.appendChild(tile);
      }
      boardDiv.appendChild(rowDiv);
    }

    document.removeEventListener('keydown', handleKey);
    document.addEventListener('keydown', handleKey);
  }

  function handleKey(e) {
    if (isGameOver) return;
    const key = e.key.toUpperCase();
    if (key === 'ENTER') submitGuess();
    else if (key === 'BACKSPACE') deleteLetter();
    else if (key.length === 1 && key >= 'A' && key <= 'Z') addLetter(key);
  }

  function addLetter(letter) {
    if (currentTile < cols && currentRow < rows) {
      const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
      tile.textContent = letter;
      tile.classList.add('active');
      guesses[currentRow][currentTile] = letter;
      currentTile++;
    }
  }

  function deleteLetter() {
    if (currentTile > 0) {
      currentTile--;
      const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
      tile.textContent = '';
      tile.classList.remove('active');
      guesses[currentRow][currentTile] = '';
    }
  }

  function submitGuess() {
    if (currentTile !== cols) return;

    const guess = guesses[currentRow].join("");

    for (let i = 0; i < cols; i++) {
      const tile = document.getElementById(`tile-${currentRow}-${i}`);
      const letter = guess[i];
      setTimeout(() => {
        tile.classList.remove('active');
        if (letter === secretWord[i]) tile.classList.add('correct');
        else if (secretWord.includes(letter)) tile.classList.add('present');
        else tile.classList.add('absent');
      }, i * 200);
    }

    if (guess === secretWord) {
      gameMsg.textContent = "VICTORY! 🎉";
      gameMsg.style.color = "#22c55e";
      isGameOver = true;
    } else {
      if (currentRow >= rows - 1) {
        gameMsg.textContent = "GAME OVER";
        gameMsg.style.color = "red";
        isGameOver = true;
      } else {
        currentRow++;
        currentTile = 0;
      }
    }
  }

  newGameBtn.addEventListener('click', initGame);

  themeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
  });
});