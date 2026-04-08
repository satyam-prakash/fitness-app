const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Set the project root to this directory (frontend)
config.projectRoot = __dirname;

// Set watchFolders to only watch this directory
config.watchFolders = [__dirname];

// Make sure resolver looks in the right node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;
