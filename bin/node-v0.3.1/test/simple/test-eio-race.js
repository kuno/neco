common = require("../common");
assert = common.assert

var count = 100;
var fs = require('fs');

function tryToKillEventLoop() {
  console.log('trying to kill event loop ...');

  fs.stat(__filename, function (err) {
    if (err) {
      throw new Exception('first fs.stat failed')
    } else {
      console.log('first fs.stat succeeded ...');
      fs.stat(__filename, function (err) {
        if (err) {
          throw new Exception('second fs.stat failed')
        } else {
          console.log('second fs.stat succeeded ...');
          console.log('could not kill event loop, retrying...');

          setTimeout(function () {
            if (--count) {
              tryToKillEventLoop();
            } else {
              process.exit(0);
            }
          }, 1);
        }
      });
    }
  });
}

// Generate a lot of thread pool events
var pos = 0;
fs.open('/dev/zero', "r", 0666, function (err, fd) {
  if (err) throw err;

  function readChunk () {
    fs.read(fd, 1024, pos, 'binary', function (err, chunk, bytesRead) {
      if (err) throw err;
      if (chunk) {
        pos += bytesRead;
        //console.log(pos);
        readChunk();
      } else {
        fs.closeSync(fd);
        throw new Exception('/dev/zero should not end before the issue shows up');
      }
    });
  }
  readChunk();
});

tryToKillEventLoop();

process.addListener("exit", function () {
  assert.ok(pos > 10000);
});
