var util, color = require('ansi-color').set,
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
  var idHead = color('ID:', 'cyan'), id,
  nvHead = color('Node: ', 'green'), nv,
  cdHead = color('Created: ', 'green'), cd,
  npmHead = color('NPM: ', 'green'), npm,
  delim = color(' | ', 'yellow');

  console.log(color('All ecosystems: '+len, 'bold'));
  ecosystems.forEach(function(e) {
    id = color('(', 'yellow') + idHead + color(e.id, 'bold+yellow') + color(')', 'yellow');
    nv = nvHead + color(e.nv, 'bold+magenta');
    cd = cdHead + color(e.cd, 'bold+magenta');
    npm = npmHead + color(e.npm, 'bold+magenta');
    console.log(id+' '+nv+delim+cd+delim+npm+' ;');
  });
};

exports.showReleases = function(releases) {
  var len = releases.length;
  var verHead = color('Version: ', 'cyan'), verBody,
  linkHead = color('Link: ', 'cyan'), linkBody,
  dateHead = color('Released Date: ', 'cyan'), dateBody,
  sizeHead = color('Size: ', 'cyan'), sizeBody,
  delim = color(' | ', 'yellow');

  if (len > 1) {
    console.log(color('Available releases: '+len, 'yellow+bold'));
  }
  releases.forEach(function(r) {
    verBody = color(r.version, 'magenta');
    linkBody = color(r.link, 'magenta');
    sizeBody = color((r.size/1024/1024).toFixed(2).toString()+'M', 'magenta');
    console.log(verHead+verBody+delim+linkHead+linkBody+delim+sizeHead+sizeBody);
  });
};
