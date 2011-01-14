#!/usr/bin/env sh

unset $NECO_ROOT

neco

export NECO_ROOT=/tmp

neco create test0 stable

neco create test1 latest

neco create test2 

neco create test3 0.1.100

neco remove test0

neco remove test1

neco remove test2

exit 0

