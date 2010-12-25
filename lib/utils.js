var fs = require('fs');

exports.getLink = function(target) {
  var dist, ver, link;
  dist = JSON.parse(fs.readFileSync('../data/dist.json', 'utf8'));

  if (!dist) {
    console.log('err');
  } else {
    if (target === 'stable') {
      ver = dist.stalbe;
    } else if (target === 'latest') {
      ver = dist.latest;
    } else {
      ver = target;
    }

    dist.history.forEach(function(release) {
      if (release.version === ver) {
        link = release.link;
      }
    });
  }

  if (link) {
    return link;
  } else {
    return null;
  }
};
