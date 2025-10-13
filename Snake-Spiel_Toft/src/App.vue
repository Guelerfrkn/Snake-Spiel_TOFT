<template>
  <div class="snake-game" @wheel.prevent>
    <h1>🐍 Snake Spiel</h1>
    <div class="game-stats">
      <div class="score">Score: <span>{{ score }}</span></div>
      <div class="highscore">Highscore: <span>{{ highscore }}</span></div>
    </div>

    <div class="game-info">
      <button @click="startGame" v-if="!gameRunning" class="btn primary">Start</button>
      <button @click="pauseGame" v-else-if="gameRunning && !gameOver" class="btn secondary">Pause</button>
      <button @click="resumeGame" v-else-if="!gameRunning && !gameOver" class="btn primary">Fortsetzen</button>
      <button @click="resetGame" v-if="gameOver" class="btn primary">Neues Spiel</button>
    </div>

    <div class="game-board" :style="{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }">
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
        <div v-if="cell === 'head'" class="snake-eyes"></div>
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

    <div v-if="gameOver" class="overlay">
      <h2>Game Over!</h2>
      <p>Dein Score: {{ score }}</p>
      <button @click="resetGame" class="btn primary">Nochmal spielen</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SnakeGame',
  data() {
    return {
      boardSize: 12,
      snake: [5 * 12 + 6], // Start in der Mitte
      direction: 'right',
      nextDirection: 'right',
      food: 0,
      gameRunning: false,
      gameOver: false,
      score: 0,
      highscore: 0,
      baseSpeed: 280,
      currentSpeed: 280,
      minSpeed: 150, // Maximalgeschwindigkeit (langsamer = größerer Wert)
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
  },
  beforeUnmount() {
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
      this.gameRunning = true;
      this.currentSpeed = this.baseSpeed;
      this.gameLoop();
    },
    pauseGame() {
      this.gameRunning = false;
    },
    resumeGame() {
      this.gameRunning = true;
      this.gameLoop();
    },
    resetGame() {
      this.snake = [5 * 12 + 6]; // Startposition
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
      // Geschwindigkeit erhöhen (Delay verringern), aber nicht schneller als minSpeed
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
.snake-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
  background: linear-gradient(135deg, #1a2a6c 0%, #b21f1f 100%);
  color: white;
  min-height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
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

.game-info {
  margin-bottom: 20px;
}

.btn {
  padding: 12px 25px;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  outline: none;
}

.btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.btn.primary {
  background: #4CAF50;
  color: white;
}

.btn.secondary {
  background: #f44336;
  color: white;
}

.game-board {
  display: grid;
  grid-gap: 5px; /* Größerer Abstand */
  width: 80vmin;
  height: 80vmin;
  max-width: 600px;
  max-height: 600px;
  background-color: rgba(0,0,0,0.3);
  border: 3px solid #444;
  border-radius: 10px;
  padding: 5px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}

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
  box-shadow: 0 0 10px rgba(0,255,0,0,0.6);
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
  position: relative;
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

.control-btn:hover {
  background: rgba(255,255,255,0.3);
}

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

.overlay h2 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.overlay p {
  font-size: 1.5rem;
  margin-bottom: 20px;
}

@media (max-width: 600px) {
  h1 {
    font-size: 1.8rem;
  }

  .game-stats {
    flex-direction: column;
    gap: 10px;
    font-size: 1.1rem;
  }

  .btn {
    padding: 10px 20px;
    font-size: 1rem;
  }

  .game-board {
    width: 90vmin;
    height: 90vmin;
  }

  .control-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}
</style>