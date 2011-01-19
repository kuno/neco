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
  process.config = {};
  path.exists(globalConfigFile, function(exists) {
    if (exists) {
      config = JSON.parse(fs.readFileSync(globalConfigFile, 'utf8'));
    }

    content = JSON.parse(fs.readFileSync(globalConfigFile, 'utf8')); 
    keys = Object.keys(content);
    keys.forEach(function(k) {
      key = k;
      value = content[k];
      Object.defineProperty(process.config, key, {value:value, writable:true, enumerable:true, configurable:true});
    });

    process.config.root = root;
    process.config.ecosystem = ecosystem; 
    process.config.recordFile = recordFile;
    process.config.globalConfigFile = globalConfigFile;
    process.config.globalActivateFile =  globalActivateFile; 
    next();
  });  
};


exports.parseEcosystemConfig = function(id, next) {
  var ecosystemConfigFile;
  if (id) {
    ecosystemConfigFile = path.join(root, '.neco', id, 'config.json');
    path.exists(ecosystemConfigFile, function(exists) {
      if (exists) {
        content = JSON.parse(fs.readFileSync(ecosystemConfigFile, 'utf8'));
        keys = Object.keys(content);
        keys.forEach(function(k) {
          key = k;
          value = content[k];
          Object.defineProperty(process.config, key, {value:value, writable:true,enumerable:true, configurable:true});
        });
        next();
      } else {
        next();
      }
    });
  } else {
    next();
  }
};

exports.parsePkgConfig = function(next) {
  process.config.pkgDir = pkgDir;
  process.config.docsDir = docsDir;
  process.config.distFile = distFile;
  process.config.shellDir = shellDir;
  process.config.distFile = distFile;
  process.config.recordFile = recordFile;
  process.config.fullDistFile = fullDistFile;
  process.config.pkgActivateFile = pkgActivateFile;

  next();
};

exports.parseUserConfig = function(next) {
  path.exists(userConfigFile, function(exists) {
    if (exists) {
      content = fs.readFileSync(userConfigFile, 'utf8').trim().split('\n');
      content.forEach(function(c) {
        if (c.match(/\=/)) {
          key = c.split('=')[0].trim();
          value = normalizeValue(c.split('=')[1].trim());
          Object.defineProperty(process.config, key, {value:value, writable:true, enumerable:true, configurable:true});
        }
      });
      next();
    } else {
      next();
    }
  });   
};
