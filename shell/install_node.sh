#!/usr/bin/env sh

ver=$1
link=$2
distdir=$3

#echo $distdir

if [ ! -d $distdir/../source ]; then
  mkdir -p $distdir/../source && cd $distdir/../source
else
  cd $distdir/../source
fi

if [ ! -e node-v$ver ]; then
  wget $link && tar zxvf node-v$ver.tar.gz
else
  tar zxvf node-v$ver.tar.gz
fi

cd node-v$ver || return 1

if [ -e /usr/bin/python2 ] || [ -e /usr/local/bin/python2 ]; then
  # python2 fix
  for file in $(find . -name '*.py' -print) wscript tools/waf-light tools/node-waf; do
    sed -i 's_^#!.*/usr/bin/python_#!/usr/bin/python2_' $file
    sed -i 's_^#!.*/usr/bin/env.*python_#!/usr/bin/env python2_' $file
  done
  sed -i "s|cmd_R = 'python |cmd_R = 'python2 |" wscript

  ./configure --prefix=/ecosystem/ || return 1
  sed -i "s|python |python2 |" Makefile  
else
  ./configure --prefix=/ecosystem/ || return 1 
fi

make || return 1

mkdir -p $distdir/ecosystem/{bin,etc,lib,include,share,man}

tools/waf-light install --destdir=$distdir

install -D -m644 LICENSE $distdir/ecosystem/share/licenses/node/LICENSE
install -D -m644 ChangeLog $distdir/ecosystem/share/node/ChangeLog
install -D -m644 README $distdir/ecosystem/share/node/README
