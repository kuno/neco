var os = require('os'),
path = require('path'),
root = process.env.NECO_ROOT || process.env.HOME,
pkgDir = path.join(__dirname, '..'),
defaultConfigFile = path.join(pkgDir, 'data/defaultconfig.json'),
getUserConfig = require('./parser.js').getUserConfig,
getEcosystemConfig = require('./parse.js').getEcosystemConfig;

exports.getConfig = function(id) {
  var config, defaultConfig, userConfig, ecosystemConfig;

  defaultConfig = JSON.parse(fs.readFileSync(defaultConfigFile, 'utf8'));
  userConfig = getUserConfig();
  ecosystemConfig = getEcosystemConfig(id);

  // Make inherint chaine
  userConfig.__proto__ = defaultConfig;
  ecosystemConfig.__proto__ = userConfigFile;

  config = ecosystemConfig;

  return config;
};
