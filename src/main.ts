import { getRandomSentence } from "./sentences";
import "./style.css";

interface GameState {
  targetSentence: string;
  typed: string;
  startTime: number | null;
  mistakes: number;
  totalCharsTyped: number;
  sentencesCompleted: number;
  isFinished: boolean;
}

const SENTENCES_PER_ROUND = 5;

function createState(): GameState {
  return {
    targetSentence: getRandomSentence(),
    typed: "",
    startTime: null,
    mistakes: 0,
    totalCharsTyped: 0,
    sentencesCompleted: 0,
    isFinished: false,
  };
}

let state = createState();

// ── DOM helpers ──────────────────────────────────────────

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function renderApp(): void {
  const app = $("app");
  app.innerHTML = `
    <div class="container">
      <h1>⌨️ Type It Right!</h1>
      <p class="subtitle">Practice your typing&nbsp;—&nbsp;type the sentence below!</p>

      <div class="stats-bar">
        <span id="stat-round">Sentence <strong>${state.sentencesCompleted + 1}</strong> of <strong>${SENTENCES_PER_ROUND}</strong></span>
        <span id="stat-wpm">⚡ <strong>0</strong> WPM</span>
        <span id="stat-accuracy">🎯 <strong>100</strong>%</span>
      </div>

      <div class="sentence-display" id="sentence-display"></div>

      <input
        id="type-input"
        class="type-input"
        type="text"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Start typing here…"
      />

      <div id="feedback" class="feedback"></div>

      <div id="results" class="results hidden"></div>
    </div>
  `;

  renderSentence();
  setupInput();
}

// ── Render the target sentence with per-character coloring ──

function renderSentence(): void {
  const display = $("sentence-display");
  const chars = state.targetSentence.split("");
  const typedChars = state.typed.split("");

  display.innerHTML = chars
    .map((char, i) => {
      if (i >= typedChars.length) {
        // Not yet typed
        return `<span class="char">${char === " " ? "&nbsp;" : escapeHtml(char)}</span>`;
      }
      if (typedChars[i] === char) {
        return `<span class="char correct">${char === " " ? "&nbsp;" : escapeHtml(char)}</span>`;
      }
      // Wrong character
      return `<span class="char wrong">${char === " " ? "&nbsp;" : escapeHtml(char)}</span>`;
    })
    .join("");
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ── Input handling ──────────────────────────────────────

function setupInput(): void {
  const input = $("type-input") as HTMLInputElement;
  input.focus();

  input.addEventListener("input", () => {
    const value = input.value;

    // Start timer on first keystroke
    if (state.startTime === null && value.length > 0) {
      state.startTime = Date.now();
    }

    // Count new mistakes
    const prevLen = state.typed.length;
    for (let i = prevLen; i < value.length; i++) {
      state.totalCharsTyped++;
      if (value[i] !== state.targetSentence[i]) {
        state.mistakes++;
      }
    }

    state.typed = value;
    renderSentence();
    updateStats();

    // Check completion
    if (value === state.targetSentence) {
      onSentenceComplete();
    }
  });

  // Prevent pasting
  input.addEventListener("paste", (e) => e.preventDefault());
}

function updateStats(): void {
  // WPM: (chars / 5) / minutes
  if (state.startTime) {
    const minutes = (Date.now() - state.startTime) / 60_000;
    const wpm = minutes > 0 ? Math.round(state.totalCharsTyped / 5 / minutes) : 0;
    $("stat-wpm").innerHTML = `⚡ <strong>${wpm}</strong> WPM`;
  }

  // Accuracy
  const accuracy =
    state.totalCharsTyped > 0
      ? Math.round(((state.totalCharsTyped - state.mistakes) / state.totalCharsTyped) * 100)
      : 100;
  $("stat-accuracy").innerHTML = `🎯 <strong>${accuracy}</strong>%`;
}

// ── Sentence complete ───────────────────────────────────

function onSentenceComplete(): void {
  state.sentencesCompleted++;

  const feedback = $("feedback");
  feedback.textContent = "✅ Nice job!";
  feedback.classList.add("show");

  const input = $("type-input") as HTMLInputElement;
  input.disabled = true;

  if (state.sentencesCompleted >= SENTENCES_PER_ROUND) {
    setTimeout(() => showResults(), 800);
    return;
  }

  setTimeout(() => {
    feedback.classList.remove("show");
    state.targetSentence = getRandomSentence(state.targetSentence);
    state.typed = "";
    input.value = "";
    input.disabled = false;
    input.focus();
    $("stat-round").innerHTML = `Sentence <strong>${state.sentencesCompleted + 1}</strong> of <strong>${SENTENCES_PER_ROUND}</strong>`;
    renderSentence();
  }, 1000);
}

// ── Final results screen ────────────────────────────────

function showResults(): void {
  const minutes = state.startTime ? (Date.now() - state.startTime) / 60_000 : 1;
  const wpm = Math.round(state.totalCharsTyped / 5 / minutes);
  const accuracy =
    state.totalCharsTyped > 0
      ? Math.round(((state.totalCharsTyped - state.mistakes) / state.totalCharsTyped) * 100)
      : 100;

  let message: string;
  let emoji: string;
  if (accuracy >= 95 && wpm >= 30) {
    emoji = "🏆";
    message = "Amazing! You're a typing superstar!";
  } else if (accuracy >= 85) {
    emoji = "⭐";
    message = "Great work! Keep practicing!";
  } else {
    emoji = "💪";
    message = "Good effort! Practice makes perfect!";
  }

  const results = $("results");
  results.classList.remove("hidden");
  results.innerHTML = `
    <div class="results-card">
      <h2>${emoji} Round Complete!</h2>
      <p class="results-message">${message}</p>
      <div class="results-stats">
        <div class="result-stat">
          <span class="result-number">${wpm}</span>
          <span class="result-label">Words per Minute</span>
        </div>
        <div class="result-stat">
          <span class="result-number">${accuracy}%</span>
          <span class="result-label">Accuracy</span>
        </div>
        <div class="result-stat">
          <span class="result-number">${state.mistakes}</span>
          <span class="result-label">Mistakes</span>
        </div>
      </div>
      <button id="play-again" class="play-again-btn">🔄 Play Again</button>
    </div>
  `;

  $("play-again").addEventListener("click", () => {
    state = createState();
    renderApp();
  });

  // Hide the input area
  ($("type-input") as HTMLInputElement).style.display = "none";
  $("sentence-display").style.display = "none";
  $("feedback").style.display = "none";
  document.querySelector(".stats-bar")!.classList.add("hidden");
}

// ── Boot ─────────────────────────────────────────────────

renderApp();
