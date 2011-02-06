var os               = require('os'),
fs                   = require('fs'),
path                 = require('path'),
log                  = require('./display.js').log,
notSmaller           = require('./utils.js').compareVersions,
npmCouples           = require('../include/meta.js').npmCouples,
cleanLocalConfig     = require('./utils.js').cleanGloalConfig,
cleanEcosystemConfig = require('./utils.js').cleanEcosystemConfig;

exports.getRelease = function(target) {
  var config = process.neco.config,
  version, release, distFile = config.localDistFile,
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
  var config = process.neco.config, 
  recordFile = config.recordFile, ecosystem = null,
  ecosystems = JSON.parse(fs.readFileSync(recordFile, 'utf8')).ecosystems;

  ecosystems.forEach(function(e) {
    if (e.id === id) {
      ecosystem = e;
    }
  });

  return ecosystem;
};

exports.getDateTime = function() {
  var config = process.neco.config, 
  date = new Date(), time = date.getTime(),
  timeFormat = config.timeFormat;

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
  var config = process.neco.config, minima, npm = null,
  target = release.version, len = npmCoulps.length, i;

  for (i = 0; i < len; ++i) {
    minima = npmCoulps[i].node;
    if (notSmaller(target, minima) >= 0) {
      npm = npmCoulps[i].npm;
      break;
    }
  }

  return npm;
};

exports.getNodeInstallScript = function() {
  var script = null, shellDir = process.neco.config.pkgShellDir;
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
  var shellDir = process.neco.config.pkgShellDir,
  script = path.join(shellDir, 'install_npm.sh');

  return script;
};

exports.getActivateInstallScript = function() {
  var shellDir = process.neco.config.pkgShellDir, 
  script = path.join(shellDir, 'install_activate.sh');

  return script;
};

exports.writeLocalConfigFile = function(id, next) {
  var config = process.neco.config, 
  globalConfig = process.neco.globalConfig,
  root = config.root,localConfigFile = config.localConfigFile,
  cleannedConfig = cleanLocalConfig(globalConfig),
  configData = JSON.stringify(cleannedConfig);   

  fs.writeFile(localConfigFile, configData, 'utf8', function(err) {
    next(err, id);
  });
};

exports.writeEcosystemConfigFile = function(argv, next) {
  var config = process.neco.config,
  configData, root = config.root, ecosystemConfigFile;

  if (process.neco.ecosystemConfig) {
    cleannedConfig = cleanEcosystemConfig(process.neco.ecosystemConfig);
  } else {
    cleannedConfig = cleanEcosystemConfig(process.neco.globalConfig);
  }

  //cleannedConfig.id = id;
  configData = JSON.stringify(cleannedConfig);   
  ecosystemConfigFile = path.join(root, '.neco', argv.id, 'config.json');

  fs.writeFile(ecosystemConfigFile, configData, 'utf8', function(err) {
    next(err);
  });
};

exports.findlongestID = function() {
  var config = process.neco.config,longest = 0, 
  ecosystems, data, recordFile = config.recordFile;
  data = JSON.parse(fs.readFileSync(recordFile, 'utf8'));

  data.ecosystems.forEach(function(e) {
    if (e.id.length > longest) {
      longest = e.id.length;
    }
  });

  return longest;
};  
