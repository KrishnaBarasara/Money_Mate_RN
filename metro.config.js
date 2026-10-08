// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure proper module resolution
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  unstable_enableSymlinks: false,
};

module.exports = config;

