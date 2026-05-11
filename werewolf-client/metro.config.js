const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return {
      filePath: require.resolve('tslib/tslib.es6.js'),
      type: 'sourceFile',
    };
  }
  // Fallback to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.sourceExts.push('mjs', 'cjs');
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
