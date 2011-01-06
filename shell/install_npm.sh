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
if [ ! -d $destDir/bin/node ]; then
  return 1
fi

# Backup current npmrc config file
if [ -e $HOME/.npmrc ] && [ -e $HOME/.npmrc.neco.old ] ; then
  rm -rf $HOME/.npmrc || return 1
  cp $pkgDir/sample/npmrc $HOME/.npmrc || return 1  
elif [ -e $HOME/.npmrc ] && [ ! -e $HOME/.npmrc.neco.old ]; then
  mv $HOME/.npmrc $HOME/.npmrc.neco.old || return 1
  cp $pkgDir/sample/npmrc $HOME/.npmrc || return 1  
else
  cp $pkgDir/sample/npmrc $HOME/.npmrc || return 1
fi

# Make config suited for installation
install -Dm755 $pkgDir/sample/npmrc $destDir/ecosystem/etc/npmrc || return 1 
node $pkgDir/deps/npm/cli.js config set globalconfig $destDir/ecosystem/etc/npmrc --flags || return 1
node $pkgDir/deps/npm/cli.js config set userconfig $destDir/npmrc --flags || return 1
install -Dm644 $pkgDir/sample/npmrc $destDir/npmrc  || return 1

node $pkgDir/deps/npm/cli.js config set root $destDir/ecosystem/lib/node --flags || return 1
node $pkgDir/deps/npm/cli.js config set binroot $destDir/ecosystem/bin --flags || return 1
node $pkgDir/deps/npm/cli.js config set manroot $destDir/ecosystem/share/man --flags || return 1
node $pkgDir/deps/npm/cli.js config set userconfig $destDir/npmrc --flags || return 1

# Installation
node $pkgDir/deps/npm/cli.js install $npmURL || return 1

sed -i -e "s/^root.*/root\ =\ $replace\/ecosystem\/lib\/node/g" $pkgDir/sample/npmrc || return 1
sed -i -e "s/^binroot.*/binroot\ =\ $replace\/ecosystem\/bin/g" $pkgDir/sample/npmrc || return 1
sed -i -e "s/^manroot.*/manroot\ = \ $replace\/ecosystem\/share\/man/g" $pkgDir/sample/npmrc || return 1

# Global npm config
#install -Dm644 $pkgDir/sample/npmrc $destDir/ecosystem/etc/npmrc || return 1
#install -Dm644 $pkgDir/sample/npmrc $destDir/npmrc     || return 1

# Reocer original user npmrc 
if [ -e $HOME/.npmrc.neco.old ]; then
  #  sed -i -e 's/^root.*/root\ =\ \/usr\/local\/lib\/node/g' $HOME/.npmrc.necoold || return 1
  #  sed -i -e 's/^binroot.*/binroot\ =\ \/usr\/local\/bin/g' $HOME/.npmrc.necoold || return 1
  #  sed -i -e 's/^manroot.*/manroot\ = \ \/usr\/local\/share\/man/g' $HOME/.npmrc.necoold || return 1
  mv $HOME/.npmrc.neco.old $HOME/.npmrc || return 1
  #  sed -i -e 's/^root.*/root\ =\ \/usr\/local\/lib\/node/g' $HOME/.npmrc || return 1
  #  sed -i -e 's/^binroot.*/binroot\ =\ \/usr\/local\/bin/g' $HOME/.npmrc || return 1
  #  sed -i -e 's/^manroot.*/manroot\ = \ \/usr\/local\/share\/man/g' $HOME/.npmrc || return 1
  # else
fi
