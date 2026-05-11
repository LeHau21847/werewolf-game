module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Plugin mạnh để biến đổi triệt để lỗi 'import.meta' trên web
      'babel-plugin-transform-import-meta',
    ],
  };
};
