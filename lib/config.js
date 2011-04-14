var os                   = require('os'),
    fs                   = require('fs'),
    path                 = require('path'),
    root                 = process.env.NECO_ROOT,
    ecosystem            = process.env.NODE_ECOSYSTEM,
    userConfigFile       = path.join(process.env.HOME, '.neconfig');

var pkgDir               = path.join(__dirname, '..'),
    pkgDocDir            = path.join(pkgDir, 'doc'),
    pkgDistFile          = path.join(pkgDir, 'share/data/dist.json'),
    pkgJSDir             = path.join(pkgDir, 'share/js'),
    pkgShellDir          = path.join(pkgDir, 'share/shell'),
    pkgActivateFile      = path.join(pkgDir, 'share/shell/activate.sh'),
    pkgConfigFile        = path.join(pkgDir, 'include/config.json'),
    pkgFullDistFile      = path.join(pkgDir, 'share/data/fullDist.json');

var recordFile           = path.join(root, '.neco/record.json'),
    localDistFile        = path.join(root, '.neco/dist.json'),
    localConfigFile      = path.join(root, '.neco/config.json'),
    localActivateFile    = path.join(root, '.neco/activate.sh');

var normalizeValue       = require('./utils.js').normalizeValue,
    findlongestID        = require('./assistant.js').findlongestID,
    cleanGloalConfig     = require('./utils.js').cleanGloalConfig,
    cleanEcosystemConfig = require('./utils.js').cleanEcosystemConfig;

var keys, value, content;

// Prepare the global config object
exports.parseGlobalConfig = function(next) {
  path.exists(localConfigFile, function(exists) {
      if (exists) {
        process.neco.globalConfig = JSON.parse(fs.readFileSync(localConfigFile, 'utf8'));
      } else {
        process.neco.globalConfig = {};
      }

      content = JSON.parse(fs.readFileSync(pkgConfigFile, 'utf8')); 
      keys = Object.keys(content);
      keys.forEach(function(k) {
          key = k;
          value = content[k];
          Object.defineProperty(process.neco.globalConfig, key, {value:value, writable:true, enumerable:true, configurable:true});
      });

      process.neco.globalConfig.pkgDir = pkgDir;
      process.neco.globalConfig.pkgDocDir = pkgDocDir;
      process.neco.globalConfig.pkgDistFile = pkgDistFile;
      process.neco.globalConfig.pkgJSDir = pkgJSDir;
      process.neco.globalConfig.pkgShellDir = pkgShellDir;
      process.neco.globalConfig.pkgConfigFile = pkgConfigFile; 
      process.neco.globalConfig.pkgFullDistFile = pkgFullDistFile;
      process.neco.globalConfig.pkgActivateFile = pkgActivateFile;

      process.neco.globalConfig.root = root;
      process.neco.globalConfig.ecosystem = ecosystem;  
      process.neco.globalConfig.recordFile = recordFile;
      process.neco.globalConfig.localDistFile = localDistFile; 
      process.neco.globalConfig.localConfigFile = localConfigFile;
      process.neco.globalConfig.localActivateFile =  localActivateFile;

      next();
  });  
};


exports.parseEcosystemConfig = function(id, next) {
  var ecosystemConfigFile; 
  process.neco.ecosystemConfig = {};
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

  next();
};  
