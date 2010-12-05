common = require("../common");
assert = common.assert

var fs = require("fs");
var path = require("path");

var f = path.join(common.fixturesDir, "x.txt");
var f2 = path.join(common.fixturesDir, "x2.txt");

console.log("watching for changes of " + f);

var changes = 0;
function watchFile () {
  fs.watchFile(f, function (curr, prev) {
    console.log(f + " change");
    changes++;
    assert.ok(curr.mtime != prev.mtime);
    fs.unwatchFile(f);
    watchFile();
    fs.unwatchFile(f);
  });
}

watchFile();


var fd = fs.openSync(f, "w+");
fs.writeSync(fd, 'xyz\n');
fs.closeSync(fd);

process.addListener("exit", function () {
  assert.ok(changes > 0);
});
