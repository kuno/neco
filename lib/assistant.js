var os = require('os'),
log = require('../lib/display.js').log,
fs = require('fs'),
path = require('path'),
log  = require('./display.js').log,
notSmaller = require('./utils.js').compareVersions,
cleanGlobalConfig = require('./utils.js').cleanGloalConfig,
cleanEcosystemConfig = require('./utils.js').cleanEcosystemConfig;

exports.getRelease = function(config) {
  var dist, distFile, version, release, target;
  target = config.target;
  distFile = config.distFile;
  dist = JSON.parse(fs.readFileSync(distFile, 'utf8'));

  if (!dist) {
    console.log('err');
  } else {
    if (target === 'stable') {
      version = dist.stable;
    } else if (target === 'latest') {
      version = dist.latest;
    } else {
      version = target;
    }

    dist.history.forEach(function(r) {
      if (r.version === version) {
        release = r;
      }
    });
  }

  if (release) {
    return release;
  } else {
    return null;
  }
};

exports.getEcosystem = function(config) {
  var id = config.id, ecosystem = null;
  var ecosystems = JSON.parse(fs.readFileSync(config.recordFile, 'utf8')).ecosystems;

  ecosystems.forEach(function(e) {
    if (e.id === id) {
      ecosystem = e;
    }
  });

  return ecosystem;
};

exports.getDateTime = function(config) {
  var date = new Date(), time = date.getTime();
  if (config.timeFormat === 'GMT') {
    time = date.toGMTString(time);
  } else if (config.timeFormat === 'ISO') {
    tiime = date.toISOString(time);
  } else if (config.timeFormat === 'UTC') {
    time = date.toUTCString(time);
  } else if (config.timeFormat === 'date') {
    time = date.toDateString(time);
  } else {
    time = date.toTimeString(time);
  }

  return time;
};

exports.getSuitedNPM = function(config) {
  var len, minima, npm = null;
  var target = config.release.version;

  var dataFile = path.join(config.pkgDir, 'data/npm.json');
  var coulps = JSON.parse(fs.readFileSync(dataFile, 'utf8')).coulps;
  len = coulps.length;

  for (var i = 0; i < len; ++i) {
    minima = coulps[i].node;
    if (notSmaller(target, minima) >= 0) {
      npm = coulps[i].npm;
      break;
    }
  }

  return npm;
};

exports.getNodeInstallScript = function(config) {
  var script = null, shellDir = config.shellDir;
  var type = os.type(), release = os.release();

  if (os.isWindows) {
  } else {
    switch (type)
    {
      case 'Linux':
      if (release.match(/arch|ARCH/)) {
        script = path.join(shellDir, 'install_node/linux/arch.sh');
      } else {
        script = path.join(shellDir, 'install_node/linux/default.sh');
      }
      break;

      case 'Darwin':
      script = path.join(shellDir, 'install_node/darwin/default.sh');
      break;

      default:
      script = path.join(shellDir, 'install_node/default.sh');
      break;
    }
  }

  return script;
};

exports.getNPMInstallScript = function(config) {
  var shellDir = config.shellDir,
  script = path.join(shellDir, 'install_npm.sh');

  return script;
};

exports.getActivateInstallScript = function(config) {
  var shellDir = config.shellDir, 
  script = path.join(shellDir, 'install_activate.sh');

  return script;
};

exports.writeGlobalConfigFile = function(config, next) {
  var error, root = config.root, id = config.id, 
  cleannedConfig = cleanGlobalConfig(config),
  configData = JSON.stringify(cleannedConfig),   
  globalConfigFile = path.join(root, '.neco', 'config.json');

  fs.writeFile(globalConfigFile, configData, 'utf8', function(err) {
    error = err;
    config.id = id;
    next(error, config);
  });
};

exports.writeEcosystemConfigFile = function(config) {
  var root = config.root, id = config.id, 
  cleannedConfig = cleanEcosystemConfig(config),
  configData = JSON.stringify(cleannedConfig),   
  ecosystemConfigFile = path.join(root, '.neco', id, 'config.json');

  fs.writeFile(ecosystemConfigFile, configData, 'utf8', function(err) {
    if (err) {throw err;}
  });
};

exports.findlongestID = function(config) {
  var longest = 0, ecosystems, data,
  recordFile = config.recordFile;
  data = JSON.parse(fs.readFileSync(recordFile, 'utf8'));

  data.ecosystems.forEach(function(e) {
    if (e.id.length > longest) {
      longest = e.id.length;
    }
  });

  return longest;
};  
