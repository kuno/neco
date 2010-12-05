common = require("../common");
assert = common.assert

// TODO Improved this test. test_ca.pem is too small. A proper test would
// great a large utf8 (with multibyte chars) file and stream it in,
// performing sanity checks throughout.

Buffer = require('buffer').Buffer;
path = require('path');
fs = require('fs');
fn = path.join(common.fixturesDir, 'elipses.txt');
rangeFile = path.join(common.fixturesDir, 'x.txt');

callbacks = { open: 0, end: 0, close: 0, destroy: 0 };

paused = false;

file = fs.ReadStream(fn);

file.addListener('open', function(fd) {
  file.length = 0;
  callbacks.open++;
  assert.equal('number', typeof fd);
  assert.ok(file.readable);
});


file.addListener('data', function(data) {
  assert.ok(data instanceof Buffer);
  assert.ok(!paused);
  file.length += data.length;

  paused = true;
  file.pause();
  assert.ok(file.paused);

  setTimeout(function() {
    paused = false;
    file.resume();
    assert.ok(!file.paused);
  }, 10);
});


file.addListener('end', function(chunk) {
  callbacks.end++;
});


file.addListener('close', function() {
  callbacks.close++;
  assert.ok(!file.readable);

  //assert.equal(fs.readFileSync(fn), fileContent);
});

var file2 = fs.createReadStream(fn);
file2.destroy(function(err) {
  assert.ok(!err);
  callbacks.destroy++;
});

var file3 = fs.createReadStream(fn, {encoding: 'utf8'});
file3.length = 0;
file3.addListener('data', function(data) {
  assert.equal("string", typeof(data));
  file3.length += data.length;

  for (var i = 0; i < data.length; i++) {
    // http://www.fileformat.info/info/unicode/char/2026/index.htm
    assert.equal("\u2026", data[i]);
  }
});

file3.addListener('close', function () {
  callbacks.close++;
});

process.addListener('exit', function() {
  assert.equal(1, callbacks.open);
  assert.equal(1, callbacks.end);
  assert.equal(1, callbacks.destroy);

  assert.equal(2, callbacks.close);

  assert.equal(30000, file.length);
  assert.equal(10000, file3.length);
});

var file4 = fs.createReadStream(rangeFile, {bufferSize: 1, start: 1, end: 2});
var contentRead = '';
file4.addListener('data', function(data) {
  contentRead += data.toString('utf-8');
});
file4.addListener('end', function(data) {
  assert.equal(contentRead, 'yz');
});

try {
  fs.createReadStream(rangeFile, {start: 10, end: 2});
  assert.fail('Creating a ReadStream with incorrect range limits must throw.');
} catch(e) {
  assert.equal(e.message, 'start must be <= end');
}

try {
  fs.createReadStream(rangeFile, {start: 2});
  assert.fail('Creating a ReadStream with a only one range limits must throw.');
} catch(e) {
  assert.equal(e.message, 'Both start and end are needed for range streaming.');
}

var stream = fs.createReadStream(rangeFile, { start: 0, end: 0 });
stream.data = '';

stream.on('data', function(chunk){
  stream.data += chunk;
});

stream.on('end', function(){
  assert.equal('x', stream.data);
});
