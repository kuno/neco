#!/usr/bin/env sh

unset NECO_ROOT

../bin/neco.js

export NECO_ROOT=/tmp

if [ -e ../data/dist.json.bak ]; then
  mv ../data/dist.json.bak ../data/dist.json || return 1
else 
  cp ../data/dist.json ../data/dist.json.bak || return 1
  cp ./testDist.json ../data/dist.json || return 1
fi
node ../bin/neco.js create test0 stable

node ../bin/neco.js create test1 latest

node ../bin/neco.js create test2 

node ../bin/neco.js create test3 0.1.100

node ../bin/neco.js remove test0

node ../bin/neco.js remove test1

node ../bin/neco.js remove test2

mv ../data/dist.json.bak ../data/dist.json || return 1
exit 0

