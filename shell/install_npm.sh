#!/usr/bin/env sh
distdir=$1

node ../deps/npm/cli.js config set root $distdir/usr/lib/node || return 1
node ../deps/npm/cli.js config set binroot $distdir/usr/bin || return 1
node ../deps/npm/cli.js config set manroot $distdir/usr/share/man || return 1
node ../deps/npm/cli.js config set globalconfig $distdir/usr/etc/npmrc || return 1
node ../deps/npm/cli.js config set userconfig  $distdir/usr/etc/npmrc || return 1

# Installation
node ../deps/npm/cli.js install npm || return 1

# Global npm config
install -Dm644 ../sample/npmrc $distdir/usr/etc/npmrc || return 1

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
