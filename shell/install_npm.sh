#!/usr/bin/env sh
distdir=$1

node ../deps/npm/cli.js config set root $distdir/ecosystem/lib/node || return 1
node ../deps/npm/cli.js config set binroot $distdir/ecosystem/bin || return 1
node ../deps/npm/cli.js config set manroot $distdir/ecosystem/share/man || return 1
node ../deps/npm/cli.js config set globalconfig $distdir/ecosystem/etc/npmrc || return 1
node ../deps/npm/cli.js config set userconfig  $distdir/ecosystem/etc/npmrc || return 1

# Installation
node ../deps/npm/cli.js install npm || return 1

# Global npm config
install -Dm644 ../sample/npmrc $distdir/ecosystem/etc/npmrc

# Make user npmrc 
if [ -e $HOME/.npmrc.necoold ]; then
sed -i -e 's/^root.*/root\ =\ \/usr\/local\/lib\/node/g' $HOME/.npmrc.necoold || return 1
sed -i -e 's/^binroot.*/binroot\ =\ \/usr\/local\/bin/g' $HOME/.npmrc.necoold || return 1
sed -i -e 's/^manroot.*/manroot\ = \ \/usr\/local\/share\/man/g' $HOME/.npmrc.necoold || return 1
mv $HOME/.npmrc.necoold $HOME/.npmrc || return 1
else
sed -i -e 's/^root.*/root\ =\ \/usr\/local\/lib\/node/g' $HOME/.npmrc || return 1
sed -i -e 's/^binroot.*/binroot\ =\ \/usr\/local\/bin/g' $HOME/.npmrc || return 1
sed -i -e 's/^manroot.*/manroot\ = \ \/usr\/local\/share\/man/g' $HOME/.npmrc || return 1
fi
