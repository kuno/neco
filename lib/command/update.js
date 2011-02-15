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
  var hasNew, remote, releases, local, page, history,
  config = process.neco.config;

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
      local = JSON.parse(fs.readFileSync(config.localDistFile, 'utf8'));

      // Parse html to array
      releases = history.split('\n');
      releases.splice(-1);
      releases.splice(1);

      console.log(releases.length);
      if (releases.length > local.releases) {
        hasNew = true;
      } else {
        hasNew = false;
      }

      next(hasNew, releases);
    });
  });

  req.end();
}

function updateDist(links, next) {
  var history, distData,
  config = process.neco.config,
  localDistFile = config.localDistFile;

  history = parseLink(links);
  distData = parseVersions(history);

  fs.writeFile(localDistFile, distData, 'utf8', function(err) {
    next(err);
  });
}

exports.run = function(argv) {
  checkNew(function(hasNew, links) {
    if (!hasNew) {
      message = 'No new nodejs release is available.';
      log.emit('message', message);
    } else {
      updateDist(links, function(err) {
        if (err) {handle.emit('error', err);}
        message = 'Update to latest nodejs.';
        suggestion = 'You can check the latest releases.';
        example = 'neco find';
        log.emit('message', message, suggestion, example);
        exit.emit('success');
      });
    }
  });
};
