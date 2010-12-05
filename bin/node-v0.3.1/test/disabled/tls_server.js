common = require("../common");
assert = common.assert;

var util=require('util');
var net=require('net');
var fs=require('fs');
var crypto=require('crypto');

var keyPem = fs.readFileSync(common.fixturesDir + "/cert.pem");
var certPem = fs.readFileSync(common.fixturesDir + "/cert.pem");

try{
  var credentials = crypto.createCredentials({key:keyPem, cert:certPem});
} catch (e) {
  console.log("Not compiled with OPENSSL support.");
  process.exit();
}
var i = 0;
var server = net.createServer(function (connection) {
  connection.setSecure(credentials);
  connection.setEncoding("binary");

  connection.addListener("secure", function () {
    //console.log("Secure");
  });

  connection.addListener("data", function (chunk) {
    console.log("recved: " + JSON.stringify(chunk));
    connection.write("HTTP/1.0 200 OK\r\nContent-type: text/plain\r\nContent-length: 9\r\n\r\nOK : "+i+"\r\n\r\n");
    i=i+1;
    connection.end();
  });

  connection.addListener("end", function () {
    connection.end();
  });

});
server.listen(4443);


