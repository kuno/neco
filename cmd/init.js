var fs = require('fs'),
path = require(('path'),
getLink = require('../lib/utils.js').getLink,
NodeInstallScript = '../shell/intsall_node.sh',
NPMInstallScript  = '../shell/install_npm.sh',
link, target, id;

id = process.argv[2];
target = process.argv[3];
link = getLink(target);

if (!link) {
  console.log('Err: Desired link not found.');
} else {
  console.log('Found!');
}


