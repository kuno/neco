#!/usr/bin/env sh

ver=$1
link=$2
distdir=$3

echo $distdir

if [ ! -d $distdir/../source ] && [ ! -L $distdir/../source ]; then
  mkdir -p $distdir/../source && cd $distdir/../source
else
  cd $distdir/../source
fi

echo node-$ver

if [ -d node-$ver ]; then
  rm -rf node-$ver
fi

if [ ! -e node-$ver.tar.gz ]; then
  wget $link && tar zxvf node-$ver.tar.gz
else
  tar zxvf node-$ver.tar.gz
fi

cd node-$ver || return 1

if [ -e /usr/bin/python2 ] || [ -e /usr/local/bin/python2 ]; then
  # python2 fix

  for file in $(find . -name '*.pyc' -print) deps/v8/SConstruct; do
    rm -rf $file
  done

  for file in $(find . -name '*.py' -print) deps/v8/SConstruct wscript tools/waf-light tools/node-waf tools/waf; do
    sed -i 's_^#!.*/usr/bin/python_#!/usr/bin/python2_' $file
    sed -i 's_^#!.*/usr/bin/env.*python_#!/usr/bin/env python2_' $file
    sed -i 's/^#\ \/usr\/bin\/env\ python/#!\/usr\/bin\/env\ python2/g' $file
  done
  
  sed -i 's/python\ \%s/python2\ \%s/g' wscript
  sed -i "s|cmd_R = 'python |cmd_R = 'python2 |" wscript

  ./configure --prefix=/ecosystem/ || return 1
  sed -i "s|python |python2 |" Makefile  
else
  ./configure --prefix=/ecosystem/ || return 1
fi

make || return 1

mkdir -p $distdir/ecosystem/{bin,etc,lib,include,share,man}

if [ -e tools/waf-light ]; then
  tools/waf-light install --destdir=$distdir
elif [ -e tools/waf ]; then
  tools/waf install --destdir=$distdir
fi

install -D -m644 LICENSE $distdir/ecosystem/share/licenses/node/LICENSE
install -D -m644 ChangeLog $distdir/ecosystem/share/node/ChangeLog
install -D -m644 README $distdir/ecosystem/share/node/README
