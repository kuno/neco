var fs            = require('fs'),
    path          = require('path'),
    spawn         = require('child_process').spawn,
    log           = require('./display.js').log,
    copyFile      = require('./utils.js').copyFile,
    isBigger      = require('./utils.js').compareVersions,
    tools         = require('../include/meta.js').tools,
    findlongestID = require('./assistant.js').findlongestID; 

var parseArgv            = require('../lib/parser.js').parseArgv;
 
var root              = process.env.NECO_ROOT,
    pkgDir            = path.join(__dirname, '..'),
    ecosystem         = process.env.NODE_ECOSYSTEM,
    recordFile        = path.join(root, '.neco/record.json'),
    pkgDistFile       = path.join(pkgDir, 'share/data/dist.json'),
    pkgConfigFile     = path.join(pkgDir, 'include/config.json'),
    pkgActivateFile   = path.join(pkgDir, 'share/shell/activate.sh'),
    localDistFile     = path.join(root, '.neco/dist.json'),
    localConfigFile   = path.join(root, '.neco/config.json'),
    localActivateFile = path.join(root, '.neco', 'activate.sh');

var message, warning, error, suggestion, example;

exports.toolReady = function(next) {
  var check;

  tools.forEach(function(t) {
      check = spawn(t, ['--version', '2>&1']);
      check.on('exit', function(code) {
          if (code !== 0) {
            err = new Error('Missing tool: '+t);
            log.emit('error', err);
          }
      });
  });

  next();
};

exports.envReady = function(cmd, next) {
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
  var workDir = path.join(root, '.neco');
  path.exists(workDir, function(exists) {
      if (!exists) {
        fs.mkdir(workDir, mode=0777, function(err) {
            if (err) {throw err;}
            next();
        });
      } else {
        next();
      }
  });
};

exports.recordReady = function(cmd, next) {
  var record, ecosystems;
  path.exists(recordFile, function(exists) {
      if (!exists) {
        if (cmd !== 'create') {
          message = 'You have not create any node ecosystem yet.';
          suggestion = 'Use create command to create first one!';
          example = 'nc create <id> [stable, unstable, version]';
          log.emit('message', message, suggestion, example);
        } else {
          next(exists);
        }
      } else {
        record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
        if ((!record || record.ecosystems.length === 0) && cmd !== 'create') {
          message = 'You have not create any node ecosystem yet.';
          suggestion = 'Use create command to create first one!';
          example = 'nc create <id> [stable, latest, node-version]';
          log.emit('message', message, suggestion, example);     
        } else {
          // Set the longest length of id for display
          process.neco.config.idLenStandard = findlongestID();  
          next(exists);
        }
      }
  });
};

exports.configReady = function(next) {
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

exports.upgradeReady = function(next) {
  var pkgVer, localVer;
  path.exists(localConfigFile, function(exists) {
      if (!exists) {
        copyFile(pkgConfigFile, localConfigFile);
        copyFile(pkgActivateFile, localActivateFile);
        copyFile(pkgDistFile, localDistFile);
      } else {
        pkgVer = JSON.parse(fs.readFileSync(pkgConfigFile,'utf8')).version;
        localVer = JSON.parse(fs.readFileSync(localConfigFile,'utf8')).version;

        if (isBigger(pkgVer, localVer) > 0) {
          copyFile(pkgConfigFile, localConfigFile);
          copyFile(pkgActivateFile, localActivateFile);
          copyFile(pkgDistFile, localDistFile);
        }
      }

      next();
  });
};

exports.argvReady = function(next) {
  parseArgv();
  next();
}
