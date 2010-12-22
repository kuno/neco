#!/usr/bin/env node

var fs = require('fs');
var target = process.argv[1];

fs.readFile('../data/dist.json', 'utf8', function(err, data) {
  if (err) {throw err;}
  var dist = JSON.parse(data);

  if (!dist) {
    console.log('err');
  } else {
    if (target === 'stable') {
      var ver = dist.stable;
    } else if (target === 'latest') {
  } else {
    dist.history.forEach(function(release) {
      if (release.version === dist.latest) {
        console.log(release.link);
      }
    })
  }
}
});

