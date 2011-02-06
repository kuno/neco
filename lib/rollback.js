var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn,
log = require('./display.js').log,
rollback, error, message;

exports.create = function() {
  var config = process.neco.config, root = config.root, 
  argv = process.neco.argv, id = argv.id,
  ecosystem = path.join(root, '.neco', id);

  path.exist(ecosystem, function(exist) {
    if (exist) {
      message = 'Start to rollback';
      log.emit('message', message);
      rollback = spawn('rm', ['-rf', ecosystem]);
      rollback.on('exit', function(code) {
        if (code === 0) {
          error = new Error('rollback exit with code '+code);
          log.emit('error', error);
        }
      });
    }
  });
};
