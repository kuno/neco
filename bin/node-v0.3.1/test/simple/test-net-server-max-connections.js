common = require("../common");
assert = common.assert;
net = require('net');

// This test creates 200 connections to a server and sets the server's
// maxConnections property to 100. The first 100 connections make it through
// and the last 100 connections are rejected.
// TODO: test that the server can accept more connections after it reaches
// its maximum and some are closed.

N = 200;
count = 0;
closes = 0;
waits = [];

server = net.createServer(function (connection) {
  console.error("connect %d", count++);
  connection.write("hello");
  waits.push(function () { connection.end(); });
});

server.listen(common.PORT, function () {
  for (var i = 0; i < N; i++) {
    makeConnection(i);
  }
});

server.maxConnections = N/2;

console.error("server.maxConnections = %d", server.maxConnections);


function makeConnection (index) {
  setTimeout(function () {
    var c = net.createConnection(common.PORT);
    var gotData = false;

    c.on('end', function () { c.end(); });

    c.on('data', function (b) {
      gotData = true;
      assert.ok(0 < b.length);
    });

    c.on('error', function (e) {
      console.error("error %d: %s", index, e);
    });

    c.on('close', function () {
      console.error("closed %d", index);
      closes++;

      if (closes < N/2) {
        assert.ok(server.maxConnections <= index, 
            index + " was one of the first closed connections but shouldnt have been");
      }

      if (closes === N/2) {
        var cb;
        console.error("calling wait callback.");
        while (cb = waits.shift()) {
          cb();
        }
        server.close();
      }

      if (index < server.maxConnections) {
        assert.equal(true, gotData, index + " didn't get data, but should have");
      } else {
        assert.equal(false, gotData, index + " got data, but shouldn't have");
      }
    });
  }, index);
}


process.on('exit', function () {
  assert.equal(N, closes);
});
