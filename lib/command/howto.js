var util   = require('util'),
    path   = require('path'),
    cmk    = require('consolemark');

var getConfig = require('../assistant.js').getConfig;

var config  = getConfig(), docFile;

exports.run = function(argv) {
  if (argv.target === undefined) {
    docFile = path.join(config.pkgDocDir, 'howto.cmk');
    cmk.render(docFile, function(err, data) {
        if (err) {throw err;}
        util.print(data);
    });
  } else {
  }
};
