id=$1
pkgDir=$2
destDir=$3
version=$4
replace=$(echo $3 | sed 's/\//\\\//g' | sed 's/\./\\\./g')

sed -i -e "s/^NECO_ID=.*/NECO_ID=\"$id\"/g" $pkgDir/sample/activate || return 1
sed -i -e "s/^NODE_ECOSYSTEM=.*/NODE_ECOSYSTEM=\"$replace\"/g" $pkgDir/sample/activate || return 1
sed -i -e "s/^NODE_VERSION=.*/NODE_VERSION=\"$version\"/g" $pkgDir/sample/activate || return 1
install -m644 $pkgDir/sample/activate $destDir || return 1
