exports.vStartsFrom = '0.1.14';
exports.cmdList = ['howto', 'create', 'remove', 'list', 'find', 'activate', 
                   'deactivate'];
exports.reservedWords = exports.cmdList.concat(['new', 'all', 'stable', 'unstable', 'latest', 'test', 'source']);
exports.idLenStandard = 8;
exports.verLenStandard = 7;
exports.linkLenStandard = 43;
exports.sizeLenStandard = 5;
exports.npmVerLenStandard = 8;
exports.spareGlobalProperties = ['cmd', 'target', 'release', 'releases', 
                                 'ecosystems', 'ecosystem', 'pkgDir','id',
                                 'docsDir', 'shellDir', 'pkgActivateFile', 
                                 'idLenStandard', 'distFile', 'fullDistFile',
                                 'npmVer', 'destDir'];
exports.spareEcosystemProperties = ['version'];
