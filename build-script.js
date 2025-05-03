const fs = require('fs');
const path = require('path');

// Ensure directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Copy components to both potential locations
const copyComponents = () => {
  console.log('Copying components to multiple locations for path resolution...');
  
  const gameWrapperSrcPath = path.join(__dirname, 'src', 'components', 'GameWrapper.tsx');
  const snakeGameSrcPath = path.join(__dirname, 'src', 'components', 'SnakeGame.tsx');
  
  console.log(`Looking for GameWrapper at: ${gameWrapperSrcPath}`);
  console.log(`Looking for SnakeGame at: ${snakeGameSrcPath}`);
  
  const gameWrapperExists = fs.existsSync(gameWrapperSrcPath);
  const snakeGameExists = fs.existsSync(snakeGameSrcPath);
  
  console.log(`GameWrapper exists: ${gameWrapperExists}`);
  console.log(`SnakeGame exists: ${snakeGameExists}`);
  
  // Create components directory at project root if it doesn't exist
  ensureDir(path.join(__dirname, 'components'));
  
  if (gameWrapperExists) {
    // Copy GameWrapper to /components/
    fs.copyFileSync(
      gameWrapperSrcPath,
      path.join(__dirname, 'components', 'GameWrapper.tsx')
    );
    console.log('Successfully copied GameWrapper to components directory.');
  } else {
    console.error('Source GameWrapper.tsx not found!');
  }
  
  if (snakeGameExists) {
    // Copy SnakeGame to /components/
    fs.copyFileSync(
      snakeGameSrcPath,
      path.join(__dirname, 'components', 'SnakeGame.tsx')
    );
    console.log('Successfully copied SnakeGame to components directory.');
  } else {
    console.error('Source SnakeGame.tsx not found!');
  }
};

try {
  // Run our setup
  copyComponents();
  console.log('Build script completed successfully.');
} catch (error) {
  console.error('Build script error:', error);
  process.exit(1);
} 