#!/usr/bin/env sh
distdir=$1
version=$2
replace=$(echo $1 | sed 's/\//\\\//g' | sed 's/\./\\\./g')

echo $replace

sed -i -e "s/^NODE_ECOSYSTEM=.*/NODE_ECOSYSTEM=\"$replace\"/g" ../sample/activate
sed -i -e "s/^NODE_VERSION=.*/NODE_VERSION=\"$version\"/g" ../sample/activate
install -m644 ../sample/activate $distdir
