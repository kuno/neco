exports.npmCouples = [{node:"0.2.3", npm:"0.2.17"}];
exports.vStartsFrom = '0.1.14';
exports.cmdList = ['howto', 'create', 'remove', 'list', 'find', 'activate', 
                   'deactivate'];
exports.reservedWords = exports.cmdList.concat(['new', 'all', 'stable', 'unstable', 'latest', 'test', 'source']);
exports.idLenStandard = 8;
exports.verLenStandard = 7;
exports.linkLenStandard = 43;
exports.sizeLenStandard = 5;
exports.npmVerLenStandard = 8;
// spare Global Properties
exports.sgps = ['cmd', 'target', 'release', 'releases', 'ecosystems', 
                'ecosystem', 'pkgDir','npmVer','destDir', 'pkgDocsDir', 
                'pkgShellDir', 'pkgDocsDir','pkgConfigFile', 'pkgActivateFile', 
                'pkgDistFile', 'pkgFullDistFile', 'idLenStandard',
                'globalConfig', 'globalDistFile', 'globalActivateFile'];
// spare Ecosystem Properties 
exports.seps = exports.sgps.concat(['version', 'localConfigFile', 'localDistFile',
                                    'localActivateFile', 'timeFormat', 'root',
                                    'recordFile', 'installNPM']);

exports.issues = 'http://github.com/kuno/neco/issues';

exports.validFlags = ['--app', '--npm'];
exports.validOptions = ['-d'];

