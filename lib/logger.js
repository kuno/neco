var color = require('ansi-color').set,
    msgHead = color('Message:\n', 'blue'), msgbody, 
    wrgHead = color('Warning:\n', 'yellow'), wrgBody, 
    errHead = color('Error:\n', 'red'), errBody, 
    expHead = color('For example:\n', 'cyan'), expBody,
    hlpHead = color('Type ', 'blue'), hlp = color('nc help ', 'magenta'), 
    hlpTail = color('for more details.', 'blue');

    exports.log = function(type, information, example, cmd) {
      if (type === 'message') {
        console.log(msgHead+color(information, 'green'));
      } else if (type === 'Warning') {
        console.log(wrgHead+color(information, 'green'));
      } else if (type === 'error') {
        console.log(errHead+color(information, 'green'));
      }

      if (example !== undefined) {
        console.log(expHead+color(example, 'magenta'));
      }

      if (cmd === undefined) {
        console.log(hlpHead+hlp+hlpTail);
      } else {
        console.log(hlpHead+hlp+color(cmd+' ', 'magenta')+hlpTail);
      }
};
