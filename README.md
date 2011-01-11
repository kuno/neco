neco
====

Nodejs Ecosyste COordinator, just like vitualenv for python.

###What is a nodejs ecosystem?###

An nodejs ecosystem = nodejs (+ npm (+ modules (+ Your applications))).



##Install##

    npm install neco (note: neco needs latest version of nodejs, right now it's 0.3.3)



##Roadmap##

####Next Release: 0.0.3-alpha, at 2011-1-15, depends on nodejs v0.3.4

Becuase neco heavily depends on the new os module from nodejs 0.3.x, which is an unstalbe branch.

So, neco will always be alpha or beta, until nodejs 0.4.x series was been released.

neco will release a new version after a  week of a new nodejs 0.3.x release.


##Usage:##

    neco <command>

    Currently where <command> should be one of the below commands:

    create      -  create a new node ecosystem
        Usage:  neco create <id> [node-version]

    list        -  list all installed node ecosystems
        Usage:  neco list

    find        -  find out the available node release(s)
        Usage:  neco find [stable, latest, <version>]

    activate    -  show how to activate an existing node ecosystem
        Usage:  neco activate <id>

    deactivate  -  show how to deactivate an active node ecosystem
        Usage:  neco deactivate [id]

    help        -  show help information
        Usage:  neco help

Git repository: http://github.com/kuno/neco
