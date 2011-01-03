var os = require('os'),
fs = require('fs'),
path = require('path'),
root = process.env.NECO_ROOT || process.env.HOME,
pkgDir = path.join(__dirname, '..'),
defaultConfigFile = path.join(pkgDir, 'data/defaultConfig.json'),
parseUserConfigFile = require('./parser.js').parseUserConfigFile,  
parseEcosystemConfig = require('./parser.js').parseEcosystemConfig,
normalizeValue = require('./utils.js').normalizeValue;

exports.getConfig = function(id) {
  var config, defaultConfig;
  defaultConfig = JSON.parse(fs.readFileSync(defaultConfigFile, 'utf8'));

  parseUserConfigFile(function(userConfig) {
    userConfig.__proto__ = defaultConfig;
    config = userConfig;
    return config;
    if (id) {
      parseEcosystemConfigFile(id, function(ecosystemConfig) {
        ecosystemConfig.__proto__ = userConfig;
        config = ecosystemConfig;
        return config;
      });
    }
  });
};
