common = require("../common");
assert = common.assert;
var readline = require("readline");

var key = {
  xterm: {
    home: [27, 91, 72],
    end: [27, 91, 70],
    metab: [27, 98],
    metaf: [27, 102],
    metad: [27, 100]
  },
  gnome: {
    home: [27, 79, 72],
    end: [27, 79, 70]
  },
  rxvt: {
    home: [27, 91, 55],
    end: [27, 91, 56]
  },
  putty: {
    home: [27, 91, 49, 126],
    end: [27, 91, 52, 126]
  }
};

var readlineFakeStream = function() {
  var written_bytes = [];
  var rl = readline.createInterface({
    fd: 1,
    write: function(b) {
      written_bytes.push(b);
    }}, function (text) {
      return [[], ""];
    });
  rl.written_bytes = written_bytes;
  return rl;
};

var rl = readlineFakeStream();
var written_bytes_length, refreshed;

rl.write('foo');
assert.equal(3, rl.cursor);
rl.write(key.xterm.home);
assert.equal(0, rl.cursor);
rl.write(key.xterm.end);
assert.equal(3, rl.cursor);
rl.write(key.rxvt.home);
assert.equal(0, rl.cursor);
rl.write(key.rxvt.end);
assert.equal(3, rl.cursor);
rl.write(key.gnome.home);
assert.equal(0, rl.cursor);
rl.write(key.gnome.end);
assert.equal(3, rl.cursor);
rl.write(key.putty.home);
assert.equal(0, rl.cursor);
rl.write(key.putty.end);
assert.equal(3, rl.cursor);

rl = readlineFakeStream();
rl.write('foo bar.hop/zoo');
rl.write(key.xterm.home);
written_bytes_length = rl.written_bytes.length;
rl.write(key.xterm.metaf);
assert.equal(3, rl.cursor);
refreshed = written_bytes_length !== rl.written_bytes.length;
assert.equal(true,  refreshed);
rl.write(key.xterm.metaf);
assert.equal(7, rl.cursor);
rl.write(key.xterm.metaf);
assert.equal(11, rl.cursor);
written_bytes_length = rl.written_bytes.length;
rl.write(key.xterm.metaf);
assert.equal(15, rl.cursor);
refreshed = written_bytes_length !== rl.written_bytes.length;
assert.equal(true,  refreshed);
written_bytes_length = rl.written_bytes.length;
rl.write(key.xterm.metab);
assert.equal(12, rl.cursor);
refreshed = written_bytes_length !== rl.written_bytes.length;
assert.equal(true,  refreshed);
rl.write(key.xterm.metab);
assert.equal(8, rl.cursor);
rl.write(key.xterm.metab);
assert.equal(4, rl.cursor);
written_bytes_length = rl.written_bytes.length;
rl.write(key.xterm.metab);
assert.equal(0, rl.cursor);
refreshed = written_bytes_length !== rl.written_bytes.length;
assert.equal(true,  refreshed);

rl = readlineFakeStream();
rl.write('foo bar.hop/zoo');
rl.write(key.xterm.home);
rl.write(key.xterm.metad);
assert.equal(0, rl.cursor);
assert.equal(' bar.hop/zoo', rl.line);
rl.write(key.xterm.metad);
assert.equal(0, rl.cursor);
assert.equal('.hop/zoo', rl.line);
rl.write(key.xterm.metad);
assert.equal(0, rl.cursor);
assert.equal('/zoo', rl.line);
rl.write(key.xterm.metad);
assert.equal(0, rl.cursor);
assert.equal('', rl.line);
