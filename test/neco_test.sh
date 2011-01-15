#!/usr/bin/env sh

# Note: In order to use this testing script,
# You need install neco first,
# See detials at https://github.com/kuno/neco
source $NECO_ROOT/.neco/activate.sh

report=./report.txt

if [ -e $report ]; then
  rm -rf $report
fi

# Tesing no nodejs 0.2.x stable branch
for neco_id in 'test0.2.0' 'test0.2.1' 'test0.2.2' 'test0.2.3' 'test0.2.4' 'test0.2.5' 'test0.2.6'; do
  neco_activate $neco_id &>/dev/null
  version=$(node -v)
  echo '#############################################################' >> $report
  echo '################# Testing on nodejs '$version' ##################' >> $report
  echo '#############################################################' >> $report
  sh test.sh >> $report
  echo '#############################################################' >> $report
  echo '############## Finished tests on nodejs '$version' ##############' >> $report
  echo '#############################################################' >> $report
  echo '' >> $report
  neco_deactivate
done

# Tesing no nodejs 0.3.x unstalbe branch
for neco_id in 'test0.3.0' 'test0.3.1' 'test0.3.2' 'test0.3.3' 'test0.3.4'; do
  neco_activate $neco_id &>/dev/null
  version=$(node -v)
  echo '#############################################################' >> $report
  echo '################## Testing on nodejs '$version' #################' >> $report
  echo '#############################################################' >> $report
  sh test.sh >> $report
  echo '#############################################################' >> $report
  echo '############## Finished tests on nodejs '$version' ##############' >> $report
  echo '#############################################################' >> $report
  echo '' >> $report
  neco_deactivate
done   
