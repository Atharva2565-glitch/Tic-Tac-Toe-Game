const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const scoreDrawEl = document.getElementById("scoreDraw");
const pvpBtn = document.getElementById("pvpBtn");
const aiBtn = document.getElementById("aiBtn");
const newRoundBtn = document.getElementById("newRoundBtn");
const resetAllBtn = document.getElementById("resetAllBtn");

const winPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

let board = Array(9).fill("");
let currentPlayer = "X";
let gameOver = false;
let mode = "pvp"; // "pvp" | "ai"
let aiTimer = null;
let winningLine = null;

const scores = {
  X: 0,
  O: 0,
  draw: 0
};

function updateStatus(text) {
  statusEl.textContent = text;
}

function updateScore() {
  scoreXEl.textContent = String(scores.X);
  scoreOEl.textContent = String(scores.O);
  scoreDrawEl.textContent = String(scores.draw);
}

function getWinningLine(state) {
  for (const [a, b, c] of winPatterns) {
    if (state[a] && state[a] === state[b] && state[b] === state[c]) {
      return [a, b, c];
    }
  }
  return null;
}

function isBoardFull(state) {
  return state.every((cell) => cell !== "");
}

function renderBoard() {
  boardEl.innerHTML = "";
  const isAiTurn = mode === "ai" && currentPlayer === "O" && !gameOver;

  board.forEach((value, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cell";
    if (winningLine && winningLine.includes(index)) {
      btn.classList.add("win");
    }

    btn.textContent = value;
    btn.disabled = gameOver || value !== "" || isAiTurn;
    btn.setAttribute("aria-label", `Cell ${index + 1}`);
    btn.addEventListener("click", () => handleMove(index));

    boardEl.appendChild(btn);
  });
}

function setActiveModeButton() {
  pvpBtn.classList.toggle("active", mode === "pvp");
  aiBtn.classList.toggle("active", mode === "ai");
}

function endRound(winner, line) {
  gameOver = true;
  winningLine = line || null;

  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }

  if (winner === "X" || winner === "O") {
    scores[winner] += 1;
    updateStatus(mode === "ai" && winner === "O" ? "Computer wins!" : `Player ${winner} wins!`);
  } else {
    scores.draw += 1;
    updateStatus("Draw!");
  }

  updateScore();
  renderBoard();
}

function switchTurn() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateStatus(mode === "ai" && currentPlayer === "O" ? "Computer turn..." : `Player ${currentPlayer} Turn`);
  renderBoard();
}

function handleMove(index) {
  if (gameOver || board[index] !== "") return;
  if (mode === "ai" && currentPlayer === "O") return;

  board[index] = currentPlayer;

  const line = getWinningLine(board);
  if (line) {
    endRound(currentPlayer, line);
    return;
  }

  if (isBoardFull(board)) {
    endRound(null, null);
    return;
  }

  switchTurn();

  if (mode === "ai" && currentPlayer === "O" && !gameOver) {
    aiTimer = window.setTimeout(() => {
      aiTimer = null;
      aiMove();
    }, 220);
  }
}

function minimax(state, player, depth = 0, alpha = -Infinity, beta = Infinity) {
  const line = getWinningLine(state);
  if (line) {
    const winner = state[line[0]];
    if (winner === "O") return { score: 10 - depth };
    if (winner === "X") return { score: depth - 10 };
  }

  if (isBoardFull(state)) {
    return { score: 0 };
  }

  const moves = state
    .map((cell, i) => (cell === "" ? i : -1))
    .filter((i) => i !== -1);

  let bestIndex = moves[0];

  if (player === "O") {
    let bestScore = -Infinity;
    for (const idx of moves) {
      state[idx] = "O";
      const result = minimax(state, "X", depth + 1, alpha, beta);
      state[idx] = "";

      if (result.score > bestScore) {
        bestScore = result.score;
        bestIndex = idx;
      }

      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break;
    }
    return { score: bestScore, index: bestIndex };
  }

  let bestScore = Infinity;
  for (const idx of moves) {
    state[idx] = "X";
    const result = minimax(state, "O", depth + 1, alpha, beta);
    state[idx] = "";

    if (result.score < bestScore) {
      bestScore = result.score;
      bestIndex = idx;
    }

    beta = Math.min(beta, bestScore);
    if (beta <= alpha) break;
  }
  return { score: bestScore, index: bestIndex };
}

function aiMove() {
  if (gameOver || mode !== "ai" || currentPlayer !== "O") return;
  const best = minimax(board.slice(), "O");
  if (typeof best.index === "number") {
    board[best.index] = "O";

    const line = getWinningLine(board);
    if (line) {
      endRound("O", line);
      return;
    }

    if (isBoardFull(board)) {
      endRound(null, null);
      return;
    }

    switchTurn();
  }
}

function resetBoard() {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  winningLine = null;

  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }

  updateStatus("Player X Turn");
  renderBoard();
}

function resetAll() {
  scores.X = 0;
  scores.O = 0;
  scores.draw = 0;
  updateScore();
  resetBoard();
}

function setMode(nextMode) {
  mode = nextMode;
  setActiveModeButton();
  resetBoard();
}

pvpBtn.addEventListener("click", () => setMode("pvp"));
aiBtn.addEventListener("click", () => setMode("ai"));
newRoundBtn.addEventListener("click", resetBoard);
resetAllBtn.addEventListener("click", resetAll);

updateScore();
setActiveModeButton();
renderBoard();
