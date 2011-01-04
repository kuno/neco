Nodejs Ecosyste COordinator, just like vitualenv for python.

###What is a nodejs ecosystem?###

An nodejs ecosystem = nodejs (+ npm (+ modules (+ Your applications))).

###Usage:###

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
