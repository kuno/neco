var os = require('os'), fs = require('fs'),
path = require('path'),
root = process.env.NECO_ROOT,
pkgDir = path.join(__dirname, '..'),
defaultConfigFile = path.join(pkgDir, 'data/defaultConfig.json'),
userConfigFile = path.join(process.env.HOME, '.neconfig'),  
normalizeValue = require('./utils.js').normalizeValue;

exports.getConfig = function(id) {
  var pkgFile, config, userConfig, ecosystemConfigFile;
  config = JSON.parse(fs.readFileSync(defaultConfigFile, 'utf8'));
  config.root = root || undefined;
  config.pkgDir = pkgDir;
  config.docDir = path.join(pkgDir, 'docs');
  config.distFile = path.join(pkgDir, 'data/dist.json');
  config.fullDistFile = path.join(pkgDir, 'data/fullDist.json');
  config.shellDir = path.join(pkgDir, 'shell');
  config.recordFile = path.join(root, '.neco/record.json');
  config.ecosystem = process.env.NODE_ECOSYSTEM || undefined;   

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

  return config;
};
