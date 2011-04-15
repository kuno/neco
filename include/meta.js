var vStartsFrom  = '0.1.14';  
var tools        = ['python','wget','tar','sed','make','install'];
var npmCouples   = [{node:"0.4.0",npm:"0.3.18"},{node:"0.2.3",npm:"0.2.18"}];

var idLenStandard     = 8;
var verLenStandard    = 7;
var linkLenStandard   = 43;
var sizeLenStandard   = 5;
var npmVerLenStandard = 8;

// spare Global Properties
var sgps = ['cmd', 'target', 'release', 'releases', 'ecosystems', 
  'ecosystem', 'pkgDir','npmVer','destDir', 'pkgDocDir', 
  'pkgShellDir', 'pkgConfigFile', 'pkgActivateFile', 
  'pkgDistFile', 'pkgFullDistFile', 'idLenStandard',
  'globalConfig', 'globalDistFile', 'globalActivateFile'];
// spare Ecosystem Properties 
var seps = sgps.concat(['version', 'localConfigFile', 
    'localDistFile', 'localActivateFile', 
    'timeFormat', 'root', 'recordFile', 
    'installNPM']);

var optList       = ['-v', '--version', '-h', '--help'];
var cmdList       = optList.concat(['howto', 'create', 'remove', 'list', 'update', 'find', 'activate', 'deactivate', 'completion']);
var flagList      = cmdList.concat(['--app', '--npm']);
var resWords      = flagList.concat(['new', 'all', 'stable', 'unstable', 'latest', 'test', 'source']);

var updateOptions = {  // remote dist list address
  host: 'www.nodejs.org',
  port: 80,
  path: '/dist/',
  method: 'GET'
};  
var site         = 'http://www.nodejs.org/';  // Official site
var docs         = 'http://www.nodejs.org/docs/'; // official documents
var issues       = 'http://github.com/kuno/neco/issues';  // Issues tracker 

exports.tools             = tools;
exports.vStartsFrom       = vStartsFrom;
exports.npmCouples        = npmCouples;
exports.idLenStandard     = idLenStandard;
exports.verLenStandard    = verLenStandard;
exports.linkLenStandard   = linkLenStandard;
exports.npmVerLenStandard = npmVerLenStandard;
exports.sgps              = sgps;
exports.seps              = seps;
exports.optList           = optList;
exports.cmdList           = cmdList;
exports.flagList          = flagList;
exports.resWords          = resWords;
exports.updateOptions     = updateOptions;
exports.site              = site;
exports.issues            = issues;
