common = require("../common");
assert = common.assert

var path = require('path'),
    fs = require('fs');
    
var file = path.join(common.tmpDir, "write.txt");

(function() {
  var stream = fs.WriteStream(file),
      _fs_close = fs.close;
      
  fs.close = function(fd) {
    assert.ok(fd, "fs.close must not be called without an undefined fd.")
    fs.close = _fs_close;
  }
  stream.destroy();
})();

(function() {
  var stream = fs.createWriteStream(file);
  
  stream.addListener('drain', function () {
    assert.fail('"drain" event must not be emitted before stream.write() has been called at least once.')
  });
  stream.destroy();
})();

