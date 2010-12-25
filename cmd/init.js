var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn,
getRelease = require('../lib/utils.js').getRelease,
NodeInstallScript = '../shell/intsall_node.sh',
NPMInstallScript  = '../shell/install_npm.sh',
release, target, id, NECO_ROOT, TARGET_DIR, 
installNode, installNPM;

id = process.argv[2];
target = process.argv[3];
console.log(typeof getRelease);
release = getRelease(target);

if (!release) {
  console.log('Err: Desired release ' + target + ' not found.');
} else {
  console.log(link);
  NECO_ROOT = path.join(process.env.NECO_ROOT, '.neco') || path.join(process.env.WORKON_HOME, '.neco');
  TARGET_DIR = NECO_ROOT + id.toString();

  path.exists(NECO_ROOT, function(exists) {
    if (!exists) {
      fs.mkdirSync(NECO_ROOT);
    }
    installNode = spawn(NodeInstallScript, [release.version, TARGET_DIR]);
    installNode.stdout.on('data', function(data) {
      console.log('Installing node stdout: ' + data);
    });
    installNode.stderr.on('data', function(data) {
      console.log('Installing node stderr: ' + data);
    });
    installNode.on('exit', function(code) {
      if (code !== 0) {
        console.log('Installing node exit wich code ' + code);
      } else {
        console.log('installing node done!');
        insallNPM = spawn(NPMInstallScript, [TARGET_DIR]);
        installNPM.stdout.on('data', function(data) {
          console.log('Installing NPM stdout: ' + data);
        });
        insallNPM.stderr.on('data', function(data) {
          console.log('Installing NPM stderr: ' + data);
        });
        installNPM.on('exit', function(code) {
          if (code !== 0) {
            console.log('Installing NPM exit with code ' + code);
          } else {
            console.log('Installing NPM done!');
          }
        });
      }
    });
  });
}


