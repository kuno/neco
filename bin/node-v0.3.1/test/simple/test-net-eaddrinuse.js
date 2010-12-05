common = require('../common');
assert = common.assert
net = require('net');

var server1 = net.createServer(function (socket) {
});
var server2 = net.createServer(function (socket) {
});
server1.listen(common.PORT);
server2.addListener('error', function(error) {
  assert.equal(true, error.message.indexOf('EADDRINUSE') >= 0);
  server1.close();
});
server2.listen(common.PORT);
