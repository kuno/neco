var os = require('os'),
log = require('../lib/display.js').log,
fs = require('fs'),
path = require('path'),
log  = require('./display.js').log,
notSmaller = require('./utils.js').compareVersions,
cleanGlobalConfig = require('./utils.js').cleanGloalConfig,
cleanEcosystemConfig = require('./utils.js').cleanEcosystemConfig;

exports.getRelease = function(target) {
  var dist, distFile, version, release;
  distFile = process.neco.config.distFile;
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

exports.getEcosystem = function(id) {
  var recordFile = process.neco.config.recordFile, ecosystem = null;
  var ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;

  ecosystems.forEach(function(e) {
    if (e.id === id) {
      ecosystem = e;
    }
  });

  return ecosystem;
};

exports.getDateTime = function() {
  var date = new Date(), time = date.getTime(),
      timeFormat = process.neco.config.timeFormat;
  if (timeFormat === 'GMT') {
    time = date.toGMTString(time);
  } else if (timeFormat === 'ISO') {
    tiime = date.toISOString(time);
  } else if (timeFormat === 'UTC') {
    time = date.toUTCString(time);
  } else if (timeFormat === 'date') {
    time = date.toDateString(time);
  } else {
    time = date.toTimeString(time);
  }

  return time;
};

exports.getSuitedNPM = function(release) {
  var minima, npm = null, 
  pkgDir = process.neco.config.pkgDir,
  dataFile = path.join(pkgDir, 'data/npm.json'),
  coulps = JSON.parse(fs.readFileSync(dataFile, 'utf8')).coulps;
  var target = release.version, len = coulps.length;

  for (var i = 0; i < len; ++i) {
    minima = coulps[i].node;
    if (notSmaller(target, minima) >= 0) {
      npm = coulps[i].npm;
      break;
    }
  }

  return npm;
};

exports.getNodeInstallScript = function() {
  var script = null, shellDir = process.neco.config.shellDir;
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

exports.getNPMInstallScript = function() {
  var shellDir = process.neco.config.shellDir,
  script = path.join(shellDir, 'install_npm.sh');

  return script;
};

exports.getActivateInstallScript = function() {
  var shellDir = process.neco.config.shellDir, 
  script = path.join(shellDir, 'install_activate.sh');

  return script;
};

exports.writeGlobalConfigFile = function(id, next) {
  var error,config = process.neco.config,  
  root = config.root, 
  cleannedConfig = cleanGlobalConfig(process.neco.globalConfig),
  configData = JSON.stringify(cleannedConfig),   
  globalConfigFile = path.join(root, '.neco', 'config.json');

  fs.writeFile(globalConfigFile, configData, 'utf8', function(err) {
    error = err;
    //process.config.id = id;
    next(error);
  });
};

exports.writeEcosystemConfigFile = function(id) {
  var root = process.neco.config.root, 
  cleannedConfig = cleanEcosystemConfig(process.neco.config),
  configData = JSON.stringify(cleannedConfig),   
  ecosystemConfigFile = path.join(root, '.neco', id, 'config.json');

  fs.writeFile(ecosystemConfigFile, configData, 'utf8', function(err) {
    if (err) {throw err;}
  });
};

exports.findlongestID = function() {
  var longest = 0, ecosystems, data,
  recordFile = process.neco.config.recordFile;
  data = JSON.parse(fs.readFileSync(recordFile, 'utf8'));

  data.ecosystems.forEach(function(e) {
    if (e.id.length > longest) {
      longest = e.id.length;
    }
  });

  return longest;
};  
