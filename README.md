neco
====

Nodejs Ecosyste COordinator, just like vitualenv for python.

###What is a nodejs ecosystem?###

An nodejs ecosystem = nodejs (+ npm (+ modules (+ Your applications))).


##System command dependency###

 - wget: For download nodejs archive

 - tar: For decompress nodejs archive

 - make: For building nodejs

 - sed: For building nodejs

 - install: For building nodejs


##Install##

  __Through node package mamanger__

        npm install neco


##Usage:##

    neco <command>

    Currently where <command> should be one of the below commands:

    create      -  create a new node ecosystem
        Usage:  neco create <id> [node-version]

    remove      -  remove an existing ecosystem
        Usage:  neco remove <id>

    list        -  list all installed node ecosystems
        Usage:  neco list

    updaet      - update local dist file to latest
        Usage:  neco update

    find        -  find out the available node release(s)
        Usage:  neco find [stable, latest, <version>]

    activate    -  show how to activate an existing node ecosystem
        Usage:  neco activate <id>

    deactivate  -  show how to deactivate an active node ecosystem
        Usage:  neco deactivate <id>

    howto       -  show usage information
        Usage:  neco howto

Git repository: http://github.com/kuno/neco
