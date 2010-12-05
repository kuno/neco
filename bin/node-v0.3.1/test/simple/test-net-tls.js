common = require("../common");
assert = common.assert
var fs = require('fs');
var net = require('net');

var have_openssl;
try {
  var crypto = require('crypto');
  have_openssl=true;
} catch (e) {
  have_openssl=false;
  console.log("Not compiled with OPENSSL support.");
  process.exit();
}

var caPem = fs.readFileSync(common.fixturesDir+"/test_ca.pem", 'ascii');
var certPem = fs.readFileSync(common.fixturesDir+"/test_cert.pem", 'ascii');
var keyPem = fs.readFileSync(common.fixturesDir+"/test_key.pem", 'ascii');

try{
  var credentials = crypto.createCredentials({key:keyPem, cert:certPem, ca:caPem});
} catch (e) {
  console.log("Not compiled with OPENSSL support.");
  process.exit();
}

var testData = "TEST123";
var serverData = '';
var clientData = '';
var gotSecureServer = false;
var gotSecureClient = false;

var secureServer = net.createServer(function (connection) {
  var self = this;
  connection.setSecure(credentials);
  connection.setEncoding("UTF8");

  connection.addListener("secure", function () {
    gotSecureServer = true;
    var verified = connection.verifyPeer();
    var peerDN = JSON.stringify(connection.getPeerCertificate());
    assert.equal(verified, true);
    assert.equal(peerDN, '{"subject":"/C=UK/ST=Acknack Ltd/L=Rhys Jones'
         + '/O=node.js/OU=Test TLS Certificate/CN=localhost",'
         + '"issuer":"/C=UK/ST=Acknack Ltd/L=Rhys Jones/O=node.js'
         + '/OU=Test TLS Certificate/CN=localhost","valid_from":'
         + '"Nov 11 09:52:22 2009 GMT","valid_to":'
         + '"Nov  6 09:52:22 2029 GMT",'
         + '"fingerprint":"2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF"}');

  });

  connection.addListener("data", function (chunk) {
    serverData += chunk;
    connection.write(chunk);
  });

  connection.addListener("end", function () {
    assert.equal(serverData, testData);
    connection.end();
    self.close();
  });
});
secureServer.listen(common.PORT);

secureServer.addListener("listening", function() {
  var secureClient = net.createConnection(common.PORT);

  secureClient.setEncoding("UTF8");
  secureClient.addListener("connect", function () {
    secureClient.setSecure(credentials);
  });

  secureClient.addListener("secure", function () {
    gotSecureClient = true;
    var verified = secureClient.verifyPeer();
    var peerDN = JSON.stringify(secureClient.getPeerCertificate());
    assert.equal(verified, true);
    assert.equal(peerDN, '{"subject":"/C=UK/ST=Acknack Ltd/L=Rhys Jones'
      + '/O=node.js/OU=Test TLS Certificate/CN=localhost",'
      + '"issuer":"/C=UK/ST=Acknack Ltd/L=Rhys Jones/O=node.js'
      + '/OU=Test TLS Certificate/CN=localhost","valid_from":'
      + '"Nov 11 09:52:22 2009 GMT","valid_to":'
      + '"Nov  6 09:52:22 2029 GMT",'
      + '"fingerprint":"2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF"}');

    secureClient.write(testData);
    secureClient.end();
  });

  secureClient.addListener("data", function (chunk) {
    clientData += chunk;
  });

  secureClient.addListener("end", function () {
    assert.equal(clientData, testData);
  });
});

process.addListener("exit", function () {
  assert.ok(gotSecureServer, "Did not get secure event for server");
  assert.ok(gotSecureClient, "Did not get secure event for clientr");
});
