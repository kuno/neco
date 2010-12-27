var path = require('path');

exports.activate = function(id) {
  var root = path.join(process.env.NECO_ROOT, '.neco', id, 'activate');
  console.log('run \"source '+root+'\" in your shell.'); 
};
