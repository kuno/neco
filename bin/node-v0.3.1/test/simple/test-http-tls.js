common = require("../common");
assert = common.assert
net = require("net");
http = require("http");
url = require("url");
qs = require("querystring");
var fs = require('fs');

var have_openssl;
try {
  var crypto = require('crypto');
  var dummy_server = http.createServer(function(){});
  dummy_server.setSecure();
  have_openssl=true;
} catch (e) {
  have_openssl=false;
  console.log("Not compiled with OPENSSL support.");
  process.exit();
}

var request_number = 0;
var requests_sent = 0;
var server_response = "";
var client_got_eof = false;
var caPem = fs.readFileSync(common.fixturesDir+"/test_ca.pem", 'ascii');
var certPem = fs.readFileSync(common.fixturesDir+"/test_cert.pem", 'ascii');
var keyPem = fs.readFileSync(common.fixturesDir+"/test_key.pem", 'ascii');

try{
  var credentials = crypto.createCredentials({key:keyPem, cert:certPem, ca:caPem});
} catch (e) {
  console.log("Not compiled with OPENSSL support.");
  process.exit();
}


var https_server = http.createServer(function (req, res) {
  res.id = request_number;
  req.id = request_number++;

  var verified = res.connection.verifyPeer();
  var peerDN = JSON.stringify(req.connection.getPeerCertificate());
  assert.equal(verified, true);
  assert.equal(peerDN, '{"subject":"/C=UK/ST=Acknack Ltd/L=Rhys Jones'
     + '/O=node.js/OU=Test TLS Certificate/CN=localhost",'
     + '"issuer":"/C=UK/ST=Acknack Ltd/L=Rhys Jones/O=node.js'
     + '/OU=Test TLS Certificate/CN=localhost","valid_from":'
     + '"Nov 11 09:52:22 2009 GMT","valid_to":'
     + '"Nov  6 09:52:22 2029 GMT",'
     + '"fingerprint":"2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF"}');

  if (req.id == 0) {
    assert.equal("GET", req.method);
    assert.equal("/hello", url.parse(req.url).pathname);
    assert.equal("world", qs.parse(url.parse(req.url).query).hello);
    assert.equal("b==ar", qs.parse(url.parse(req.url).query).foo);
  }

  if (req.id == 1) {
    assert.equal("POST", req.method);
    assert.equal("/quit", url.parse(req.url).pathname);
  }

  if (req.id == 2) {
    assert.equal("foo", req.headers['x-x']);
  }

  if (req.id == 3) {
    assert.equal("bar", req.headers['x-x']);
    this.close();
    //console.log("server closed");
  }
  setTimeout(function () {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.write(url.parse(req.url).pathname);
    res.end();
  }, 1);

});
https_server.setSecure(credentials);
https_server.listen(common.PORT);

https_server.addListener("listening", function() {
  var c = net.createConnection(common.PORT);

  c.setEncoding("utf8");

  c.addListener("connect", function () {
    c.setSecure(credentials);
  });

  c.addListener("secure", function () {
      var verified = c.verifyPeer();
      var peerDN = JSON.stringify(c.getPeerCertificate());
      assert.equal(verified, true);
      assert.equal(peerDN, '{"subject":"/C=UK/ST=Acknack Ltd/L=Rhys Jones'
        + '/O=node.js/OU=Test TLS Certificate/CN=localhost",'
        + '"issuer":"/C=UK/ST=Acknack Ltd/L=Rhys Jones/O=node.js'
        + '/OU=Test TLS Certificate/CN=localhost","valid_from":'
        + '"Nov 11 09:52:22 2009 GMT","valid_to":'
        + '"Nov  6 09:52:22 2029 GMT",'
        + '"fingerprint":"2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF"}');
    c.write( "GET /hello?hello=world&foo=b==ar HTTP/1.1\r\n\r\n" );
    requests_sent += 1;
  });

  c.addListener("data", function (chunk) {
    server_response += chunk;

    if (requests_sent == 1) {
      c.write("POST /quit HTTP/1.1\r\n\r\n");
      requests_sent += 1;
    }

    if (requests_sent == 2) {
      c.write("GET / HTTP/1.1\r\nX-X: foo\r\n\r\n"
             +"GET / HTTP/1.1\r\nX-X: bar\r\n\r\n");
      c.end();
      assert.equal(c.readyState, "readOnly");
      requests_sent += 2;
    }

  });

  c.addListener("end", function () {
    client_got_eof = true;
  });

  c.addListener("close", function () {
    assert.equal(c.readyState, "closed");
  });
});

process.addListener("exit", function () {
  assert.equal(4, request_number);
  assert.equal(4, requests_sent);

  var hello = new RegExp("/hello");
  assert.equal(true, hello.exec(server_response) != null);

  var quit = new RegExp("/quit");
  assert.equal(true, quit.exec(server_response) != null);

  assert.equal(true, client_got_eof);
});
