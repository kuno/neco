#!/usr/bin/env sh

VERSION="0.0.6"

cd /tmp || return 1
wget http://registry.npmjs.org/neco/-/neco-$VERSION.tgz || return 1
tar zxvf neco-$VERSION.tgz || return 1
cp -r package /usr/lib/node/neco || return 1
cd /usr/bin || return 1
ln -s /usr/lib/node/neco/bin/neco.js /usr/bin/neco || return 1
