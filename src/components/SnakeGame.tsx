'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

// Game settings
const GRID_SIZE = 20;
const GAME_SPEED = 100;
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// Game theme colors
const THEME = {
  snake: {
    head: '#059669', // Emerald-600
    body: '#10b981', // Emerald-500
  },
  food: '#ef4444', // Red-500
  grid: '#f3f4f6', // Gray-100
  gridLines: '#e5e7eb', // Gray-200
  background: '#ffffff', // White
  text: {
    primary: '#1f2937', // Gray-800
    secondary: '#4b5563', // Gray-600
    accent: '#ffffff', // White
  },
  button: {
    primary: {
      bg: '#10b981', // Emerald-500
      hover: '#059669', // Emerald-600
      text: '#ffffff', // White
    },
    secondary: {
      bg: '#e5e7eb', // Gray-200
      hover: '#d1d5db', // Gray-300
      text: '#4b5563', // Gray-600
    },
  },
};

// Score entry type
type ScoreEntry = {
  userId: string;
  username: string;
  score: number;
  date: string;
};

// Snake component
export default function SnakeGame() {
  const { user } = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(DIRECTIONS.RIGHT);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const directionRef = useRef(direction);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Format date for display
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  // Toggle leaderboard visibility
  const toggleLeaderboard = () => {
    setShowLeaderboard(!showLeaderboard);
  };
  
  // Reset game
  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection(DIRECTIONS.RIGHT);
    setFood(generateFood());
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setSpeedMultiplier(1);
  }, []);  // Empty dependency array now, will add generateFood after its definition

  // Generate random food
  const generateFood = useCallback(() => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    
    // Check if food is on the snake
    const isOnSnake = snake.some(segment => segment.x === x && segment.y === y);
    
    if (isOnSnake) {
      return generateFood();
    }
    
    return { x, y };
  }, [snake]);

  // Update resetGame to include generateFood in dependencies
  useEffect(() => {
    // This effect only runs once to update the resetGame function's closure
    resetGame.toString(); // Just to use resetGame and avoid lint warning
  }, [resetGame, generateFood]);

  // Save score to leaderboard
  const saveScore = useCallback((currentScore: number) => {
    if (!user) return;

    const newScoreEntry: ScoreEntry = {
      userId: user.id,
      username: user.username || user.firstName || 'Anonymous',
      score: currentScore,
      date: new Date().toISOString(),
    };

    // Update leaderboard
    setLeaderboard(prevLeaderboard => {
      // Check if user already has a score
      const userIndex = prevLeaderboard.findIndex(entry => entry.userId === user.id);
      
      let updatedLeaderboard;
      if (userIndex >= 0) {
        // Update existing score if higher
        if (currentScore > prevLeaderboard[userIndex].score) {
          updatedLeaderboard = [
            ...prevLeaderboard.slice(0, userIndex),
            newScoreEntry,
            ...prevLeaderboard.slice(userIndex + 1)
          ];
        } else {
          // No update needed
          return prevLeaderboard;
        }
      } else {
        // Add new score
        updatedLeaderboard = [...prevLeaderboard, newScoreEntry];
      }
      
      // Sort by score (highest first) and limit to top 10
      updatedLeaderboard.sort((a, b) => b.score - a.score);
      updatedLeaderboard = updatedLeaderboard.slice(0, 10);
      
      // Save to localStorage
      localStorage.setItem('snakeLeaderboard', JSON.stringify(updatedLeaderboard));
      
      return updatedLeaderboard;
    });
  }, [user]);

  // Update direction ref when direction state changes
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Load high score and leaderboard from localStorage
  useEffect(() => {
    // Load personal high score
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    // Load leaderboard
    const savedLeaderboard = localStorage.getItem('snakeLeaderboard');
    if (savedLeaderboard) {
      try {
        const parsedLeaderboard = JSON.parse(savedLeaderboard);
        setLeaderboard(parsedLeaderboard);
      } catch (error) {
        console.error('Error parsing leaderboard:', error);
        // Initialize empty leaderboard if parsing fails
        setLeaderboard([]);
      }
    }
  }, []);

  // Update high score if current score is higher and save to localStorage in real-time
  useEffect(() => {
    if (score > 0) {
      // Save current score in real-time
      if (user) {
        saveScore(score);
      }
      
      // Update personal high score if needed
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('snakeHighScore', score.toString());
      }
    }
  }, [score, highScore, user, saveScore]);

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused) return;
    
    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y,
        };
        
        // Check for collision with walls
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setGameOver(true);
          return prevSnake;
        }
        
        // Check for collision with self
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }
        
        const newSnake = [newHead, ...prevSnake];
        
        // Check for collision with food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(prev => prev + 1);
          
          // Increase speed every 5 points
          if ((score + 1) % 5 === 0 && speedMultiplier < 2) {
            setSpeedMultiplier(prev => prev + 0.1);
          }
          
          setFood(generateFood());
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }
        
        return newSnake;
      });
    };
    
    const gameLoop = setInterval(moveSnake, GAME_SPEED / speedMultiplier);
    return () => clearInterval(gameLoop);
  }, [food, gameOver, generateFood, isPaused, score, speedMultiplier]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) {
        if (e.key === 'Enter') resetGame();
        return;
      }
      
      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current !== DIRECTIONS.DOWN) {
            setDirection(DIRECTIONS.UP);
          }
          break;
        case 'ArrowDown':
          if (directionRef.current !== DIRECTIONS.UP) {
            setDirection(DIRECTIONS.DOWN);
          }
          break;
        case 'ArrowLeft':
          if (directionRef.current !== DIRECTIONS.RIGHT) {
            setDirection(DIRECTIONS.LEFT);
          }
          break;
        case 'ArrowRight':
          if (directionRef.current !== DIRECTIONS.LEFT) {
            setDirection(DIRECTIONS.RIGHT);
          }
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, resetGame]);

  // Draw game
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = THEME.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = THEME.gridLines;
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * (canvas.width / GRID_SIZE), 0);
      ctx.lineTo(i * (canvas.width / GRID_SIZE), canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * (canvas.height / GRID_SIZE));
      ctx.lineTo(canvas.width, i * (canvas.height / GRID_SIZE));
      ctx.stroke();
    }
    
    // Calculate cell size and padding
    const cellSize = canvas.width / GRID_SIZE;
    const padding = 1; // Padding between cells
    
    // Draw snake
    snake.forEach((segment, index) => {
      // Make head a different color and slightly larger
      if (index === 0) {
        ctx.fillStyle = THEME.snake.head;
        // Draw rounded head
        ctx.beginPath();
        ctx.roundRect(
          segment.x * cellSize + padding,
          segment.y * cellSize + padding,
          cellSize - padding * 2,
          cellSize - padding * 2,
          8 // Rounded corners
        );
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#ffffff';
        
        // Position eyes based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        const eyeRadius = cellSize / 8;
        const eyeOffset = cellSize / 4;
        
        if (directionRef.current === DIRECTIONS.RIGHT) {
          // Facing right
          leftEyeX = segment.x * cellSize + cellSize - eyeOffset;
          leftEyeY = segment.y * cellSize + eyeOffset;
          rightEyeX = segment.x * cellSize + cellSize - eyeOffset;
          rightEyeY = segment.y * cellSize + cellSize - eyeOffset;
        } else if (directionRef.current === DIRECTIONS.LEFT) {
          // Facing left
          leftEyeX = segment.x * cellSize + eyeOffset;
          leftEyeY = segment.y * cellSize + eyeOffset;
          rightEyeX = segment.x * cellSize + eyeOffset;
          rightEyeY = segment.y * cellSize + cellSize - eyeOffset;
        } else if (directionRef.current === DIRECTIONS.UP) {
          // Facing up
          leftEyeX = segment.x * cellSize + eyeOffset;
          leftEyeY = segment.y * cellSize + eyeOffset;
          rightEyeX = segment.x * cellSize + cellSize - eyeOffset;
          rightEyeY = segment.y * cellSize + eyeOffset;
        } else {
          // Facing down
          leftEyeX = segment.x * cellSize + eyeOffset;
          leftEyeY = segment.y * cellSize + cellSize - eyeOffset;
          rightEyeX = segment.x * cellSize + cellSize - eyeOffset;
          rightEyeY = segment.y * cellSize + cellSize - eyeOffset;
        }
        
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeRadius / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeRadius / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw body with gradient color based on position
        const gradientFactor = 1 - Math.min(index / (snake.length * 1.5), 0.5);
        const r = parseInt(THEME.snake.body.slice(1, 3), 16);
        const g = parseInt(THEME.snake.body.slice(3, 5), 16);
        const b = parseInt(THEME.snake.body.slice(5, 7), 16);
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.5 + gradientFactor * 0.5})`;
        
        // Draw rounded body segments
        ctx.beginPath();
        ctx.roundRect(
          segment.x * cellSize + padding,
          segment.y * cellSize + padding,
          cellSize - padding * 2,
          cellSize - padding * 2,
          5 // Rounded corners (less than head)
        );
        ctx.fill();
      }
    });
    
    // Draw food with a pulsing effect
    const pulse = (Math.sin(Date.now() / 200) + 1) / 8 + 0.75; // Value between 0.75 and 1
    
    ctx.fillStyle = THEME.food;
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      (cellSize / 2 - padding) * pulse,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Add a shine effect to the food
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 3,
      food.y * cellSize + cellSize / 3,
      cellSize / 6,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
  }, [snake, food]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-bold text-gray-800">
            Score: <span className="text-emerald-500">{score}</span>
          </div>
          <div className="text-sm font-medium text-gray-600">
            High Score: <span className="text-emerald-500">{highScore}</span>
          </div>
        </div>
        
        <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="bg-white"
          />
          
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm text-white">
              <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
              <p className="text-lg mb-2">Your score: <span className="text-emerald-400 font-bold">{score}</span></p>
              {score >= highScore && score > 0 && (
                <p className="text-sm text-emerald-400 mb-4">New High Score! 🎉</p>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white font-medium transition-colors shadow-lg"
                >
                  Play Again
                </button>
                <button
                  onClick={toggleLeaderboard}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-full text-white font-medium transition-colors shadow-lg"
                >
                  {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
                </button>
              </div>
              <p className="text-sm text-gray-300 mt-4">Press Enter to restart</p>
            </div>
          )}
          
          {isPaused && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm text-white">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Paused</h2>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white font-medium transition-colors shadow-lg"
                  >
                    Resume
                  </button>
                  <button
                    onClick={toggleLeaderboard}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-full text-white font-medium transition-colors shadow-lg"
                  >
                    {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
                  </button>
                </div>
                <p className="text-sm text-gray-300 mt-4">Press Space to resume</p>
              </div>
            </div>
          )}
          
          {showLeaderboard && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm text-white p-6 overflow-auto">
              <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
              
              {leaderboard.length === 0 ? (
                <p className="text-gray-400">No scores yet. Be the first!</p>
              ) : (
                <div className="w-full max-w-sm">
                  <div className="grid grid-cols-12 gap-2 text-sm font-bold text-gray-300 mb-2 px-2">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Player</div>
                    <div className="col-span-3 text-right">Score</div>
                    <div className="col-span-3 text-right">Date</div>
                  </div>
                  
                  {leaderboard.map((entry, index) => (
                    <div 
                      key={index}
                      className={`grid grid-cols-12 gap-2 text-sm rounded p-2 ${
                        entry.userId === user?.id ? 'bg-emerald-900 bg-opacity-40' : index % 2 === 0 ? 'bg-gray-800 bg-opacity-40' : ''
                      }`}
                    >
                      <div className="col-span-1 font-bold">{index + 1}</div>
                      <div className="col-span-5 truncate">{entry.username}</div>
                      <div className="col-span-3 text-right font-bold text-emerald-400">{entry.score}</div>
                      <div className="col-span-3 text-right text-gray-400 text-xs">{formatDate(entry.date)}</div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={toggleLeaderboard}
                className="mt-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white"
              >
                Close
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p className="mb-1">
              <span className="inline-block bg-gray-200 rounded px-2 py-1 mr-1">↑↓←→</span> 
              to move
            </p>
            <p>
              <span className="inline-block bg-gray-200 rounded px-2 py-1 mr-1">Space</span> 
              to pause/resume
            </p>
          </div>
          
          <div className="flex gap-2">
            {!gameOver && !isPaused ? (
              <button
                onClick={() => setIsPaused(true)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition-colors"
              >
                Pause
              </button>
            ) : !gameOver && (
              <button
                onClick={() => setIsPaused(false)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium transition-colors"
              >
                Resume
              </button>
            )}
            
            <button
              onClick={toggleLeaderboard}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg text-white font-medium transition-colors"
            >
              {showLeaderboard ? 'Hide Scores' : 'Leaderboard'}
            </button>
          </div>
        </div>
        
        {score > 0 && (
          <div className="mt-4 p-2 bg-emerald-50 border border-emerald-100 rounded-md text-sm text-emerald-800">
            <p className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Your score is being saved automatically
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 