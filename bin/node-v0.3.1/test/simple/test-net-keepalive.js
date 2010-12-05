common = require("../common");
assert = common.assert
net = require('net');

var serverConnection;
var echoServer = net.createServer(function (connection) {
  serverConnection = connection;
  connection.setTimeout(0);
  assert.notEqual(connection.setKeepAlive,undefined);
  // send a keepalive packet after 1000 ms
  connection.setKeepAlive(true,1000);
  connection.addListener("end", function () {
    connection.end();
  });
});
echoServer.listen(common.PORT);

echoServer.addListener("listening", function() {
  var clientConnection = net.createConnection(common.PORT);
  clientConnection.setTimeout(0);

  setTimeout( function() {
    // make sure both connections are still open
    assert.equal(serverConnection.readyState,"open");
    assert.equal(clientConnection.readyState,"open");
    serverConnection.end();
    clientConnection.end();
    echoServer.close();
  }, 1200);
});