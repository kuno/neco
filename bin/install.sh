#!/usr/bin/env sh

distdir=$1

if [ -e /usr/bin/python2 ] || [ -e /usr/local/bin/python2 ]; then
  # python2 fix
  for file in $(find . -name '*.py' -print) wscript tools/waf-light tools/node-waf; do
    sed -i 's_^#!.*/usr/bin/python_#!/usr/bin/python2_' $file
    sed -i 's_^#!.*/usr/bin/env.*python_#!/usr/bin/env python2_' $file
  done
  sed -i "s|cmd_R = 'python |cmd_R = 'python2 |" wscript

  ./configure --prefix=/usr/ || return 1
  sed -i "s|python |python2 |" Makefile  
else
  ./configure --prefix=/usr/ || return 1 
fi

make || return 1

echo "Dist Dir is"

echo $distdir

mkdir -p $distdir/usr/{bin,lib,include,share,man}

tools/waf-light install --destdir=$distdir

install -D -m644 LICENSE $distdir/usr/share/licenses/node/LICENSE
install -D -m644 ChangeLog $distdir/usr/share/node/ChangeLog
install -D -m644 README $distdir/usr/share/node/README
