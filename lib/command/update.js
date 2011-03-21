var fs = require('fs'),
path = require('path'),
http = require('http');

var log = require('../display.js').log,
exit = require('../exit.js').exit,
handle = require('../exception.js').handle,
parseLink = require('../utils.js').parseLink,
parseVersions = require('../utils.js').parseVersions,
updateOptions = require('../../include/meta.js').updateOptions;

var message, warning, error, suggestion, example;

function checkNew(next) {
  var hasNew, remote, releases, local, page, 
  history, config = process.neco.config,
  localDistFile = config.localDistFile;

  var req = http.request(updateOptions, function(res) {
    if (res.statusCode !== 200) {
      error = new Error('Can not visit nodejs.org');
      handle.emit('error', error);
    }
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      page += chunk;
    });
    res.on('end', function() {
      history = page.substring(page.indexOf('<pre>') + 5, page.indexOf('</pre>'));
      releases = history.split('\n'); // parse html to array
      path.exists(localDistFile, function(exists) {
        if (exists) {
          local = JSON.parse(fs.readFileSync(localDistFile, 'utf8'));
          if (releases.length - 2 > local.releases) {
            hasNew = true;
          } else {
            hasNew = false;
          }
          next(hasNew, releases);
        } else {
          next(true, releases);
        }
      });
    });
  });

  req.end();
}

function updateDist(links, next) {
  var history, distData,
  config = process.neco.config,
  localDistFile = config.localDistFile;

  history = parseLink(links);
  distData = JSON.stringify(parseVersions(history));

  fs.writeFile(localDistFile, distData, 'utf8', function(err) {
    next(err);
  });
}

exports.run = function(argv) {
  message = 'Check latest nodejs...';
  log.emit('message', message);   
  checkNew(function(hasNew, links) {
    if (!hasNew) {
      message = 'You are already with the latest nodejs.';
      log.emit('message', message);
      exit.emit('success');
    } else {
      message = 'New nodejs release is available!';
      log.emit('message', message);
      updateDist(links, function(err) {
        message = 'Updating local dist file...';
        log.emit('message', message);   
        if (err) {handle.emit('error', err);}
        message = 'Update to latest nodejs.';
        suggestion = 'You can checkout available releases.';
        example = 'neco find';
        log.emit('message', message, suggestion, example);
        exit.emit('success');
      });
    }
  });
};

exports.auto = function(argv) {
  checkNew(function(hasNew, links) {
    if (hasNew) {
      updateDist(links, function(err) {
        });
      }
    });
};
