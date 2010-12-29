var path = require('path'),
    color = require('ansi-color').set;

exports.run = function(id) {
  var root = path.join(process.env.NECO_ROOT, '.neco', id, 'activate');
  var shell = color('source '+root, 'bold+yellow');
  console.log('run \''+shell+'\'in your shell.'); 
};
