# NPM installation shell script

pkgDir=$1
destDir=$2
npmVer=$3
npmPrefix='http://registry.npmjs.org/npm/-/npm-'
npmSuffix='.tgz'
npmURL=$npmPrefix$npmVer$npmSuffix
replace=$(echo $2 | sed 's/\//\\\//g' | sed 's/\./\\\./g')

# If binary file not found under $destDir/bin/node, 
# then this means previous node build was failed.
if [ ! -e $destDir/bin/node ]; then
  return 1
fi

# Replace with root, binroot, manroot with destDir
sed -i -e "s/^root.*/root\ =\ $replace\/ecosystem\/lib\/node/g" $pkgDir/sample/npmrc || return 1
sed -i -e "s/^binroot.*/binroot\ =\ $replace\/ecosystem\/bin/g" $pkgDir/sample/npmrc || return 1
sed -i -e "s/^manroot.*/manroot\ = \ $replace\/ecosystem\/share\/man/g" $pkgDir/sample/npmrc || return 1

# Set npm global and user config
export npm_config_globalconfig=$destDir/ecosystem/etc/npmrc || return 1
export npm_config_userconfig=$destDir/npmrc || return 1
install -m666 $pkgDir/sample/npmrc $destDir/ecosystem/etc/npmrc || return 1 
install -m666 $pkgDir/sample/npmrc $destDir/npmrc || return 1

node $pkgDir/deps/npm/cli.js config set root $destDir/ecosystem/lib/node --flags &> /dev/null || return 1
node $pkgDir/deps/npm/cli.js config set binroot $destDir/ecosystem/bin --flags || &> /dev/null return 1
node $pkgDir/deps/npm/cli.js config set manroot $destDir/ecosystem/share/man --flags &> /dev/null|| return 1

# Installation
node $pkgDir/deps/npm/cli.js install $npmURL || return 1
