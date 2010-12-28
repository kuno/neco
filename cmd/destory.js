var fs = require('fs'),
path = require('path'),
spawn = require('child_process').spawn,
root = process.env.NECO_ROOT,
recordFile = path.join(root, '.neco/record.json');

function removeDir(id, callback) {
  var err, cmd, targetDir;
  targetDir = path.join(root, id);

  console.log(targetDir);
  path.exists(targetDir, function(exists) {
    if (!exists) {
      err = new Error('Target Directory dose not Exist.');
      callback(err);
    } else {
      cmd = spawn('rm', ['-rf', targetDir]);
      cmd.stdout.on('data', function(data) {
        console.log(''+data);
      });
      cmd.stderr.on('data', function(data) {
        console.log(''+data);
      });
      cmd.on('exist', function(code) {
        if (code !== 0) {
          err = new Error('Destory exist with code '+code);
          callback(err);
        } else {
          callback(err);
        }
      });
    }
  });
}

function editRecord(id) {
  var record, ecosystems;
  record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));

  record.ecosystems.forEach(function(e) {
    if (e.id === id) {
      record.ecosystems.pop(record.ecosystems.indexOf(e));
    }
  });

  record = JSON.stringify(record);

  fs.write(recordFile, record, 'utf8', function(err) {
    if (err) {throw err;}
    console.log('Ecosystem '+id+' destoried!');
  });
}

exports.run = function(id) {
  removeDir(id, function(err) {
    if (err) {throw err;}
    editRecord(id);
  });
};

