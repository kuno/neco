var os = require('os'), 
fs = require('fs'),
path = require('path'),
root = process.env.NECO_ROOT,
pkgDir = path.join(__dirname, '..'),
defaultConfigFile = path.join(pkgDir, 'data/defaultConfig.json'),
configFile = path.join(root, '.neco/config.json'),
userConfigFile = path.join(process.env.HOME, '.neconfig'),
normalizeValue = require('./utils.js').normalizeValue;

// Prepare the global config object
exports.getConfiguration = function(id) {
  var keys, pkgFile, config, userConfig, ecosystemConfigFile;
  config = JSON.parse(fs.readFileSync(defaultConfigFile, 'utf8'));
  config.root = root || undefined;
  config.pkgDir = pkgDir;
  config.docDir = path.join(pkgDir, 'docs');
  config.distFile = path.join(pkgDir, 'data/dist.json');
  config.fullDistFile = path.join(pkgDir, 'data/fullDist.json');
  config.shellDir = path.join(pkgDir, 'shell');
  config.recordFile = path.join(root, '.neco/record.json');
  config.ecosystem = process.env.NODE_ECOSYSTEM || undefined;   

  path.exists(configFile, function(exists) {
    if (exists) {
      content = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      keys = Object.keys(content);
      keys.forEach(function(k) {
        key = k;
        value = content[k];
        Object.defineProperty(config, key, {value:value, writable:true, enumerable:true, configurable:true});
      });
    }
  });

  if (id) {
    ecosystemConfigFile = path.join(root, '.neco', id, 'config.json');
    path.exists(ecosystemConfigFile, function(exists) {
      if (exists) {
        content = JSON.parse(fs.readFileSync(ecosystemConfigFile, 'utf8'));
        keys = Object.keys(content);
        keys.forEach(function(k) {
          key = k;
          value = content[k];
          Object.defineProperty(config, key, {value:value, writable:true,enumerable:ture, configurable:true});
        });
      }
    });
  }

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
  });  

  return config;
};
