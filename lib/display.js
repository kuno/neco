var util, color = require('ansi-color').set,
toMB = require('../lib/utils.js').toMB,
fillSpace = require('../lib/utils.js').fillSpace,
nodeVer = process.version.split('v')[1],
notSmaller = require('./utils.js').compareVersions,
msgHead = color('[Neco Message]:\n', 'green+bold'), msgbody, 
wrgHead = color('[Neco Warning]:\n', 'yellow+bold'), wrgBody, 
errHead = color('[Neco Error]:\n', 'red+bold'), errBody, 
sgtHead = color('[Suggestion]:\n', 'cyan+bold'), stgBody,
expHead = color('Example:\n', 'cyan+bold'), expBody,
hlpHead = color('Type ', 'blue'), hlp = color('neco howto ', 'magenta'), 
hlpTail = color('for more details.', 'blue');

if (notSmaller('0.3.0', nodeVer) >= 0) {
  util = require('util');
} else {
  util = require('sys');
}

exports.log = function(type, information, suggestion, example, cmd) {
  if (type === 'stdout') {
    util.print(''+information);
  } else {
    if (type === 'message') {
      console.log(msgHead+'   '+color(information, 'blue'));
    } else if (type === 'warning') {
      console.log(wrgHead+'   '+color(information, 'green'));
    } else if (type === 'error') {
      console.log(errHead+'   '+color(information, 'green'));
    }

    console.log('');

    if (suggestion !== undefined) {
      console.log(sgtHead+'  '+color(suggestion, 'magenta'));
      console.log('');
    }

    if (example !== undefined) {
      console.log(expHead+'  '+color(example, 'magenta'));
      console.log('');
    }

    if (cmd === undefined) {
      console.log(hlpHead+hlp+hlpTail);
    } else {
      console.log(hlpHead+hlp+color(cmd+' ', 'magenta')+hlpTail);
    }
  }
};

exports.showEcosystems = function(config) {
  var standard = config.idLenStandard, ecosystem;
  var len = config.ecosystems.length;
  var idHead = color('ID: ', 'green'), id,
  nvHead = color('Node: ', 'cyan'), nv,
  cdHead = color('Created: ', 'cyan'), cd,
  npmHead = color('NPM: ', 'cyan'), npm,
  delim = color(' | ', 'yellow');

  if (len > 1) {
    console.log(color('All ecosystems: '+len, 'bold'));
    config.ecosystems.forEach(function(e) {
      id = color('[', 'yellow') + idHead + color(fillSpace('id', e.id, standard), 'bold+yellow') + color('] ', 'yellow');
      nv = nvHead + color(e.nv, 'magenta');
      cd = cdHead + color(e.cd, 'magenta');
      npm = npmHead + color(e.npm, 'magenta');
      console.log(id+nv+delim+cd+delim+npm+';');
    });
  } else {
    ecosystem = config.ecosystems[0];
    id = color('[', 'yellow') + idHead + color(ecosystem.id, 'yellow+bold') + color('] ', 'yellow');
    nv = nvHead + color(ecosystem.nv, 'magenta');
    cd = cdHead + color(ecosystem.cd, 'magenta');
    npm = npmHead + color(ecosystem.npm, 'magenta');
    console.log(id+nv+delim+cd+delim+npm+';');
  }
};

exports.showReleases = function(config) {
  var len = config.releases.length, release;
  var verHead = color('Version: ', 'cyan'), version,
  linkHead = color('Link: ', 'cyan'), link,
  dateHead = color('Released: ', 'cyan'), date,
  sizeHead = color('Size: ', 'cyan'), size,
  delim = color(' | ', 'yellow');

  if (len > 1) {
    console.log(color('Available releases: '+len, 'bold'));
    config.releases.forEach(function(r) {
      version = verHead + color(fillSpace('version', r.version), 'magenta');
      link = linkHead + color(fillSpace('link', r.link), 'magenta');
      date = dateHead + color(r.released, 'magenta');
      size = sizeHead + color(toMB(fillSpace('size', r.size)), 'magenta');
      console.log(version+delim+link+delim+date+delim+size+';');
    });
  } else {
    release = config.releases[0];
    version = verHead + color(release.version, 'magenta');
    link = linkHead + color(release.link, 'magenta');
    date = dateHead + color(release.released, 'magenta');
    size = sizeHead + color(toMB(release.size), 'magenta');
    console.log(version+delim+link+delim+date+delim+size+';');   
  }
};
