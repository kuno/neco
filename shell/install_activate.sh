#!/usr/bin/env sh
distdir=$1
replace=$(echo $1 | sed 's/\//\\\//g' | sed 's/\./\\\./g')

echo $replace

sed -i -e "s/^NODE_ECOSYSTEM=.*/NODE_ECOSYSTEM=\"$replace\"/g" ../sample/activate
install -m644 ../sample/activate $distdir
