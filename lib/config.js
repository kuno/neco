var os = require('os'), 
fs = require('fs'),
path = require('path'),
root = process.env.NECO_ROOT,
pkgDir = path.join(__dirname, '..'),
pkgActivateFile = path.join(pkgDir, 'shell/activate.sh'),
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

  path.exists(globalConfigFile, function(exists) {
    if (exists) {
      content = JSON.parse(fs.readFileSync(globalConfigFile, 'utf8'));
      keys = Object.keys(content);
      keys.forEach(function(k) {
        key = k;
        value = content[k];
        Object.defineProperty(config, key, {value:value, writable:true, enumerable:true, configurable:true});
        config.root = root;
        config.pkgDir = pkgDir;
        config.docDir = path.join(pkgDir, 'docs');
        config.distFile = path.join(pkgDir, 'data/dist.json');
        config.fullDistFile = path.join(pkgDir, 'data/fullDist.json');
        config.shellDir = path.join(pkgDir, 'shell');
        config.recordFile = path.join(root, '.neco/record.json');
        config.ecosystem = process.env.NODE_ECOSYSTEM;
        config.idLenStandard = findlongestID(config);
        config.pkgActivateFile = pkgActivateFile;
        config.globalActivateFile = path.join(root, '.neco', 'activate.sh');    
        next(cleanGloalConfig(config));
      });
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
          next(cleanEcosystemConfig(config));
        });
      }
    });
  }   
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
          next(config);
        }
      });
    } else {
      next(config);
    }
  });   
};

exports.getConfig = function(id) {
  var keys, pkgFile, config, userConfig, ecosystemConfigFile;
  config = JSON.parse(fs.readFileSync(defaultConfigFile, 'utf8'));

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
          Object.defineProperty(config, key, {value:value, writable:true,enumerable:true, configurable:true});
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

  config = cleanEcosystemConfig(cleanGloalConfig(config));
  config.root = root;
  config.pkgDir = pkgDir;
  config.docDir = path.join(pkgDir, 'docs');
  config.distFile = path.join(pkgDir, 'data/dist.json');
  config.fullDistFile = path.join(pkgDir, 'data/fullDist.json');
  config.shellDir = path.join(pkgDir, 'shell');
  config.recordFile = path.join(root, '.neco/record.json');
  config.ecosystem = process.env.NODE_ECOSYSTEM;
  config.idLenStandard = findlongestID(config);
  config.globalActivateFile = path.join(root, '.neco', 'activate.sh'); 

  return config;
};
