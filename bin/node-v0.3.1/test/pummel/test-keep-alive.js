// This test requires the program "ab"
common = require("../common");
assert = common.assert
http = require("http");
exec = require("child_process").exec;

body = "hello world\n";
server = http.createServer(function (req, res) {
  res.writeHead(200, {
    "Content-Length": body.length,
    "Content-Type": "text/plain"
  });
  res.write(body);
  res.end();
});

var keepAliveReqSec = 0;
var normalReqSec = 0;


function runAb(opts, callback) {
  var command = "ab " + opts + " http://127.0.0.1:" + common.PORT + "/";
  exec(command, function (err, stdout, stderr) {
    if (err) {
      if (stderr.indexOf("ab") >= 0) {
        console.log("ab not installed? skipping test.\n" + stderr);
        process.reallyExit(0);
      }
      return;
    }
    if (err) throw err;
    var matches = /Requests per second:\s*(\d+)\./mi.exec(stdout);
    var reqSec = parseInt(matches[1]);

    matches = /Keep-Alive requests:\s*(\d+)/mi.exec(stdout);
    var keepAliveRequests;
    if (matches) {
      keepAliveRequests = parseInt(matches[1]);
    } else {
      keepAliveRequests = 0;
    }

    callback(reqSec, keepAliveRequests);
  });
}

server.listen(common.PORT, function () {
  runAb("-k -c 100 -t 2", function (reqSec, keepAliveRequests) {
    keepAliveReqSec = reqSec;
    assert.equal(true, keepAliveRequests > 0);
    console.log("keep-alive: " + keepAliveReqSec + " req/sec");

    runAb("-c 100 -t 2", function (reqSec, keepAliveRequests) {
      normalReqSec = reqSec;
      assert.equal(0, keepAliveRequests);
      console.log("normal: " + normalReqSec + " req/sec");
      server.close();
    });
  });
});

process.addListener("exit", function () {
  assert.equal(true, normalReqSec > 50);
  assert.equal(true, keepAliveReqSec > 50);
  assert.equal(true, normalReqSec < keepAliveReqSec);
});
