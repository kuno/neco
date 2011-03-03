exports.config       = {version:"0.0.5", "installNPM":true, "timeFormat":"GMT",
idLenStandard:8};
exports.tools        = ['python','wget','tar','sed','make','install'];  
exports.npmCouples   = [{node:"0.4.0",npm:"0.3.12"}, {node:"0.2.3",npm:"0.2.18"}];
exports.vStartsFrom  = '0.1.14';
exports.cmdList      = ['howto', 'create', 'remove', 'list', 'update', 'find', 
'activate', 'deactivate'];
exports.reservedWords = exports.cmdList.concat(['new', 'all', 'stable', 
'unstable', 'latest', 'test', 'source']);

exports.idLenStandard     = 8;
exports.verLenStandard    = 7;
exports.linkLenStandard   = 43;
exports.sizeLenStandard   = 5;
exports.npmVerLenStandard = 8;

// spare Global Properties
exports.sgps = ['cmd', 'target', 'release', 'releases', 'ecosystems', 
                'ecosystem', 'pkgDir','npmVer','destDir', 'pkgDocDir', 
                'pkgShellDir', 'pkgConfigFile', 'pkgActivateFile', 
                'pkgDistFile', 'pkgFullDistFile', 'idLenStandard',
                'globalConfig', 'globalDistFile', 'globalActivateFile'];
// spare Ecosystem Properties 
exports.seps = exports.sgps.concat(['version', 'localConfigFile', 
                                    'localDistFile', 'localActivateFile', 
                                    'timeFormat', 'root', 'recordFile', 
                                    'installNPM']);

exports.issues       = 'http://github.com/kuno/neco/issues';
exports.validFlags   = ['--app', '--npm'];
exports.validOptions = ['-d'];

// Official site
exports.site = 'http://www.nodejs.org/';
exports.updateOptions = {
  host: 'www.nodejs.org',
  port: 80,
  path: '/dist/',
  method: 'GET'
};

