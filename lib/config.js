var os = require('os'), 
fs = require('fs'),
path = require('path'),
root = process.env.NECO_ROOT,
ecosystem = process.env.NODE_ECOSYSTEM,
pkgDir = path.join(__dirname, '..'),
docsDir = path.join(pkgDir, 'docs'),
distFile = path.join(pkgDir, 'data/dist.json'),
shellDir = path.join(pkgDir, 'shell'),
recordFile = path.join(root, '.neco/record.json'),
fullDistFile = path.join(pkgDir, 'data/fullDist.json'),
pkgActivateFile = path.join(pkgDir, 'shell/activate.sh'),
globalActivateFile = path.join(root, '.neco', 'activate.sh'),
defaultConfigFile = path.join(pkgDir, 'data/defaultConfig.json'),
globalConfigFile = path.join(root, '.neco/config.json'),
userConfigFile = path.join(process.env.HOME, '.neconfig'),
normalizeValue = require('./utils.js').normalizeValue,
findlongestID = require('./assistant.js').findlongestID,
cleanGloalConfig = require('./utils.js').cleanGloalConfig,
cleanEcosystemConfig = require('./utils.js').cleanEcosystemConfig;

var keys, value, content;

// Prepare the global config object
exports.parseGlobalConfig = function(next) {
  var config = JSON.parse(fs.readFileSync(defaultConfigFile, 'utf8'));
  config.root = root;
  config.ecosystem = ecosystem; 
  config.recordFile = recordFile;
  config.globalActivateFile =  globalActivateFile;
  path.exists(globalConfigFile, function(exists) {
    if (exists) {
      content = JSON.parse(fs.readFileSync(globalConfigFile, 'utf8'));
      keys = Object.keys(content);
      keys.forEach(function(k) {
        key = k;
        value = content[k];
        Object.defineProperty(config, key, {value:value, writable:true, enumerable:true, configurable:true});
      });
      next(config);
    } else {
      next(config);
    }
  });  
};


exports.parseEcosystemConfig = function(config, next) {
  var ecosystemConfigFile, id = config.id;
  if (id) {
    ecosystemConfigFile = path.join(root, '.neco', id, 'config.json');
    path.exists(ecosystemConfigFile, function(exists) {
      if (exists) {
        content = JSON.parse(fs.readFileSync(ecosystemConfigFile, 'utf8'));
        keys = Object.keys(content);
        keys.forEach(function(k) {
          key = k;
          value = content[k];
          Object.defineProperty(config, key, {value:value, writable:true,enumerable:true, configurable:true});
        });
        next(config);
      } else {
        next(config);
      }
    });
  } else {
    next(config);
  }
};

exports.parsePkgConfig = function(config, next) {
  config.pkgDir = pkgDir;
  config.docsDir = docsDir;
  config.distFile = distFile;
  config.shellDir = shellDir;
  config.distFile = distFile;
  config.recordFile = recordFile;
  config.fullDistFile = fullDistFile;
  config.pkgActivateFile = pkgActivateFile;

  next(config);
};

exports.parseUserConfig = function(config, next) {
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
      next(config);
    } else {
      next(config);
    }
  });   
};
