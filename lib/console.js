var color = require('ansi-color').set,
msgHead = color('Neco Message:\n', 'blue'), msgbody, 
wrgHead = color('Neco Warning:\n', 'yellow'), wrgBody, 
errHead = color('Neco Error:\n', 'red'), errBody, 
sgtHead = color('Suggestion:\n', 'cyan'), stgBody,
expHead = color('Example:\n', 'cyan'), expBody,
hlpHead = color('Type ', 'blue'), hlp = color('nc help ', 'magenta'), 
hlpTail = color('for more details.', 'blue');

exports.log = function(type, information, suggestion, example, cmd) {
  if (type === 'stdout') {
    console.log(''+information);
  } else {
    if (type === 'message') {
      console.log(msgHead+' '+color(information, 'green+bold'));
    } else if (type === 'Warning') {
      console.log(wrgHead+' '+color(information, 'green+bold'));
    } else if (type === 'error') {
      console.log(errHead+' '+color(information, 'green+bold'));
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

exports.display = function(ecosystems) {
  var len = ecosystems.length;
  var idHead = color('ID: ', 'cyan'), id,
  nvHead = color('Node: ', 'green'), nv,
  cdHead = color('Created: ', 'green'), cd,
  npmHead = color('NPM: ', 'green'), npm,
  delim = color(' | ', 'yellow');

  console.log(color('All ecosystems: '+len, 'bold'));
  ecosystems.forEach(function(e) {
    id = color('(', 'yellow') + idHead + color(e.id, 'bold+yellow') + color(')', 'yellow');
    console.log(id);
    nv = nvHead + color(e.nv, 'bold+magenta');
    cd = cdHead + color(e.cd, 'bold+magenta');
    npm = npmHead + color(e.npm, 'bold+magenta');
    console.log(nv+delim+cd+delim+npm+' ;');
    console.log('');
  });
};
