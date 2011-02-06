var   log = require('./display.js').log,
exit = require('./exit.js').exit,
rollback = require('./rollback.js'),
EventEmitter = require('events').EventEmitter;

var handle = new EventEmitter;

handle.on('error', function(error) {
  var argv = process.neco.argv;
  log.emit('error', error);
  if (argv.cmd === 'create') {
    rollback.create();
  }

  exit.emit('fail');
});

exports.handle = handle;

