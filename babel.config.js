module.exports = {
  presets: ['module:@haul-bundler/babel-preset-react-native'],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  }
};
