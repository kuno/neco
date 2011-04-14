var util   = require('util'),
    path   = require('path'),
    cmk    = require('consolemark');

var config, docFile;

exports.run = function(argv) {
  config = process.neco.config;
  if (argv.target === undefined) {
    docFile = path.join(config.pkgDocDir, 'howto.cmk');
    cmk.render(docFile, function(err, data) {
        if (err) {throw err;}
        util.print(data);
    });
  } else {
  }
};
