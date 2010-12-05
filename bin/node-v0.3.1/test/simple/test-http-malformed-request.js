common = require("../common");
assert = common.assert
net = require("net");
http = require("http");
url = require("url");

// Make sure no exceptions are thrown when receiving malformed HTTP
// requests.

nrequests_completed = 0;
nrequests_expected = 1;

var server = http.createServer(function (req, res) {
  console.log("req: " + JSON.stringify(url.parse(req.url)));

  res.writeHead(200, {"Content-Type": "text/plain"});
  res.write("Hello World");
  res.end();

  if (++nrequests_completed == nrequests_expected) server.close();
});
server.listen(common.PORT);

server.addListener("listening", function() {
  var c = net.createConnection(common.PORT);
  c.addListener("connect", function () {
    c.write("GET /hello?foo=%99bar HTTP/1.1\r\n\r\n");
    c.end();
  });

  // TODO add more!
});

process.addListener("exit", function () {
  assert.equal(nrequests_expected, nrequests_completed);
});
