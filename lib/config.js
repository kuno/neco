var os = require('os'),
fs = require('fs'),
path = require('path'),
root = process.env.NECO_ROOT || process.env.HOME,
pkgDir = path.join(__dirname, '..'),
defaultConfigFile = path.join(pkgDir, 'data/defaultConfig.json'),
userConfigFile = path.join(process.env.HOME, '.neconfig'),  
normalizeValue = require('./utils.js').normalizeValue;

exports.getConfig = function(id) {
  var pkgFile, config, userConfig, ecosystemConfigFile;
  config = JSON.parse(fs.readFileSync(defaultConfigFile, 'utf8'));
  pkgFile = path.join(pkgDir, 'package.json');

  config.pkgDir = pkgDir;
  config.pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));

  path.exists(userConfigFile, function(exists) {
    if (exists) {
      content = fs.readFileSync(userConfigFile, 'utf8').trim().split('\n');
      content.forEach(function(c) {
        if (c.match(/\=/)) {
          key = c.split('=')[0].trim();
          value = normalizeValue(c.split('=')[1].trim());
          Object.defineProperty(config, key, {value:value, writable:true, enumerable:true, configurable:true});
        }
      });
    }

    if (id) {
      ecosystemConfigFile = path.join(root, '.neco', id, 'config');
      path.exists(ecosystemConfigFile, function(exists) {
        if (exists) {
          content = fs.readFileSync(f, 'utf8').trim().split('\n');
          content.forEach(function(c) {
            if (c.match(/\=/)) {
              key = c.split('=')[0].trim();
              value = normalizeValue(c.split('=')[1].trim());
              Object.defineProperty(config, key, {value:value, writable:true, enumerable:true, configurable:true});
            }
          });
        }
      });   
    }
  });

  if (process.env.NECO_ROOT) {
    config.root = process.env.NECO_ROOT;
  } else {
    config.root = process.env.HOME;
  }

  if (process.env.NODE_ECOSYSTEM) {
    config.ecosystem = process.env.NODE_ECOSYSTEM;
  }

  if (process.env.NODE_VERSION) {
    config.version = process.env.NODE_VERSION;
  }

  return config;
};
