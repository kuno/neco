#!/usr/bin/env sh
distdir=$1
replace=$(echo $1 | sed 's/\//\\\//g' | sed 's/\./\\\./g')

if [ -e $HOME/.npmrc ] && [ -e $HOME/.npmrc.necoold ] ; then
  rm -rf $HOME/.npmrc || return 1
  cp ../sample/npmrc $HOME/.npmrc || return 1  
elif [ -e $HOME/.npmrc ] && [ ! -e $HOME/.npmrc.necoold ]; then
  mv $HOME/.npmrc $HOME/.npmrc.necoold || return 1
  cp ../sample/npmrc $HOME/.npmrc || return 1  
else
  cp ../sample/npmrc $HOME/.npmrc || return 1
fi

node ../deps/npm/cli.js config set root $distdir/ecosystem/lib/node || return 1
node ../deps/npm/cli.js config set binroot $distdir/ecosystem/bin || return 1
node ../deps/npm/cli.js config set manroot $distdir/ecosystem/share/man || return 1

# Installation
node ../deps/npm/cli.js install npm || return 1

sed -i -e "s/^root.*/root\ =\ $replace\/ecosystem\/lib\/node/g" ../sample/npmrc || return 1
sed -i -e "s/^binroot.*/binroot\ =\ $replace\/ecosystem\/bin/g" ../sample/npmrc || return 1
sed -i -e "s/^manroot.*/manroot\ = \ $replace\/ecosystem\/share\/man/g" ../sample/npmrc || return 1

# Global npm config
install -Dm644 ../sample/npmrc $distdir/ecosystem/etc/npmrc || return 1
install -Dm644 ../sample/npmrc $distdir/npmrc     || return 1

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
