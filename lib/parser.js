var os = require('os'),
fs = require('fs'),
path = require('path'),
root = process.env.NECO_ROOT,
pkgDir = path.join(__dirname, '..'),
userConfigFile = path.join(process.env.HOME, '.neconfig'),
normalizeValue = require('./utils.js').normalizeValue;

exports.parseUserConfigFile = function(next) {
  var f = userConfigFile;
  var config = {}, content, key, value;

  path.exists(f, function(exists) {
    if (!exists) {
      next(config);
    } else {
      content = fs.readFileSync(f, 'utf8').trim().split('\n');
      content.forEach(function(c) {
        if (c.match(/\=/)) {
          key = c.split('=')[0].trim();
          value = normalizeValue(c.split('=')[1].trim());
          Object.defineProperty(config, key, {value:value, writable:true, enumerable:true, configurable:true});
        }
      });
      next(config);
    }
  });
};

exports.parseEcosystemConfigFile = function(id, next) {
  var f = path.join(root, '.neco', id, 'config');
  var config = {}, content, key, value;

  path.exists(f, function(exists) {
    if (!exists) {
      next(config);
    } else {
      content = fs.readFileSync(f, 'utf8').trim().split('\n');
      content.forEach(function(c) {
        if (c.match(/\=/)) {
          key = c.split('=')[0].trim();
          value = normalizeValue(c.split('=')[1].trim());
          Object.defineProperty(config, key, {value:value, writable:true, enumerable:true, configurable:true});
        }
      });
      next(config);
    }
  });  
};
