#!/usr/bin/env sh

if [ -d /tmp/neco/test ]; then
  rm -rf /tmp/neco || return 1
fi

if [ -n "$NECO_ROOT" ]; then
  OLD_NECO_ROOT="$NECO_ROOT"
  unset NECO_ROOT
  export OLD_NECO_ROOT
fi

node ../bin/nc.js

mkdir -p /tmp/neco/test/.neco || return 1

export NECO_ROOT=/tmp/neco/test

if [ -d "$OLD_NECO_ROOT".neco/source ]; then
  ln -s "$OLD_NECO_ROOT".neco/source /tmp/neco/test/.neco || return 1
fi

node ../bin/nc.js help

node ../bin/nc.js list

node ../bin/nc.js create new

node ../bin/nc.js create test0

node ../bin/nc.js create test1 stable

node ../bin/nc.js create test2 latest

node ../bin/nc.js create test3 0.2.0

node ../bin/nc.js activate

node ../bin/nc.js activate nonexists

node ../bin/nc.js activate test1

#deactivate

node ../bin/nc.js activate test1

node ../bin/nc.js deactivate

node ../bin/nc.js deactivate nonexists

node ../bin/nc.js deactivate test1

#deactivate

node ../bin/nc.js list

if [ -n "$OLD_NECO_ROOT" ]; then
  NECO_ROOT="$OLD_NECO_ROOT"
  export NECO_ROOT
  unset OLD_NECO_ROOT
fi

#rm -rf /tmp/neco || return 1

exit 0
