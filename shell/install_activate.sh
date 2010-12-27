#!/usr/bin/env sh
packageDir=$1
distdir=$2
version=$3
replace=$(echo $2 | sed 's/\//\\\//g' | sed 's/\./\\\./g')

echo $replace

sed -i -e "s/^NODE_ECOSYSTEM=.*/NODE_ECOSYSTEM=\"$replace\"/g" ../sample/activate
sed -i -e "s/^NODE_VERSION=.*/NODE_VERSION=\"$version\"/g" ../sample/activate
install -m644 $packageDir/sample/activate $distdir
