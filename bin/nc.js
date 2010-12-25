#!/usr/bin/env node

var fs = require('fs'),
path = require('path'),
insall = require('../lib/install.js');

var date = new Date();

var cmd_list = ['new', 'act', 'delete', 'deact'];

var cmd = process.argv[2];

if (cmd_list.indexOf(cmd)) {
  console.log('Command avialable: install, act, delete, deact');
} else {
  if (cmd === 'install') {
    console.log('install node');
    var id = process.argv[3];
    var ver = process.argv[4] || 'stable';
    var NECO_ROOT = path.join(process.NECO_ROOT, '.neco') || path.join(process.WORKON_HOME, '.neco');
    var target_dir = NECO_ROOT + id.toString();

    path.exists(NECO_ROOT, function(exists) {

      if (!exists) {
        fs.mkdirSync(NECO_ROOT);
      }

      var install_node = spawn('../lib/install_node.sh', [ver, target_dir]);

      install_node.stdout.on('data', function(data) {
        console.log('Install node stdout :' + data);
      });

      intall_node.stderr.on('data', function(data) {
        console.log('Install node stderr :' + data);
      });

      install_node.on('exit', function(code) {
        if (code !== 0) {
          console.log('Install node exit with code ' + code);
          else {
            var install_npm = spawn('../lib/install_npm.sh', [target_dir]);

            install_npm.stdout.on('data', function(data) {
            });

            install_npm.stderr.on('data', function(data) {
            });

            install_npm.on('exit', function(code) {
              if (code !== 0) {
                console.log('Install NPM exit with code :' + code);
              } else {
                var config_file = path.join(NECO_ROOT, 'ecosystem');

                path.exists(config_file, function(exists) {
                  if (exists) {
                    fs.readFile(config_file, 'utf8', function(err, data) {
                      if (err) {throw err;}
                      var ecosystem = JSON.parse(data);
                      var eco = {id:id, node_ver:ver, time:date.toUTCString(getTime())}
                      ecosystem.push(eco);
                      fs.writeFile(config_file, JSON.stringify(ecosystem), function(err) {
                        if (err) {throw err;}
                        console.log('Done!');
                      });
                    })
                  });
                }
              });
            }
          });

        }

      } else if (cmd === 'activate') {
      } else if (cmd === 'deactvate') {
      } else if (cmd === 'delete') {
      }
    }
