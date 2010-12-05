common = require("../common");
assert = common.assert
net = require("net");

assert.equal(net.isIP("127.0.0.1"), 4);
assert.equal(net.isIP("x127.0.0.1"), 0);
assert.equal(net.isIP("example.com"), 0);
assert.equal(net.isIP("0000:0000:0000:0000:0000:0000:0000:0000"), 6);
assert.equal(net.isIP("0000:0000:0000:0000:0000:0000:0000:0000::0000"), 0);
assert.equal(net.isIP("1050:0:0:0:5:600:300c:326b"), 6);
assert.equal(net.isIP("2001:252:0:1::2008:6"), 6);
assert.equal(net.isIP("2001:dead:beef:1::2008:6"), 6);
assert.equal(net.isIP("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"), 6);

assert.equal(net.isIPv4("127.0.0.1"), true);
assert.equal(net.isIPv4("example.com"), false);
assert.equal(net.isIPv4("2001:252:0:1::2008:6"), false);

assert.equal(net.isIPv6("127.0.0.1"), false);
assert.equal(net.isIPv4("example.com"), false);
assert.equal(net.isIPv6("2001:252:0:1::2008:6"), true);

