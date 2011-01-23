require.paths.shift('../deps');

var util, color = require('ansi-color').set,
EventEmitter = require('events').EventEmitter,
toMB = require('../lib/utils.js').toMB,
fillSpace = require('../lib/utils.js').fillSpace,
nodeVer = process.version.split('v')[1],
notSmaller = require('./utils.js').compareVersions,
leftParentheses = color('[', 'yellow'),
rightParentheses = color(']:\n', 'yellow'),
msgHead = leftParentheses+color('Neco Message', 'green+bold')+rightParentheses, msgbody, 
wrgHead = leftParentheses+color('Neco Warning', 'yellow+bold')+rightParentheses, wrgBody, 
errHead = leftParentheses+color('Neco Error', 'red+bold')+rightParentheses, errBody, 
sgtHead = leftParentheses+color('Suggestion', 'cyan')+rightParentheses, stgBody,
expHead = leftParentheses+color('Examples', 'cyan')+rightParentheses, expBody,
hlpHead = color('Type ', 'blue'), hlp = color('neco howto ', 'magenta'), 
hlpTail = color('for more details.', 'blue');

if (notSmaller('0.3.0', nodeVer) >= 0) {
  util = require('util');
} else {
  util = require('sys');
}

function _logMessage(information, suggestion, example, cmd) {
  console.log(msgHead+'   '+color(information, 'magenta'));

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

function _logStdout(information) {
  util.print(''+information);
}

function _logWarning(information, suggestion, example, cmd) {
  console.log(wrgHead+'   '+color(information, 'magenta'));

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

function _logError (error) {
  var stack = error.stack;
  errBody = stack;
  sgtBody = 'Report all these information to ' + issues;

  console.log(errHead+errBody);

  console.log('');
  console.log(sgtHead+'  '+color(suggestion, 'magenta'));


}

var log = new EventEmitter;
log.on('message', _logMessage);
log.on('warning', _logWarning);
log.on('stdout', _logStdout);
log.on('error', _logError);

exports.log = log;
/*
exports.log = function(type, information, suggestion, example, cmd) {
  if (type === 'stdout') {
    util.print(''+information);
  } else {
    if (type === 'message') {
      console.log(msgHead+'   '+color(information, 'magenta'));
    } else if (type === 'warning') {
      console.log(wrgHead+'   '+color(information, 'magenta'));
    } else if (type === 'error') {
      console.log(errHead+'   '+color(information, 'magenta'));
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
};*/

function _showEcosystems (ecosystems) {
  var ecosystem, config = process.neco.config,
  len = ecosystems.length, standard = config.idLenStandard,  
  idHead = color('ID: ', 'green'), id,
  nvHead = color('Node: ', 'cyan'), nv,
  cdHead = color('Created: ', 'cyan'), cd,
  npmHead = color('NPM: ', 'cyan'), npm,
  delim = color(' | ', 'yellow');

  if (len > 1) {
    console.log(color('All ecosystems: '+len, 'bold'));
    ecosystems.forEach(function(e) {
      id = color('[', 'yellow') + idHead + color(fillSpace('id', e.id, standard), 'bold+yellow') + color('] ', 'yellow');
      nv = nvHead + color(e.nv, 'magenta');
      cd = cdHead + color(e.cd, 'magenta');
      npm = npmHead + color(fillSpace('npm', e.npm), 'magenta');
      console.log(id+nv+delim+npm+delim+cd+';');
    });
  } else {
    ecosystem = ecosystems[0];
    id = color('[', 'yellow') + idHead + color(ecosystem.id, 'yellow+bold') + color('] ', 'yellow');
    nv = nvHead + color(ecosystem.nv, 'magenta');
    cd = cdHead + color(ecosystem.cd, 'magenta');
    npm = npmHead + color(ecosystem.npm, 'magenta');
    console.log(id+nv+delim+npm+delim+cd+';');
  }
}

function _showReleases(releases) {
  var len = releases.length, release;
  var verHead = color('Version: ', 'cyan'), version,
  linkHead = color('Link: ', 'cyan'), link,
  dateHead = color('Released: ', 'cyan'), date,
  sizeHead = color('Size: ', 'cyan'), size,
  delim = color(' | ', 'yellow');

  if (len > 1) {
    console.log(color('Available releases: '+len, 'bold'));
    releases.forEach(function(r) {
      version = verHead + color(fillSpace('version', r.version), 'magenta');
      link = linkHead + color(fillSpace('link', r.link), 'magenta');
      date = dateHead + color(r.released, 'magenta');
      size = sizeHead + color(toMB(fillSpace('size', r.size)), 'magenta');
      console.log(version+delim+date+delim+link+delim+size+';');
    });
  } else {
    release = releases[0];
    version = verHead + color(release.version, 'magenta');
    link = linkHead + color(release.link, 'magenta');
    date = dateHead + color(release.released, 'magenta');
    size = sizeHead + color(toMB(release.size), 'magenta');
    console.log(version+delim+date+delim+link+delim+size+';');   
  }
}

var show = new EventEmitter;
show.on('ecosystems', _showEcosystems);
show.on('releases', _showReleases);

exports.show = show;
