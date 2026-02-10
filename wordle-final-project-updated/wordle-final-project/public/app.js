const $ = (sel) => document.querySelector(sel);

const authCard = $("#authCard");
const appCard = $("#appCard");

const tabLogin = $("#tabLogin");
const tabRegister = $("#tabRegister");
const loginForm = $("#loginForm");
const registerForm = $("#registerForm");
const authMsg = $("#authMsg");

const userLine = $("#userLine");
const logoutBtn = $("#logoutBtn");

const newRandomBtn = $("#newRandomBtn");
const newDailyBtn = $("#newDailyBtn");

const board = $("#board");
const guessBtn = $("#guessBtn");
const gameMsg = $("#gameMsg");
const debug = $("#debug"); // optional (removed from UI)

const themeToggle = $("#themeToggle");
const statusPill = $("#statusPill");
const attemptsPill = $("#attemptsPill");
const toast = $("#toast");

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
}

(function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  setTheme(theme);
})();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || "dark";
    const next = cur === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    setTheme(next);
  });
}

let toastTimer = null;
function showToast(text) {
  if (!toast) return;
  toast.textContent = text || "";
  toast.classList.remove("show");
  if (!text) return;
  // force reflow
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function updatePills(status, attempts, maxAttempts) {
  if (statusPill) statusPill.textContent = `Status: ${status ? String(status).toUpperCase() : "—"}`;
  if (attemptsPill) attemptsPill.textContent = (attempts != null && maxAttempts != null)
    ? `Attempts: ${attempts}/${maxAttempts}`
    : "Attempts: —";
}

let token = localStorage.getItem("token") || "";
let currentGameId = localStorage.getItem("gameId") || "";

let gameStatus = "none"; // none | active | won | lost
let activeRowIndex = 0;

function setMsg(el, text) { el.textContent = text || ""; }
function setDebug(obj) {
  if (!debug) return;
  debug.textContent = JSON.stringify(obj, null, 2);
}

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.message || "Request failed"), { status: res.status, data });
  return data;
}

// --- UI helpers ---
function showApp() {
  authCard.classList.add("hidden");
  appCard.classList.remove("hidden");
}

function showAuth() {
  appCard.classList.add("hidden");
  authCard.classList.remove("hidden");
}

function setTab(which) {
  const isLogin = which === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  setMsg(authMsg, "");
}

function renderEmptyBoard() {
  board.innerHTML = "";
  for (let r = 0; r < 6; r++) {
    const row = document.createElement("div");
    row.className = "rowTiles";
    for (let c = 0; c < 5; c++) {
      const t = document.createElement("div");
      t.className = "tile";
      const inp = document.createElement("input");
      inp.className = "tileInput";
      inp.type = "text";
      inp.maxLength = 1;
      inp.autocomplete = "off";
      inp.autocapitalize = "characters";
      inp.spellcheck = false;
      inp.inputMode = "text";
      inp.dataset.row = String(r);
      inp.dataset.col = String(c);
      inp.disabled = true;
      t.appendChild(inp);
      row.appendChild(t);
    }
    board.appendChild(row);
  }
}

function getRowInputs(r) {
  const row = board.children[r];
  if (!row) return [];
  return Array.from(row.querySelectorAll(".tileInput"));
}

function clearRow(r) {
  const inputs = getRowInputs(r);
  inputs.forEach((i) => { i.value = ""; });
}

function disableAllTiles() {
  // Disable typing but keep any existing letters/colors on the board.
  for (let r = 0; r < 6; r++) {
    const row = board.children[r];
    if (!row) continue;
    Array.from(row.children).forEach((tile) => {
      const inp = tile.querySelector(".tileInput");
      if (inp) inp.disabled = true;
    });
  }
}

function setActiveRow(r) {
  // Enable only the active row (if the game is active)
  for (let ri = 0; ri < 6; ri++) {
    const inputs = getRowInputs(ri);
    inputs.forEach((inp) => {
      inp.disabled = !(gameStatus === "active" && ri === r);
    });
  }
}

function focusRow(r, col = 0) {
  const inputs = getRowInputs(r);
  if (!inputs.length) return;
  const idx = Math.max(0, Math.min(col, inputs.length - 1));
  inputs[idx].focus();
  inputs[idx].select();
}

function focusFirstEmptyInRow(r) {
  const inputs = getRowInputs(r);
  const idx = inputs.findIndex((i) => !i.value);
  focusRow(r, idx === -1 ? 4 : idx);
}

function renderGuesses(guesses) {
  renderEmptyBoard();
  guesses.forEach((g, idx) => {
    const row = board.children[idx];
    if (!row) return;
    const letters = g.word.toUpperCase().split("");
    letters.forEach((ch, i) => {
      const tile = row.children[i];
      const inp = tile.querySelector(".tileInput");
      if (inp) {
        inp.value = ch;
        inp.disabled = true;
      }
      tile.classList.add(g.result[i]);
    });
  });
}

async function loadProfile() {
  const data = await api("/users/profile");
  userLine.textContent = `Logged in as ${data.user.username} (${data.user.role})`;
  setDebug(data);
}

async function loadGameIfAny() {
  if (!currentGameId) {
    gameStatus = "none";
    renderEmptyBoard();
    disableAllTiles();
    updatePills("—", null, null);
    return;
  }
  try {
    const data = await api(`/games/${currentGameId}`);
    gameStatus = data.game.status;
    activeRowIndex = (data.game.guesses || []).length;
    renderGuesses(data.game.guesses || []);
    setMsg(gameMsg, `Game: ${data.game.status}. Attempts: ${data.game.guesses.length}/${data.game.maxAttempts}`);
    updatePills(data.game.status, data.game.guesses.length, data.game.maxAttempts);
    setDebug(data);

    if (gameStatus === "active" && activeRowIndex < 6) {
      setActiveRow(activeRowIndex);
      focusFirstEmptyInRow(activeRowIndex);
    } else {
      disableAllTiles();
    }
  } catch (e) {
    currentGameId = "";
    localStorage.removeItem("gameId");
    gameStatus = "none";
    renderEmptyBoard();
    disableAllTiles();
    setMsg(gameMsg, "");
    updatePills("—", null, null);
  }
}

async function newGame(mode) {
  setMsg(gameMsg, "");
    updatePills("—", null, null);
  const data = await api("/games", { method: "POST", body: JSON.stringify({ mode }) });
  currentGameId = data.game.id;
  localStorage.setItem("gameId", currentGameId);
  gameStatus = data.game.status;
  activeRowIndex = 0;
  renderGuesses(data.game.guesses || []);
  setActiveRow(activeRowIndex);
  focusFirstEmptyInRow(activeRowIndex);
  setMsg(gameMsg, `New ${mode} game started.`);
  updatePills(data.game.status, 0, data.game.maxAttempts);
  showToast(`New ${mode} game started`);
  setDebug(data);
}

async function submitGuess() {
  if (!currentGameId) return setMsg(gameMsg, "Start a new game first.");
  if (gameStatus !== "active") return setMsg(gameMsg, "This game is finished. Start a new game.");

  const inputs = getRowInputs(activeRowIndex);
  const guess = inputs.map((i) => (i.value || "").trim()).join("").toLowerCase();
  if (guess.length !== 5 || /[^a-z]/.test(guess)) return setMsg(gameMsg, "Fill all 5 tiles with letters.");

  guessBtn.disabled = true;
  try {
    const data = await api(`/games/${currentGameId}`, { method: "PUT", body: JSON.stringify({ guess }) });
    gameStatus = data.game.status;
    activeRowIndex = (data.game.guesses || []).length;
    renderGuesses(data.game.guesses || []);
    setMsg(gameMsg, `Game: ${data.game.status}. Attempts: ${data.game.guesses.length}/${data.game.maxAttempts}`);
    updatePills(data.game.status, data.game.guesses.length, data.game.maxAttempts);
    setDebug(data);

    if (data.game.status !== "active") {
      setMsg(gameMsg, `Game finished: ${data.game.status.toUpperCase()} ✅`);
      showToast(`Game finished: ${data.game.status.toUpperCase()}`);
      disableAllTiles();
    } else {
      setActiveRow(activeRowIndex);
      focusFirstEmptyInRow(activeRowIndex);
    }
  } catch (e) {
    setMsg(gameMsg, e.data?.message || e.message);
    showToast(e.data?.message || e.message);
  } finally {
    guessBtn.disabled = false;
    // keep the row inputs as-is; user can edit and resubmit if needed
  }
}

// --- events ---
tabLogin.addEventListener("click", () => setTab("login"));
tabRegister.addEventListener("click", () => setTab("register"));

loginForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  setMsg(authMsg, "");
  const payload = Object.fromEntries(new FormData(loginForm).entries());
  try {
    const data = await api("/auth/login", { method: "POST", body: JSON.stringify(payload), headers: {} });
    token = data.token;
    localStorage.setItem("token", token);
    showApp();
    await loadProfile();
    showToast("Logged in ✅");
    await loadGameIfAny();
  } catch (e) {
    setMsg(authMsg, e.data?.message || e.message);
  }
});

registerForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  setMsg(authMsg, "");
  const payload = Object.fromEntries(new FormData(registerForm).entries());
  try {
    const data = await api("/auth/register", { method: "POST", body: JSON.stringify(payload), headers: {} });
    token = data.token;
    localStorage.setItem("token", token);
    showApp();
    await loadProfile();
    showToast("Account created ✅");
    renderEmptyBoard();
    updatePills("—", null, null);
  } catch (e) {
    setMsg(authMsg, e.data?.message || e.message);
  }
});

logoutBtn.addEventListener("click", () => {
  token = "";
  currentGameId = "";
  localStorage.removeItem("token");
  localStorage.removeItem("gameId");
  showAuth();
  setTab("login");
  renderEmptyBoard();
});

newRandomBtn.addEventListener("click", () => newGame("random"));
newDailyBtn.addEventListener("click", () => newGame("daily"));

guessBtn.addEventListener("click", () => {
  submitGuess();
});

// Tile typing (Wordle-style)
board.addEventListener("click", (e) => {
  const inp = e.target?.classList?.contains("tileInput") ? e.target : e.target?.querySelector?.(".tileInput");
  if (inp && !inp.disabled) {
    inp.focus();
    inp.select();
  }
});

board.addEventListener("input", (e) => {
  const inp = e.target;
  if (!inp || !inp.classList.contains("tileInput") || inp.disabled) return;

  // Keep only A-Z, one character
  const v = (inp.value || "").toUpperCase().replace(/[^A-Z]/g, "");
  inp.value = v.slice(0, 1);

  // Auto-advance
  if (inp.value) {
    const r = Number(inp.dataset.row);
    const c = Number(inp.dataset.col);
    const next = getRowInputs(r)[c + 1];
    if (next && !next.disabled) {
      next.focus();
      next.select();
    }
  }
});

board.addEventListener("keydown", (e) => {
  const inp = e.target;
  if (!inp || !inp.classList.contains("tileInput") || inp.disabled) return;

  const r = Number(inp.dataset.row);
  const c = Number(inp.dataset.col);
  const rowInputs = getRowInputs(r);

  if (e.key === "Backspace") {
    if (inp.value) {
      inp.value = "";
    } else {
      const prev = rowInputs[c - 1];
      if (prev && !prev.disabled) {
        prev.focus();
        prev.value = "";
      }
    }
    e.preventDefault();
  }

  if (e.key === "Enter") {
    e.preventDefault();
    guessBtn.click();
  }

  if (e.key === "ArrowLeft") {
    const prev = rowInputs[c - 1];
    if (prev && !prev.disabled) prev.focus();
  }
  if (e.key === "ArrowRight") {
    const next = rowInputs[c + 1];
    if (next && !next.disabled) next.focus();
  }
});

// --- init ---
renderEmptyBoard();
disableAllTiles();
updatePills("—", null, null);
if (token) {
  showApp();
  loadProfile().then(loadGameIfAny).catch(() => {
    token = "";
    localStorage.removeItem("token");
    showAuth();
    setTab("login");
  });
} else {
  showAuth();
  setTab("login");
}
