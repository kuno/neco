common = require("../common");
assert = common.assert
net = require("net");
http = require("http");

// wget sends an HTTP/1.0 request with Connection: Keep-Alive
//
// Sending back a chunked response to an HTTP/1.0 client would be wrong,
// so what has to happen in this case is that the connection is closed
// by the server after the entity body if the Content-Length was not
// sent.
//
// If the Content-Length was sent, we can probably safely honor the
// keep-alive request, even though HTTP 1.0 doesn't say that the
// connection can be kept open.  Presumably any client sending this
// header knows that it is extending HTTP/1.0 and can handle the
// response.  We don't test that here however, just that if the
// content-length is not provided, that the connection is in fact
// closed.

var server_response = "";
var client_got_eof = false;
var connection_was_closed = false;

var server = http.createServer(function (req, res) {
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.write("hello ");
  res.write("world\n");
  res.end();
});
server.listen(common.PORT);

server.addListener("listening", function() {
  var c = net.createConnection(common.PORT);

  c.setEncoding("utf8");

  c.addListener("connect", function () {
    c.write("GET / HTTP/1.0\r\n" +
            "Connection: Keep-Alive\r\n\r\n");
  });

  c.addListener("data", function (chunk) {
    console.log(chunk);
    server_response += chunk;
  });

  c.addListener("end", function () {
    client_got_eof = true;
    console.log('got end');
    c.end();
  });

  c.addListener("close", function () {
    connection_was_closed = true;
    console.log('got close');
    server.close();
  });
});

process.addListener("exit", function () {
  var m = server_response.split("\r\n\r\n");
  assert.equal(m[1], "hello world\n");
  assert.ok(client_got_eof);
  assert.ok(connection_was_closed);
});
