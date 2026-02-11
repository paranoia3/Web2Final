document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 App Started (Server Mode)");

  const authCard = document.getElementById('authCard');
  const appCard = document.getElementById('appCard');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const authMsg = document.getElementById('authMsg');

  const logoutBtn = document.getElementById('logoutBtn');
  const newGameBtn = document.getElementById('newGameBtn');
  const boardDiv = document.getElementById('board');
  const gameMsg = document.getElementById('gameMsg');
  const themeBtn = document.getElementById('themeToggle');
  const userLine = document.getElementById('userLine');

  let currentGameId = null;
  let currentRow = 0;
  let currentGuess = [];
  const rows = 6;
  const cols = 5;
  let isGameOver = false;

  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      showGame(user);
    } catch (e) {
      localStorage.removeItem('user');
      showAuth();
    }
  } else {
    showAuth();
  }

  function showAuth() {
    authCard.classList.remove('hidden');
    appCard.classList.add('hidden');
    document.removeEventListener('keydown', handleKey);
  }

  function showGame(user) {
    authCard.classList.add('hidden');
    appCard.classList.remove('hidden');
    userLine.textContent = `Player: ${user.username}`;
    setTimeout(initGame, 100);
  }

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
        authMsg.textContent = result.message || "Login failed";
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
        authMsg.textContent = "Registered! Please login.";
        authMsg.style.color = "green";
        setTimeout(() => tabLogin.click(), 1000);
      } else {
        authMsg.textContent = "Error registering";
        authMsg.style.color = "red";
      }
    } catch (err) { console.error(err); }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('user');
      location.reload();
    });
  }

  async function initGame() {
    console.log("Starting new game on server...");

    currentRow = 0;
    currentGuess = [];
    isGameOver = false;
    gameMsg.textContent = "";
    currentGameId = null;

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

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (res.ok) {
        currentGameId = data.id; // Получаем ID из БД
        console.log("Game ID:", currentGameId);
        gameMsg.textContent = "Guess the word!";
        document.removeEventListener('keydown', handleKey);
        document.addEventListener('keydown', handleKey);
      } else {
        gameMsg.textContent = "Error starting game: " + data.message;
        isGameOver = true;
      }
    } catch (e) {
      console.error("Network error:", e);
      gameMsg.textContent = "Network error";
    }
  }

  function handleKey(e) {
    if (isGameOver) return;
    const key = e.key.toUpperCase();

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      deleteLetter();
    } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
      addLetter(key);
    }
  }

  function addLetter(letter) {
    if (currentGuess.length < cols) {
      const tile = document.getElementById(`tile-${currentRow}-${currentGuess.length}`);
      tile.textContent = letter;
      tile.setAttribute('data-state', 'active'); // CSS анимация
      currentGuess.push(letter);
    }
  }

  function deleteLetter() {
    if (currentGuess.length > 0) {
      currentGuess.pop();
      const tile = document.getElementById(`tile-${currentRow}-${currentGuess.length}`);
      tile.textContent = '';
      tile.removeAttribute('data-state');
    }
  }

  async function submitGuess() {
    if (currentGuess.length !== cols) {
      shakeRow(); // Анимация тряски, если мало букв
      return;
    }

    const guessWord = currentGuess.join("");

    try {
      const res = await fetch(`/api/games/${currentGameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: guessWord })
      });

      const data = await res.json();

      if (!res.ok) {
        gameMsg.textContent = data.message;
        shakeRow();
        return;
      }

      revealRow(data.result);

      setTimeout(() => {
        if (data.status === 'won') {
          gameMsg.textContent = "VICTORY! 🎉";
          gameMsg.style.color = "#538d4e";
          isGameOver = true;
        } else if (data.status === 'lost') {
          gameMsg.textContent = `GAME OVER. Word: ${data.secretWord}`;
          gameMsg.style.color = "#ff4d4d";
          isGameOver = true;
        } else {
          currentRow++;
          currentGuess = [];
          if (currentRow >= rows) {
            isGameOver = true;
          }
        }
      }, 500 * 5 + 100);

    } catch (e) {
      console.error("Guess error:", e);
    }
  }

  function revealRow(resultColors) {
    for (let i = 0; i < cols; i++) {
      const tile = document.getElementById(`tile-${currentRow}-${i}`);
      setTimeout(() => {
        tile.classList.remove('active');
        tile.removeAttribute('data-state');
        tile.classList.add(resultColors[i]);
      }, i * 250);
    }
  }

  function shakeRow() {
    const row = document.querySelector(`#tile-${currentRow}-0`).parentElement;
    row.classList.add('shake');
    setTimeout(() => row.classList.remove('shake'), 500);
  }

  newGameBtn.addEventListener('click', initGame);

  themeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
  });
});