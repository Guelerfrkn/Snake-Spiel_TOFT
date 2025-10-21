<template>
  <div class="snake-game" @wheel.prevent>
    <h1>🐍 Snake Spiel</h1>
    <div class="game-stats">
      <div class="score">Score: <span>{{ score }}</span></div>
      <div class="highscore">Highscore: <span>{{ highscore }}</span></div>
    </div>

    <div class="game-info">
      <div v-if="!gameRunning && !gameOver" class="settings-menu--inline">
        <!-- Inline settings wurden entfernt zugunsten des Settings-Icons -->
        <button @click="startGame" class="btn primary">Start</button>
      </div>
      <button @click="resetGame" v-if="gameOver" class="btn primary">Neues Spiel</button>
    </div>

    <div class="board-wrapper">
      <div class="game-board" :style="{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }">
        <div
          v-for="(cell, index) in board"
          :key="index"
          :class="{
            cell: true,
            snake: cell && cell.type === 'snake',
            food: cell && cell.type === 'food',
            head: cell && cell.type === 'head'
          }"
          :style="cell ? { background: cell.color } : {}"
        >
          <div v-if="cell && cell.type === 'head'" class="snake-eyes"></div>
        </div>
      </div>

      <!-- Settings / Pause Icon rechts vom Board -->
      <button class="settings-btn" @click="toggleSettings" :title="gameRunning ? 'Einstellungen & Pause' : 'Einstellungen'">
        ⚙️
      </button>

      <!-- Settings Panel (floating) -->
      <div v-if="showSettingsPanel" class="settings-panel">
        <h3>Einstellungen</h3>
        <label>
          Board-Größe:
          <select v-model.number="settings.boardSize">
            <option v-for="n in [8, 10, 12, 15, 20]" :key="n" :value="n">{{ n }} x {{ n }}</option>
          </select>
        </label>
        <label>
          Geschwindigkeit:
          <select v-model.number="settings.baseSpeed">
            <option :value="350">Langsam</option>
            <option :value="250">Normal</option>
            <option :value="150">Schnell</option>
          </select>
        </label>
        <label>
          Skin:
          <select v-model="selectedSkin">
            <option v-for="skin in unlockedSkins" :key="skin.id" :value="skin.id">
              {{ skin.label }}
            </option>
          </select>
        </label>

        <div class="settings-actions">
          <button class="btn secondary" @click="togglePause">{{ gameRunning ? 'Pause' : 'Fortsetzen' }}</button>
          <button class="btn" @click="toggleSettings">Schließen</button>
        </div>
      </div>
    </div>

    <div class="controls">
      <button @click="changeDirection('up')" class="control-btn up">↑</button>
      <div>
        <button @click="changeDirection('left')" class="control-btn left">←</button>
        <button @click="changeDirection('down')" class="control-btn down">↓</button>
        <button @click="changeDirection('right')" class="control-btn right">→</button>
      </div>
    </div>

    <div v-if="gameOver && !replaying" class="overlay">
      <h2>Game Over!</h2>
      <p>Dein Score: {{ score }}</p>
      <button @click="resetGame" class="btn primary">Nochmal spielen</button>
      <button @click="startReplay" class="btn secondary">Replay</button>
    </div>

    <div v-if="replaying" class="overlay">
      <h2>Replay</h2>
      <div class="game-board" :style="{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }">
        <div
          v-for="(cell, index) in replayBoard"
          :key="index"
          :class="{
            cell: true,
            snake: cell && cell.type === 'snake',
            food: cell && cell.type === 'food',
            head: cell && cell.type === 'head'
          }"
          :style="cell ? { background: cell.color } : {}"
        >
          <div v-if="cell && cell.type === 'head'" class="snake-eyes"></div>
        </div>
      </div>
      <button @click="stopReplay" class="btn primary">Replay beenden</button>
    </div>
  </div>
</template>

<script>
// import sounds from './sounds.js'; // temporär deaktiviert, bis howler korrekt installiert ist
const sounds = {
  food: { play: () => Promise.resolve(), stop: () => {} },
  gameover: { play: () => Promise.resolve(), stop: () => {} },
  badge: { play: () => Promise.resolve(), stop: () => {} },
};

export default {
  name: 'SnakeGame',
  data() {
    return {
      boardSize: 12,
      snake: [5 * 12 + 6],
      direction: 'right',
      nextDirection: 'right',
      food: 0,
      gameRunning: false,
      gameOver: false,
      score: 0,
      highscore: 0,
      baseSpeed: 280,
      currentSpeed: 280,
      minSpeed: 150,
      board: [],
      settings: {
        boardSize: 12,
        baseSpeed: 280,
      },
      replayFrames: [],
      replayBoard: [],
      replaying: false,
      replayIdx: 0,
      availableSkins: [
        { id: 'classic', label: 'Classic', snake: '#4CAF50', head: '#2E7D32', food: '#FF5252' },
        { id: 'gold', label: 'Gold', snake: 'gold', head: '#FFD700', food: '#FFB300' },
        { id: 'fire', label: 'Fire', snake: '#ff7043', head: '#d84315', food: '#ff1744' },
      ],
      selectedSkin: 'classic',

      // neue UI-Flags
      showSettingsPanel: false,
      replaySkin: null, // Skin, mit der das Replay abgespielt wird
    };
  },
  // ...existing lifecycle hooks...
  created() {
    this.initializeBoard();
    this.generateFood();
    this.loadHighscore();
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyDown);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  },
  computed: {
    unlockedSkins() {
      return this.availableSkins;
    },
  },
  methods: {
    // ...existing methods...
    startGame() {
      // Übernehme Einstellungen
      this.boardSize = this.settings.boardSize;
      this.baseSpeed = this.settings.baseSpeed;
      this.currentSpeed = this.baseSpeed;
      // Snake in Mitte platzieren
      const mid = Math.floor(this.boardSize / 2);
      this.snake = [mid * this.boardSize + mid];
      this.direction = 'right';
      this.nextDirection = 'right';
      this.score = 0;
      this.gameOver = false;
      this.generateFood();
      this.initializeBoard();
      this.gameRunning = true;
      this.replayFrames = [];
      this.replaying = false;
      this.replayIdx = 0;
      // Audio kurz abspielen/stoppen, damit Browser Audio für diese Interaction freigibt
      try {
        sounds.food.play();
        sounds.food.stop();
      } catch (e) {}
      // Start game loop once
      this.gameLoop();
    },
    pauseGame() {
      this.gameRunning = false;
    },
    resumeGame() {
      this.gameRunning = true;
      this.gameLoop();
    },
    togglePause() {
      if (this.gameOver) return;
      if (this.gameRunning) this.pauseGame();
      else this.resumeGame();
    },
    toggleSettings() {
      this.showSettingsPanel = !this.showSettingsPanel;
    },
    resetGame() {
      const mid = Math.floor(12 / 2);
      this.snake = [5 * 12 + 6]; // Startposition (kept for compatibility)
      this.direction = 'right';
      this.nextDirection = 'right';
      this.score = 0;
      this.gameOver = false;
      this.currentSpeed = this.baseSpeed;
      this.generateFood();
      this.updateBoard();
    },
    gameLoop() {
      if (!this.gameRunning || this.gameOver) return;

      this.direction = this.nextDirection;
      const head = this.snake[0];
      let newHead;

      switch (this.direction) {
        case 'up':
          newHead = head - this.boardSize;
          break;
        case 'down':
          newHead = head + this.boardSize;
          break;
        case 'left':
          newHead = head - 1;
          break;
        case 'right':
          newHead = head + 1;
          break;
      }

      // Rand-Check: Game Over, wenn außerhalb
      if (
        newHead < 0 ||
        newHead >= this.boardSize * this.boardSize ||
        (this.direction === 'left' && newHead % this.boardSize === this.boardSize - 1) ||
        (this.direction === 'right' && newHead % this.boardSize === 0)
      ) {
        this.gameOver = true;
        this.gameRunning = false;
        this.saveHighscore();
        try { sounds.gameover.play(); } catch {}
        return;
      }
      if (this.snake.includes(newHead)) {
        this.gameOver = true;
        this.gameRunning = false;
        this.saveHighscore();
        try { sounds.gameover.play(); } catch {}
        return;
      }

      this.snake.unshift(newHead);

      if (newHead === this.food) {
        this.score++;
        this.generateFood();
        this.updateSpeed();
        try { sounds.food.play(); } catch {}
      } else {
        this.snake.pop();
      }

      this.updateBoard();
      // Speichere Frame für Replay (inkl. Snake-Positions & food)
      this.replayFrames.push({
        snake: [...this.snake],
        food: this.food,
      });

      setTimeout(() => {
        this.gameLoop();
      }, this.currentSpeed);
    },
    startReplay() {
      this.replaySkin = this.selectedSkin; // Replay mit der gewählten Skin starten
      this.replaying = true;
      this.replayIdx = 0;
      this.runReplay();
    },
    runReplay() {
      if (!this.replaying || this.replayIdx >= this.replayFrames.length) return;
      const frame = this.replayFrames[this.replayIdx];
      const newBoard = Array(this.boardSize * this.boardSize).fill(null);

      // Skin für Replay benutzen (zum Zeitpunkt des Replay-Starts)
      const skin = this.availableSkins.find(s => s.id === (this.replaySkin || this.selectedSkin)) || this.availableSkins[0];

      frame.snake.forEach((pos, i) => {
        if (i === 0) {
          newBoard[pos] = { type: 'head', color: skin.head };
        } else {
          newBoard[pos] = { type: 'snake', color: skin.snake };
        }
      });
      newBoard[frame.food] = { type: 'food', color: skin.food };
      this.replayBoard = newBoard;
      this.replayIdx++;
      setTimeout(() => {
        this.runReplay();
      }, this.baseSpeed);
    },
    stopReplay() {
      this.replaying = false;
      this.replayIdx = 0;
      this.replayBoard = [];
    },
    updateBoard() {
      const newBoard = Array(this.boardSize * this.boardSize).fill(null);
      const skin = this.availableSkins.find(s => s.id === this.selectedSkin) || this.availableSkins[0];
      this.snake.forEach((pos, i) => {
        if (i === 0) {
          newBoard[pos] = { type: 'head', color: skin.head };
        } else {
          newBoard[pos] = { type: 'snake', color: skin.snake };
        }
      });
      newBoard[this.food] = { type: 'food', color: skin.food };
      this.board = newBoard;
    },

    // --- Added helper methods ---
    initializeBoard() {
      this.board = Array(this.boardSize * this.boardSize).fill(null);
      this.updateBoard();
    },
    generateFood() {
      const total = this.boardSize * this.boardSize;
      const occupied = new Set(this.snake);
      const free = [];
      for (let i = 0; i < total; i++) {
        if (!occupied.has(i)) free.push(i);
      }
      if (free.length === 0) {
        // Board full => player wins, stop game
        this.gameOver = true;
        this.gameRunning = false;
        this.saveHighscore();
        return;
      }
      const idx = free[Math.floor(Math.random() * free.length)];
      this.food = idx;
      this.updateBoard();
    },
    loadHighscore() {
      const v = localStorage.getItem('snake_highscore');
      this.highscore = v ? parseInt(v, 10) || 0 : 0;
    },
    saveHighscore() {
      if (this.score > this.highscore) {
        this.highscore = this.score;
        try {
          localStorage.setItem('snake_highscore', String(this.highscore));
        } catch (e) {}
        try { sounds.badge.play(); } catch {}
      }
    },
    updateSpeed() {
      // Simple speed ramp: every 5 points -> faster by 20ms, bounded by minSpeed
      const faster = Math.floor(this.score / 5) * 20;
      this.currentSpeed = Math.max(this.minSpeed, this.baseSpeed - faster);
    },

    handleKeyDown(e) {
      e.preventDefault();
      switch (e.key) {
        case 'ArrowUp':
          if (this.direction !== 'down') this.nextDirection = 'up';
          break;
        case 'ArrowDown':
          if (this.direction !== 'up') this.nextDirection = 'down';
          break;
        case 'ArrowLeft':
          if (this.direction !== 'right') this.nextDirection = 'left';
          break;
        case 'ArrowRight':
          if (this.direction !== 'left') this.nextDirection = 'right';
          break;
      }
    },
    changeDirection(dir) {
      if (
          (dir === 'up' && this.direction !== 'down') ||
          (dir === 'down' && this.direction !== 'up') ||
          (dir === 'left' && this.direction !== 'right') ||
          (dir === 'right' && this.direction !== 'left')
      ) {
        this.nextDirection = dir;
      }
    },
  },
};
</script>

<style scoped>
/* Cleaned & consolidated styles for App.vue */

.snake-game {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 10px;
  justify-items: center;
  align-items: start;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 10px;
  background: linear-gradient(135deg, #1a2a6c 0%, #b21f1f 100%);
  color: white;
  height: 100vh;
  box-sizing: border-box;
  overflow: auto;
}

h1 {
  font-size: 2.5rem;
  margin: 6px 0 10px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.game-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.score span, .highscore span {
  font-weight: bold;
  color: #ffcc00;
}

.game-info { margin-bottom: 20px; }

.btn {
  padding: 12px 25px;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  outline: none;
}

.btn:hover { transform: scale(1.05); box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
.btn.primary { background: #4CAF50; color: white; }
.btn.secondary { background: #f44336; color: white; }

.board-wrapper { position: relative; display: inline-block; }

/* Game board */
.game-board {
  display: grid;
  grid-gap: 5px;
  width: min(64vmin, calc(100vh - 220px), 92vw);
  aspect-ratio: 1 / 1;
  max-width: 600px;
  max-height: 600px;
  background-color: rgba(0,0,0,0.3);
  border: 3px solid #444;
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}

/* Cells */
.cell {
  background-color: rgba(50, 50, 50, 0.5);
  border-radius: 6px;
  transition: background 0.15s ease;
  position: relative;
}

.snake {
  background: linear-gradient(135deg, #4CAF50, #8BC34A);
  border-radius: 6px;
}

.head {
  background: linear-gradient(135deg, #2E7D32, #4CAF50);
  border-radius: 50%;
  position: relative;
}

.snake-eyes {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.snake-eyes::before,
.snake-eyes::after {
  content: '';
  width: 5px;
  height: 5px;
  background: white;
  border-radius: 50%;
}

.food {
  background: radial-gradient(circle, #FF5252, #D32F2F);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(255,0,0,0.6);
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0% { transform: scale(0.9); }
  50% { transform: scale(1.1); }
  100% { transform: scale(0.9); }
}

/* Controls */
.controls {
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.control-btn {
  width: 60px;
  height: 60px;
  font-size: 24px;
  margin: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.15);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
}
.control-btn:hover { background: rgba(255,255,255,0.3); }

/* Overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: white;
  text-align: center;
}
.overlay h2 { font-size: 2.5rem; margin-bottom: 10px; }
.overlay p { font-size: 1.5rem; margin-bottom: 20px; }

/* Settings button & panel */
.settings-btn {
  position: absolute;
  right: -56px;
  top: 6px;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: rgba(255,255,255,0.12);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-panel {
  position: absolute;
  right: -260px;
  top: 0;
  width: 240px;
  background: rgba(0,0,0,0.75);
  border-radius: 10px;
  padding: 12px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.settings-panel select { padding: 4px; border-radius: 6px; border: none; }

/* Responsive tweaks */
@media (max-height: 700px) {
  .game-board { width: min(60vmin, calc(100vh - 160px), 94vw); }
  h1 { font-size: 1.6rem; }
}
@media (max-width: 900px) {
  .settings-btn { right: 6px; top: -52px; }
  .settings-panel { right: 6px; top: -220px; width: 92vw; }
}
@media (max-width: 600px) {
  .game-board { width: min(80vmin, 96vw); }
  .control-btn { width: 44px; height: 44px; font-size: 18px; }
}

/* Base page */
html, body, #app {
  height: 100%;
  margin: 0;
}
</style>