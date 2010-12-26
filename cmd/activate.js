var path = require('path'), 
spawn = require('child_process').spawn,
root = process.env.NECO_ROOT,
recordFile = path.join(root, '.neco/record.json');
activateScript = '../shell/activate.sh';

exports.activate = function(id) {
  var cmd, target = path.join(root, '.neco', id, 'activate');
  console.log(activateFile);
  cmd = spawn(activateScript, [target]);
  cmd.stdout.on('data', function(data) {
    console.log(''+data);
  });
  cmd.stderr.on('data', function(data) {
    console.log(''+data);
  });
  cmd.on('exit', function(code) {
    if (code !== 0) {
      console.log('Activate exit with code '+code);
    } else {
      console.log('Done!');
    }
  });
};
