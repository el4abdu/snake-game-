const fs = require('fs');
const path = require('path');

// Ensure directories exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Copy GameWrapper.tsx to both potential locations
const copyGameWrapper = () => {
  console.log('Copying GameWrapper component to multiple locations for path resolution...');
  
  const srcPath = path.join(__dirname, 'src', 'components', 'GameWrapper.tsx');
  
  if (fs.existsSync(srcPath)) {
    // Create components directory at project root if it doesn't exist
    ensureDir(path.join(__dirname, 'components'));
    
    // Copy to /components/GameWrapper.tsx
    fs.copyFileSync(
      srcPath,
      path.join(__dirname, 'components', 'GameWrapper.tsx')
    );
    
    console.log('Successfully copied GameWrapper component to alternate locations.');
  } else {
    console.error('Source GameWrapper.tsx not found!');
  }
};

// Run our setup
copyGameWrapper(); 