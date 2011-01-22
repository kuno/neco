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
pkgConfigFile = path.join(pkgDir, 'data/defaultConfig.json'),
globalConfigFile = path.join(root, '.neco/config.json'),
userConfigFile = path.join(process.env.HOME, '.neconfig'),
normalizeValue = require('./utils.js').normalizeValue,
findlongestID = require('./assistant.js').findlongestID,
cleanGloalConfig = require('./utils.js').cleanGloalConfig,
cleanEcosystemConfig = require('./utils.js').cleanEcosystemConfig;

var keys, value, content;

// Prepare the global config object
exports.parseGlobalConfig = function(next) {
  process.neco.globalconfig = {};
  path.exists(globalConfigFile, function(exists) {
    if (exists) {
      process.neco.globalConfig = JSON.parse(fs.readFileSync(globalConfigFile, 'utf8'));
    }

    content = JSON.parse(fs.readFileSync(globalConfigFile, 'utf8')); 
    keys = Object.keys(content);
    keys.forEach(function(k) {
      key = k;
      value = content[k];
      Object.defineProperty(process.neco.globalConfig, key, {value:value, writable:true, enumerable:true, configurable:true});
    });

    process.neco.globalConfig.root = root;
    process.neco.globalConfig.pkgDir = pkgDir;
    process.neco.globalConfig.docsDir = docsDir;
    process.neco.globalConfig.distFile = distFile;
    process.neco.globalConfig.shellDir = shellDir;
    process.neco.globalConfig.distFile = distFile;
    process.neco.globalConfig.recordFile = recordFile;
    process.neco.globalConfig.fullDistFile = fullDistFile;
    process.neco.globalConfig.pkgActivateFile = pkgActivateFile;   
    process.neco.globalConfig.ecosystem = ecosystem; 
    process.neco.globalConfig.recordFile = recordFile;
    process.neco.globalConfig.pkgConfigFile = pkgConfigFile;
    process.neco.globalConfig.globalActivateFile =  globalActivateFile; 
    next();
  });  
};


exports.parseEcosystemConfig = function(id, next) {
  process.neco.ecosystemConfig = {};
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
          Object.defineProperty(process.neco.ecosystemConfig, key, {value:value, writable:true,enumerable:true, configurable:true});
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

/*
 exports.parsePkgConfig = function(next) {
   process.neco.pkgConfig = {};
   process.neco.pkgConfig.pkgDir = pkgDir;
   process.neco.pkgConfig.docsDir = docsDir;
   process.neco.pkgConfig.distFile = distFile;
   process.neco.pkgConfig.shellDir = shellDir;
   process.neco.pkgConfig.distFile = distFile;
   process.neco.pkgConfig.recordFile = recordFile;
   process.neco.pkgConfig.fullDistFile = fullDistFile;
   process.neco.pkgConfig.pkgActivateFile = pkgActivateFile;

   next();
 };*/

 exports.parseUserConfig = function(next) {
   process.neco.userConfig = {};
   path.exists(userConfigFile, function(exists) {
     if (exists) {
       content = fs.readFileSync(userConfigFile, 'utf8').trim().split('\n');
       content.forEach(function(c) {
         if (c.match(/\=/)) {
           key = c.split('=')[0].trim();
           value = normalizeValue(c.split('=')[1].trim());
           Object.defineProperty(process.neco.userConfig, key, {value:value, writable:true, enumerable:true, configurable:true});
         }
       });
       next();
     } else {
       next();
     }
   });   
 };

 exports.filterConfig = function(next) {
   process.neco.config = {};
   if (process.neco.ecosystemConfig) {
     process.neco.ecosystemConfig.__proto__ = process.neco.globalConfig;
     process.neco.userConfig.__proto__ = process.neco.ecosystemConfig;
     process.neco.config.__proto__ = process.neco.userConfig;
   } else {
     process.neco.userConfig.__proto__ = process.neco.globalConfig;
     process.neco.config.__proto__ = process.neco.userConfig;
   }
   process.neco.config.idLenStandard = findlongestID(config); 
   next();
 };  
