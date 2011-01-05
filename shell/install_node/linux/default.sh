# Gernal installation shell script for linux.

ver=$1
link=$2
destDir=$3

if [ ! -d $destDir/../source ] && [ ! -L $destDir/../source ]; then
  mkdir -p $destDir/../source && cd $destDir/../source
else
  cd $destDir/../source
fi

if [ -d node-$ver ]; then
  rm -rf node-$ver
fi

if [ ! -e node-$ver.tar.gz ]; then
  #curl -O $link || return 1
  wget $link || return 1
  tar zxvf node-$ver.tar.gz
else
  tar zxvf node-$ver.tar.gz
fi

cd node-$ver || return 1

if [ -e /usr/bin/python2 ] || [ -e /usr/local/bin/python2 ]; then
  # python2 fix
  for file in $(find . -name '*.py' -print) wscript tools/waf-light tools/node-waf tools/waf; do
    sed -i 's_^#!.*/usr/bin/python_#!/usr/bin/python2_' $file
    sed -i 's_^#!.*/usr/bin/env.*python_#!/usr/bin/env python2_' $file
    sed -i 's/^#\ \/usr\/bin\/env\ python/#!\/usr\/bin\/env\ python2/g' $file
  done

  sed -i "s|cmd_R = 'python |cmd_R = 'python2 |" wscript

  ./configure --prefix=/ecosystem/ || return 1
  sed -i "s|python |python2 |" Makefile  
else
  ./configure --prefix=/ecosystem/ || return 1
fi

make || return 1

mkdir -p $destDir/ecosystem/{bin,etc,lib,include,share,man}

if [ -e tools/waf-light ]; then
  tools/waf-light install --destdir=$destDir
elif [ -e tools/waf ]; then
  tools/waf install --destdir=$destDir
fi

install -D -m644 LICENSE $destDir/ecosystem/share/licenses/node/LICENSE
install -D -m644 ChangeLog $destDir/ecosystem/share/node/ChangeLog
install -D -m644 README $destDir/ecosystem/share/node/README
