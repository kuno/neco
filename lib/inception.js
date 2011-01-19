var fs = require('fs'),
path = require('path'),
log = require('./display.js').log,
root = process.env.NECO_ROOT,
pkgDir = path.join(__dirname, '..'),
ecosystem = process.env.NODE_ECOSYSTEM,
recordFile = path.join(root, '.neco', 'record.json'),
pkgActivateFile = path.join(pkgDir, 'shell/activate.sh'),
globalActivateFile = path.join(root, '.neco', 'activate.sh'),
findlongestID = require('./assistant.js').findlongestID, 
notSmaller = require('./utils.js').compareVersions;  

var message, warning, error, suggestion, example;

exports.envReady = function(cmd, next) {
  var root = process.config.root, 
  ecosystem = process.config.ecosystem;
  if (root === undefined || ecosystem !== undefined) {
    if (root === undefined) {
      message = 'It\'s seems that you have not setup NECO_ROOT environment variable!';
      suggestion = 'add \'export NECO_ROOT=<path>\' into your shell config file.';
      log('message', message, suggestion);
    } else if (root !== undefined && ecosystem !== undefined) {
      if (cmd === 'create') {
        warning = 'It\'s seems that you are alreay in a node ecosystem.';
        suggestion = 'First, deactivate existing ecosystem, then create new one.';
        example = 'neco_deactivate'; 
        log('warning', warning, suggestion, example);
      } else {
        next();
      }
    }
  } else {
    next();
  }
};

exports.rootReady = function(next) {
  var rootDir = path.join(process.config.root, '.neco');
  path.exists(rootDir, function(exists) {
    if (!exists) {
      fs.mkdir(rootDir, mode=0777, function(err) {
        if (err) {throw err;}
        next();
      });
    } else {
      next();
    }
  });
};

exports.recordReady = function(cmd, next) {
  var recordFile = process.config.recordFile, ecosystems;
  path.exists(recordFile, function(exists) {
    if (!exists) {
      if (cmd !== 'create') {
        message = 'You have not create any node ecosystem yet.';
        suggestion = 'Use create command to create first one!';
        example = 'nc create <id> [stable, latest, node-version]';
        log('message', message, suggestion, example);
      } else {
        next(exists);
      }
    } else {
      ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;
      if (ecosystems.length === 0) {
        message = 'You have not create any node ecosystem yet.';
        suggestion = 'Use create command to create first one!';
        example = 'nc create <id> [stable, latest, node-version]';
        log('message', message, suggestion, example);     
      } else {
        process.config.idLenStandard = findlongestID(config); 
        next(exists);
      }
    }
  });
};

exports.activateReady = function(next) {
  var globalConfigFile = process.config.globalConfigFile,
  globalActivateFile = process.config.globalActivateFile,
  pkgVer = process.config.version, installVer,
  pkgActivateFile = process.config.pkgActivateFile;

  path.exists(globalActivateFile, function(exists) {
    if (!exists) {
      fs.readFile(pkgActivateFile, 'utf8', function(err, data) {
        if (err) {throw err;}
        fs.writeFile(globalActivateFile, data, 'utf8', function(err) {
          if (err) {throw err;}
          next();
        });
      });
    } else {
      path.exists(globalConfigFile, function(exists) {
        if (!exists) {
          fs.readFile(pkgActivateFile, 'utf8', function(err, data) {
            if (err) {throw err;}
            fs.writeFile(globalActivateFile, data, 'utf8', function(err) {
              if (err) {throw err;}
              next();
            });
          });
        } else {
          installVer = JSON.parse(fs.readFileSync(globalConfigFile)).version;
          if (isBigger(pkgDir, installVer) > 0) {
            fs.readFile(pkgActivateFile, 'utf8', function(err, data) {
              if (err) {throw err;}
              fs.writeFile(globalActivateFile, data, 'utf8', function(err) {
                if (err) {throw err;}
                next();
              });
            });
          } else {
            next();
          }
        }
      });
    }
  });
};
