common = require("../common");
assert = common.assert;
var util=require('util');
var net=require('net');
var fs=require('fs');
var crypto=require('crypto');

//var client = net.createConnection(4443, "localhost");
var client = net.createConnection(443, "www.microsoft.com");
//var client = net.createConnection(443, "www.google.com");

var caPem = fs.readFileSync(common.fixturesDir+"/msca.pem");
//var caPem = fs.readFileSync("ca.pem");

try{
  var credentials = crypto.createCredentials({ca:caPem});
} catch (e) {
  console.log("Not compiled with OPENSSL support.");
  process.exit();
}

client.setEncoding("UTF8");
client.addListener("connect", function () {
  console.log("client connected.");
  client.setSecure(credentials);
});

client.addListener("secure", function () {
  console.log("client secure : "+JSON.stringify(client.getCipher()));
  console.log(JSON.stringify(client.getPeerCertificate()));
  console.log("verifyPeer : "+client.verifyPeer());
  client.write("GET / HTTP/1.0\r\n\r\n");
});

client.addListener("data", function (chunk) {
  common.error(chunk);
});

client.addListener("end", function () {
  console.log("client disconnected.");
});

