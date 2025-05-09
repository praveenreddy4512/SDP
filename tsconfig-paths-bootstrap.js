const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('./tsconfig.server.json');

const baseUrl = './';
const cleanup = tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths
}); 