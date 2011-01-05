var util, color = require('ansi-color').set,
toMB = require('../lib/utils.js').toMB,
fillSpace = require('../lib/utils.js').fillSpace,
nodeVer = process.version.split('v')[1],
notSmaller = require('./utils.js').compareVersions,
msgHead = color('Neco Message:\n', 'blue'), msgbody, 
wrgHead = color('Neco Warning:\n', 'yellow'), wrgBody, 
errHead = color('Neco Error:\n', 'red'), errBody, 
sgtHead = color('Suggestion:\n', 'cyan'), stgBody,
expHead = color('Example:\n', 'cyan'), expBody,
hlpHead = color('Type ', 'blue'), hlp = color('neco help ', 'magenta'), 
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
      console.log(msgHead+'   '+color(information, 'green+bold'));
    } else if (type === 'warning') {
      console.log(wrgHead+'   '+color(information, 'green+bold'));
    } else if (type === 'error') {
      console.log(errHead+'   '+color(information, 'green+bold'));
    }

    console.log('');

    if (suggestion !== undefined) {
      console.log(sgtHead+'  '+color(suggestion, 'magenta+bold'));
      console.log('');
    }

    if (example !== undefined) {
      console.log(expHead+'  '+color(example, 'magenta+bold'));
      console.log('');
    }

    if (cmd === undefined) {
      console.log(hlpHead+hlp+hlpTail);
    } else {
      console.log(hlpHead+hlp+color(cmd+' ', 'magenta')+hlpTail);
    }
  }
};

exports.showEcosystems = function(ecosystems) {
  var len = ecosystems.length;
  var idHead = color('ID: ', 'green'), id,
  nvHead = color('Node: ', 'cyan'), nv,
  cdHead = color('Created: ', 'cyan'), cd,
  npmHead = color('NPM: ', 'cyan'), npm,
  delim = color(' | ', 'yellow');

  console.log(color('All ecosystems: '+len, 'bold'));
  ecosystems.forEach(function(e) {
    id = '[' + idHead + color(fillSpace('id', e.id), 'bold+yellow') + ']';
    nv = nvHead + color(e.nv, 'magenta');
    cd = cdHead + color(e.cd, 'magenta');
    npm = npmHead + color(e.npm, 'magenta');
    console.log(id+' '+nv+delim+cd+delim+npm+';');
  });
};

exports.showReleases = function(releases) {
  var len = releases.length;
  var verHead = color('Version: ', 'cyan'), version,
  linkHead = color('Link: ', 'cyan'), link,
  dateHead = color('Released Date: ', 'cyan'), date,
  sizeHead = color('Size: ', 'cyan'), size,
  delim = color(' | ', 'yellow');

  if (len > 1) {
    console.log(color('Available releases: '+len, 'yellow+bold'));
    releases.forEach(function(r) {
      version = verHead + color(fillSpace('version', r.version), 'magenta');
      link = linkHead + color(fillSpace('link', r.link), 'magenta');
      date = dateHead + color(r.released, 'magenta');
      size = sizeHead + color(toMB(fillSpace('size', r.size)), 'magenta');
      console.log(version+delim+link+delim+date+delim+size+';');
    });
  } else {
    version = verHead + color(releases[0].version, 'magenta');
    link = linkHead + color(releases[0].link, 'magenta');
    date = dateHead + color(releases[0].released, 'magenta');
    size = sizeHead + color(toMB(releases[0].size), 'magenta');
    console.log(version+delim+link+delim+date+delim+size+';');   
  }
};
