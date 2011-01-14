#!/usr/bin/env sh
unset NECO_ROOT
export NECO_ROOT=/tmp
export PATH=$PWD/../bin:$PATH

neco.js

if [ -e ../data/dist.json.bak ]; then
  mv ../data/dist.json.bak ../data/dist.json
else 
  cp ../data/dist.json ../data/dist.json.bak
  cp ./testDist.json ../data/dist.json
fi

neco.js create test0 stable

neco.js create test1 latest

neco.js create test2 

neco.js create test3 0.1.100

neco.js remove test0

neco.js remove test1

neco.js remove test2

neco js remove test3

if [ -e ../data/dist.json.bak ] && [ -e ../data/dist.json ]; then
  mv ../data/dist.json.bak ../data/dist.json
fi
rm -rf NECO_ROOT/.neco || return 1

exit 0

