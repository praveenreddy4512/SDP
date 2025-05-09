import fs from 'fs';
import path from 'path';

const requiredDirs = [
  'src/server',
  'src/lib',
  'src/utils',
  'dist'
];

function ensureDirectories() {
  console.log('Checking required directories...');
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  console.log('Directory check complete');
}

// Run the check
ensureDirectories(); 