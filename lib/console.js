var color = require('ansi-color').set,
msgHead = color('Neco Message: ', 'blue'), msgbody, 
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
      console.log(msgHead+color(information, 'green'));
    } else if (type === 'Warning') {
      console.log(wrgHead+color(information, 'green'));
    } else if (type === 'error') {
      console.log(errHead+color(information, 'green'));
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

exports.display = function() {
};
