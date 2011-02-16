var os                   = require('os'),
fs                       = require('fs'),
path                     = require('path'),
log                      = require('./display.js').log,
idLenStandard            = require('../include/meta.js').idLenStandard,
verLenStandard           = require('../include/meta.js').verLenStandard,
linkLenStandard          = require('../include/meta.js').linkLenStandard,
sizeLenStandard          = require('../include/meta.js').sizeLenStandard,
npmVerLenStandard        = require('../include/meta.js').npmVerLenStandard,
spareGlobalProperties    = require('../include/meta.js').sgps,
spareEcosystemProperties = require('../include/meta.js').seps,
site                     = require('../include/meta.js').site;

var message, warning, error, suggestion, example;

exports.compareVersions = function(versionA, versionB) {
  var notSmaller, arrayA = versionA.split('-'), arrayB = versionB.split('-'), 
  minorA, minorB, mainA = arrayA[0].split('.'), mainB = arrayB[0].split('.'), 
  len = (mainA.length <= mainB.length) ? mainA.length : mainB.length;

  for (var i = 0; i < len; ++i) {
    if (parseInt(mainA[i], 10) < parseInt(mainB[i], 10)) {
      notSmaller = -1;
      break;
    } else if (parseInt(mainA[i], 10) > parseInt(mainB[i], 10)) {
      notSmaller = 1;
      break;
    } else if (i === len - 1) {
      if (mainA.length > mainB.length) {
        notSmaller = 1;
      } else if (mainA.length === mainB.length) {
        if (arrayA.length === arrayB.length === 1) {
          notSmaller = 0;
        } else if (arrayA.length > arrayB.length) {
          notSmaller = 1;
        } else if (arrayA.length < arrayA.length) {
          notSmaller = -1;
        } else {
          minorA = arrayA.reverse()[0].replace(/[a-zA-Z]+/,'');
          minorB = arrayB.reverse()[0].replace(/[a-zA-Z]+/,'');
          if (minorA.length !== minorB.length) {
            notSmaller = ((minorA.length - minorB.length) > 0) ? 1 : -1; 
          } else if  (parseInt(minorA, 10) === parseInt(minorB, 10)) {
            notSmaller = 0;
          } else if (parseInt(minorA, 10) > parseInt(minorB, 10)) {
            notSmaller = 1;
          } else if (parseInt(minorA, 10) < parseInt(minorB, 10)) {
            notSmaller = -1;
          }
        }
      } else {
        notSmaller = -1;
      }
    }
  }

  return notSmaller;    
};

exports.normalizeValue = function(value) {
  var normalValue;

  if (value === 'true') {
    normalValue = true;
  } else if (value === 'false') {
    normalValue = false;
  } else if (!value.match(/[a-z][A-Z]/)) {
    normalValue = parseInt(value, 10);
  } else {
    normalValue = value;
  }

  return normalValue;
};

exports.toMB = function(size) {
  return ((parseInt(size, 10)/1024/1024).toFixed(2).toString()+'MB');
};

exports.fillSpace = function(type, string, length) {
  var i, gap, standard;

  if (type === 'id') {
    standard = length || idLenStandard;
  } else if (type === 'version') {
    standard = length || verLenStandard;
  } else if (type === 'link') {
    standard = length || linkLenStandard;
  } else if (type === 'size') {
    standard = length || sizeLenStandard;
  } else if (type === 'npm') {
    standard = length || npmVerLenStandard;
  } else {
    standard = 18;
  }

  if (string.length < standard) {
    gap = standard - string.length;
    for (i = 0; i < gap; ++i) {
      string += (' ');
    }
  }

  return string;
};

exports.cleanGloalConfig = function(config) {
  spareGlobalProperties.forEach(function(p) {
    delete config[p];
  });

  return config;
};

exports.cleanEcosystemConfig = function(config) {
  spareEcosystemProperties.forEach(function(p) {
    delete config[p];
  });

  return config;
};

exports.removeEcosystem = function(ecosystems, id) {
  var newEcosystems = [];
  ecosystems.forEach(function(e) {
    if (e.id !== id) {
      newEcosystems = newEcosystems.concat(e);
    }
  });

  return newEcosystems;
};

exports.copyFile = function(source, dest) {
  fs.readFile(source, 'utf8', function(err, data) {
    if (err) {throw err;}
    fs.writeFile(dest, data, 'utf8', function(err) {
      if (err) {throw err;}
    });
  });
};

exports.parseLink = function(links) {
  var history = [], release, parts, archive,
  version, link, released, size;

  links.forEach(function(l) {
    if (l.length > 20) {
      release = [];
      parts = l.split('   ');
      parts.forEach(function(p) {
        if (/[A-Za-z0-9]/.test(p)) {
          release.push(p);
        }
      });
      //console.log(parts);
      if (release.length === 3) {
        archive = release[0].substring(release[0].indexOf('="')+2, release[0].indexOf('">'));
        link = site.concat('dist/', archive);
        version = archive.substring(archive.indexOf('-') + 1, archive.indexOf('.tar.gz'));
        // Filter the leading 'v';
        version = version[0] === 'v' ? version.substring(1, version.length) : version;
        released = release[1].trim();
        size = parseInt(release[2].trim(), 10);
        history.push({version:version,link:link,released:released,size:size});
      }
    }
  });

  return history;
};

exports.parseVersions = function(history) {
  var dist = {}, latest = history[history.length - 1].version.split('.'),
  unstableMain, unstableMinor = 0, main, minor = 0, release;

  if (latest[1] % 2 === 0) {
    dist.stable = history[history.length - 1].version;
    unstableMain = parseInt(latest[1], 10) - 1;
    history.forEach(function(r) {
      // Latest version, maybe abondaont in the future
      if (r.version === 'latest') {
        dist.latest = history[history.indexOf(r)].version;
      } else {
        release = r.version.split('.');
        if (parseInt(release[1], 10) === unstableMain) {
          minor = parseInt(release[release.length - 1], 10);
          if (minor > unstableMinor) {
            unstableMinor = minor;
          }
        }
      }
    });
    // Only fit with 0.X.X, probably need change with time
    dist.unstable = latest[0].toString() + '.' + unstableMain.toString() + '.' + unstableMinor.toString();
  } else {
    distData.unstable = latest.version;
    history.forEach(function(r) {
      // Latest version, maybe abondaont in the future
      if (r.version === 'latest') {
        dist.latest = history[history.indexOf(r)].version;
      } else {
        if (r.version.split('.')[1] === (latest.version.split('.')[1]) &&
        r.version.charAt(r.version.length - 1) === 0) {
          dist.stable = history[history.indexOf(r) - 1].version;
        }
      }
    });
  }

  dist.history = history;
  dist.releases = history.length;

  return dist;
};
