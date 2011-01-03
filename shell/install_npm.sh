pkgDir=$1
targetDir=$2
npmVer=$3
npmPrefix='http://registry.npmjs.org/npm/-/npm-'
npmSuffix='.tgz'
npmURL=$npmPrefix$npmVer$npmSuffix
replace=$(echo $2 | sed 's/\//\\\//g' | sed 's/\./\\\./g')

if [ -e $HOME/.npmrc ] && [ -e $HOME/.npmrc.necoold ] ; then
  rm -rf $HOME/.npmrc || return 1
  cp $pkgDir/sample/npmrc $HOME/.npmrc || return 1  
elif [ -e $HOME/.npmrc ] && [ ! -e $HOME/.npmrc.necoold ]; then
  mv $HOME/.npmrc $HOME/.npmrc.necoold || return 1
  cp $pkgDir/sample/npmrc $HOME/.npmrc || return 1  
else
  cp $pkgDir/sample/npmrc $HOME/.npmrc || return 1
fi

node $pkgDir/deps/npm/cli.js config set root $targetDir/ecosystem/lib/node || return 1
node $pkgDir/deps/npm/cli.js config set binroot $targetDir/ecosystem/bin || return 1
node $pkgDir/deps/npm/cli.js config set manroot $targetDir/ecosystem/share/man || return 1

# Installation
node $pkgDir/deps/npm/cli.js install $npmURL || return 1

sed -i -e "s/^root.*/root\ =\ $replace\/ecosystem\/lib\/node/g" $pkgDir/sample/npmrc || return 1
sed -i -e "s/^binroot.*/binroot\ =\ $replace\/ecosystem\/bin/g" $pkgDir/sample/npmrc || return 1
sed -i -e "s/^manroot.*/manroot\ = \ $replace\/ecosystem\/share\/man/g" $pkgDir/sample/npmrc || return 1

# Global npm config
install -Dm644 $pkgDir/sample/npmrc $targetDir/ecosystem/etc/npmrc || return 1
install -Dm644 $pkgDir/sample/npmrc $targetDir/npmrc     || return 1

# Make user npmrc 
if [ -e $HOME/.npmrc.necoold ]; then
  #  sed -i -e 's/^root.*/root\ =\ \/usr\/local\/lib\/node/g' $HOME/.npmrc.necoold || return 1
  #  sed -i -e 's/^binroot.*/binroot\ =\ \/usr\/local\/bin/g' $HOME/.npmrc.necoold || return 1
  #  sed -i -e 's/^manroot.*/manroot\ = \ \/usr\/local\/share\/man/g' $HOME/.npmrc.necoold || return 1
  mv $HOME/.npmrc.necoold $HOME/.npmrc || return 1
  #  sed -i -e 's/^root.*/root\ =\ \/usr\/local\/lib\/node/g' $HOME/.npmrc || return 1
  #  sed -i -e 's/^binroot.*/binroot\ =\ \/usr\/local\/bin/g' $HOME/.npmrc || return 1
  #  sed -i -e 's/^manroot.*/manroot\ = \ \/usr\/local\/share\/man/g' $HOME/.npmrc || return 1
  # else
fi
