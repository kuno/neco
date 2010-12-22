
module.exports = docs

docs.usage = "npm docs <pkgname>"

docs.completion = function (args, index, cb) {
  var remotePkgs = require("./utils/completion/remote-packages")
  remotePkgs(args, index, false, false, false, cb)
}

var exec = require("./utils/exec")
  , registry = require("./utils/registry")
  , npm = require("../npm")
  , log = require("./utils/log")
function docs (args, cb) {
  if (!args.length) return cb(docs.usage)
  var n = args[0].split("@").shift()
  registry.get(args[0], "latest", 3600, function (er, d) {
    if (er) return cb(er)
    var homepage = d.homepage
      , repo = d.repository || d.repositories
    if (homepage) return open(homepage, cb)
    if (repo) {
      if (Array.isArray(repo)) repo = repo.shift()
      if (repo.url) {
        return open(repo.url.replace(/^git(@|:\/\/)/, 'http://')
                            .replace(/\.git$/, '')+"#readme", cb)
      }
    }
    cb(n+" doesn't appear to have a 'homepage' or 'repository.url' listed")
  })
}

function open (url, cb) {
  exec(npm.config.get("browser"), [url], log.er(cb,
    "Failed to open "+url+" in a browser.  It could be that the\n"+
    "'browser' config is not set.  Try doing this:\n"+
    "    npm config set browser google-chrome\n"+
    "or:\n"+
    "    npm config set browser lynx\n"))
}
