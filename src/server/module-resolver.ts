import { resolve as resolvePath } from 'path';
import { addAliases } from 'module-alias';

const rootDir = resolvePath(__dirname, '../..');

addAliases({
  '@': resolvePath(rootDir, 'src')
});

export default function initializeModuleResolver() {
  // The initialization is done when the file is imported
  console.log('Module aliases initialized');
} 