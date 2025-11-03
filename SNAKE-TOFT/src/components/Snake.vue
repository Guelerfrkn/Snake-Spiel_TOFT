<template>
  <div class="snake-game" @wheel.prevent>
    <div class="game-container">
      <h1>Snake Spiel</h1>

      <div class="stats-container">
        <div class="stat-box">
          <div class="stat-label">Score</div>
          <div class="stat-value">{{ score }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Highscore</div>
          <div class="stat-value">{{ highscore }}</div>
        </div>
      </div>

      <div class="game-info">
        <button @click="startGame" v-if="!gameRunning && !gameOver" class="btn btn-start">Start</button>
        <button @click="pauseGame" v-else-if="gameRunning && !gameOver" class="btn btn-pause">Pause</button>
        <button @click="resumeGame" v-else-if="!gameRunning && !gameOver" class="btn btn-start">Fortsetzen</button>
        <button @click="resetGame" v-if="gameOver" class="btn btn-restart">Neues Spiel</button>
      </div>

      <div class="game-board-wrapper">
        <div
            class="game-board"
            :style="{
              gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
              height: `min(90vw, 60vh)`,
              width: `min(90vw, 60vh)`,
              maxWidth: '360px',
              maxHeight: '360px',
            }"
        >
          <div
              v-for="(cell, index) in board"
              :key="index"
              :class="{
                cell: true,
                snake: cell === 'snake',
                food: cell === 'food',
                head: cell === 'head'
              }"
          >
            <div v-if="cell === 'head'" class="snake-eyes">
              <div class="eye left-eye"></div>
              <div class="eye right-eye"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="controls">
        <button @click="changeDirection('up')" class="control-btn up">↑</button>
        <div class="horizontal-controls">
          <button @click="changeDirection('left')" class="control-btn left">←</button>
          <button @click="changeDirection('down')" class="control-btn down">↓</button>
          <button @click="changeDirection('right')" class="control-btn right">→</button>
        </div>
      </div>

      <div v-if="gameOver" class="overlay">
        <div class="game-over-content">
          <h2>Game Over!</h2>
          <p>Dein Score: {{ score }}</p>
          <button @click="resetGame" class="btn btn-restart">Nochmal spielen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SnakeGame',
  data() {
    return {
      boardSize: 8,
      snake: [3 * 8 + 4],
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
    };
  },
  created() {
    this.initializeBoard();
    this.generateFood();
    this.loadHighscore();
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = 'hidden';

    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = '';
  },
  methods: {
    loadHighscore() {
      const saved = localStorage.getItem('snakeHighscore');
      if (saved) {
        this.highscore = parseInt(saved);
      }
    },
    saveHighscore() {
      if (this.score > this.highscore) {
        this.highscore = this.score;
        localStorage.setItem('snakeHighscore', this.highscore.toString());
      }
    },
    initializeBoard() {
      this.board = Array(this.boardSize * this.boardSize).fill(null);
      this.updateBoard();
    },
    generateFood() {
      let pos;
      do {
        pos = Math.floor(Math.random() * (this.boardSize * this.boardSize));
      } while (this.snake.includes(pos));
      this.food = pos;
    },
    startGame() {
      if (!this.gameRunning && !this.gameOver) {
        this.gameRunning = true;
        this.currentSpeed = this.baseSpeed;
        this.gameLoop();
      }
    },
    pauseGame() {
      this.gameRunning = false;
    },
    resumeGame() {
      this.gameRunning = true;
      this.gameLoop();
    },
    resetGame() {
      this.snake = [3 * 8 + 4];
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
          if (head % this.boardSize === 0) {
            this.gameOver = true;
            this.gameRunning = false;
            this.saveHighscore();
            return;
          }
          newHead = head - 1;
          break;
        case 'right':
          if (head % this.boardSize === this.boardSize - 1) {
            this.gameOver = true;
            this.gameRunning = false;
            this.saveHighscore();
            return;
          }
          newHead = head + 1;
          break;
      }

      if (newHead < 0 || newHead >= this.boardSize * this.boardSize) {
        this.gameOver = true;
        this.gameRunning = false;
        this.saveHighscore();
        return;
      }

      if (this.snake.includes(newHead)) {
        this.gameOver = true;
        this.gameRunning = false;
        this.saveHighscore();
        return;
      }

      this.snake.unshift(newHead);

      if (newHead === this.food) {
        this.score++;
        this.generateFood();
        this.updateSpeed();
      } else {
        this.snake.pop();
      }

      this.updateBoard();

      setTimeout(() => {
        this.gameLoop();
      }, this.currentSpeed);
    },
    updateSpeed() {
      this.currentSpeed = Math.max(this.minSpeed, this.baseSpeed - this.score * 3);
    },
    updateBoard() {
      const newBoard = Array(this.boardSize * this.boardSize).fill(null);
      this.snake.forEach((pos, i) => {
        if (i === 0) {
          newBoard[pos] = 'head';
        } else {
          newBoard[pos] = 'snake';
        }
      });
      newBoard[this.food] = 'food';
      this.board = newBoard;
    },
    handleKeyDown(e) {
      if (e.key === ' ') {
        e.preventDefault();
        if (this.gameRunning) this.pauseGame();
        else if (!this.gameOver) this.resumeGame();
        else this.resetGame();
        return;
      }

      let newDir = null;
      switch (e.key) {
        case 'ArrowUp':
          newDir = 'up';
          break;
        case 'ArrowDown':
          newDir = 'down';
          break;
        case 'ArrowLeft':
          newDir = 'left';
          break;
        case 'ArrowRight':
          newDir = 'right';
          break;
      }

      if (newDir) {
        e.preventDefault();
        this.processDirectionInput(newDir);
      }
    },
    changeDirection(dir) {
      this.processDirectionInput(dir);
    },
    processDirectionInput(dir) {
      if (!this.gameRunning && !this.gameOver) {
        this.nextDirection = dir;
        this.startGame();
        return;
      }

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
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #faf8ef;
  color: #776e65;
  overflow-x: hidden;
}

.snake-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 10px;
  background: linear-gradient(135deg, #bbada0 0%, #cdc1b4 100%);
  background-attachment: fixed;
}

.game-container {
  max-width: 500px;
  width: 100%;
  margin: 0 auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  font-size: 2.5rem;
  font-weight: bold;
  color: #776e65;
  margin: 0 0 10px 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: -1px;
  text-shadow: 0 1px 0 #f9f6f2;
}

.stats-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin: 10px 0 15px 0;
}

.stat-box {
  background: #bbada0;
  padding: 8px 15px;
  border-radius: 6px;
  text-align: center;
  min-width: 90px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  flex: 1;
  margin: 0 5px;
}

.stat-label {
  font-size: 0.75rem;
  color: #eee4da;
  font-weight: bold;
  margin-bottom: 3px;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: bold;
  color: #f9f6f2;
}

.game-info {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
  width: 100%;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-start {
  background: #8fbc8f;
  color: #f9f6f2;
  box-shadow: 0 4px 0 #7a9e7a;
}

.btn-start:hover {
  background: #7aae7a;
  transform: translateY(2px);
  box-shadow: 0 2px 0 #7a9e7a;
}

.btn-pause {
  background: #cd853f;
  color: #f9f6f2;
  box-shadow: 0 4px 0 #b37437;
}

.btn-pause:hover {
  background: #b37437;
  transform: translateY(2px);
  box-shadow: 0 2px 0 #b37437;
}

.btn-restart {
  background: #bc8f8f;
  color: #f9f6f2;
  box-shadow: 0 4px 0 #a97b7b;
}

.btn-restart:hover {
  background: #a97b7b;
  transform: translateY(2px);
  box-shadow: 0 2px 0 #a97b7b;
}

.game-board-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.game-board {
  display: grid;
  grid-gap: 3px;
  background-color: #bbada0;
  border-radius: 10px;
  padding: 8px;
  position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  overflow: hidden;
}

.cell {
  background-color: #cdc1b4;
  border-radius: 4px;
  position: relative;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
}

.snake {
  background: #77bfa3;
  border-radius: 4px;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
}

.head {
  background: #5fa88d;
  border-radius: 4px;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
}

.snake-eyes {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 1px;
}

.eye {
  width: 30%;
  height: 30%;
  background: #f9f6f2;
  border-radius: 50%;
  position: relative;
}

.eye::after {
  content: '';
  position: absolute;
  width: 40%;
  height: 40%;
  background: #776e65;
  border-radius: 50%;
  top: 30%;
  left: 30%;
}

.food {
  background: #ff5c5c;
  border-radius: 50%;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}

.controls {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 250px;
}

.horizontal-controls {
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: center;
}

.control-btn {
  flex: 1;
  min-width: 50px;
  min-height: 50px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #cdc1b4;
  color: #776e65;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.1s;
  box-shadow: 0 4px 0 #b8ad9f;
  aspect-ratio: 1 / 1;
}

.control-btn:hover {
  background: #b8ad9f;
  transform: translateY(2px);
  box-shadow: 0 2px 0 #b8ad9f;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(238, 228, 218, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  text-align: center;
}

.game-over-content {
  background: #bbada0;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  max-width: 90%;
  width: 300px;
  text-align: center;
}

.overlay h2 {
  font-size: 2.2rem;
  color: #776e65;
  margin: 0 0 10px 0;
}

.overlay p {
  font-size: 1.4rem;
  color: #776e65;
  margin: 10px 0;
}

@media (min-width: 769px) {
  .game-container {
    padding: 20px;
  }

  h1 {
    font-size: 3rem;
    margin-bottom: 20px;
  }

  .stats-container {
    margin: 20px 0;
  }

  .stat-box {
    min-width: 100px;
    padding: 10px 20px;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .btn {
    padding: 12px 25px;
    font-size: 1rem;
  }

  .game-board {
    grid-gap: 4px;
    padding: 10px;
  }

  .game-board {
    max-width: 480px;
    max-height: 480px;
  }

  .controls {
    display: none;
  }

  .overlay h2 {
    font-size: 2.5rem;
  }

  .overlay p {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .game-container {
    padding: 8px;
  }

  h1 {
    font-size: 2.3rem;
  }

  .stats-container {
    gap: 8px;
  }

  .stat-box {
    padding: 7px 12px;
    min-width: 85px;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .stat-value {
    font-size: 1.3rem;
  }

  .btn {
    padding: 9px 18px;
    font-size: 0.9rem;
  }

  .game-board {
    grid-gap: 2.5px;
    padding: 6px;
  }

  .controls {
    gap: 10px;
  }

  .horizontal-controls {
    gap: 10px;
  }

  .control-btn {
    min-width: 48px;
    min-height: 48px;
    font-size: 19px;
  }

  .overlay h2 {
    font-size: 2.1rem;
  }

  .overlay p {
    font-size: 1.3rem;
  }
}

@media (max-width: 400px) {
  .game-container {
    padding: 6px;
  }

  h1 {
    font-size: 2rem;
  }

  .stats-container {
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }

  .stat-box {
    min-width: 120px;
    padding: 6px 12px;
    width: 100%;
  }

  .btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }

  .game-board {
    grid-gap: 2px;
    padding: 5px;
  }

  .controls {
    gap: 9px;
    max-width: 220px;
  }

  .horizontal-controls {
    gap: 9px;
  }

  .control-btn {
    min-width: 45px;
    min-height: 45px;
    font-size: 18px;
  }

  .overlay h2 {
    font-size: 2rem;
  }

  .overlay p {
    font-size: 1.15rem;
  }

  .game-over-content {
    padding: 20px;
    width: 280px;
  }
}
</style>