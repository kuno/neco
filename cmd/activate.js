var path = require('path');

exports.run = function(id) {
  var root = path.join(process.env.NECO_ROOT, '.neco', id, 'activate');
  console.log('run \"source '+root+'\" in your shell.'); 
};
