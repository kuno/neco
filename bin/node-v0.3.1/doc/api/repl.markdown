## REPL

A Read-Eval-Print-Loop (REPL) is available both as a standalone program and easily
includable in other programs.  REPL provides a way to interactively run
JavaScript and see the results.  It can be used for debugging, testing, or
just trying things out.

By executing `node` without any arguments from the command-line you will be
dropped into the REPL. It has simplistic emacs line-editing.

    mjr:~$ node
    Type '.help' for options.
    node> a = [ 1, 2, 3];
    [ 1, 2, 3 ]
    node> a.forEach(function (v) {
    ...   console.log(v);
    ...   });
    1
    2
    3

For advanced line-editors, start node with the environmental variable `NODE_NO_READLINE=1`.
This will start the REPL in canonical terminal settings which will allow you to use with `rlwrap`.

For example, you could add this to your bashrc file:

    alias node="env NODE_NO_READLINE=1 rlwrap node"


### repl.start(prompt='node> ', stream=process.openStdin())

Starts a REPL with `prompt` as the prompt and `stream` for all I/O.  `prompt`
is optional and defaults to `node> `.  `stream` is optional and defaults to 
`process.openStdin()`.

Multiple REPLs may be started against the same running instance of node.  Each
will share the same global object but will have unique I/O.

Here is an example that starts a REPL on stdin, a Unix socket, and a TCP socket:

    var net = require("net"),
        repl = require("repl");

    connections = 0;

    repl.start("node via stdin> ");

    net.createServer(function (socket) {
      connections += 1;
      repl.start("node via Unix socket> ", socket);
    }).listen("/tmp/node-repl-sock");

    net.createServer(function (socket) {
      connections += 1;
      repl.start("node via TCP socket> ", socket);
    }).listen(5001);

Running this program from the command line will start a REPL on stdin.  Other
REPL clients may connect through the Unix socket or TCP socket. `telnet` is useful
for connecting to TCP sockets, and `socat` can be used to connect to both Unix and
TCP sockets.

By starting a REPL from a Unix socket-based server instead of stdin, you can 
connect to a long-running node process without restarting it.


### REPL Features

Inside the REPL, Control+D will exit.  Multi-line expressions can be input.

The special variable `_` (underscore) contains the result of the last expression.

    node> [ "a", "b", "c" ]
    [ 'a', 'b', 'c' ]
    node> _.length 
    3
    node> _ += 1
    4

The REPL provides access to any variables in the global scope. You can expose a variable 
to the REPL explicitly by assigning it to the `context` object associated with each
`REPLServer`.  For example:

    // repl_test.js
    var repl = require("repl"),
        msg = "message";

    repl.start().context.m = msg;

Things in the `context` object appear as local within the REPL:

    mjr:~$ node repl_test.js 
    node> m
    'message'

There are a few special REPL commands:

  - `.break` - While inputting a multi-line expression, sometimes you get lost or just don't care 
  about completing it.  `.break` will start over.
  - `.clear` - Resets the `context` object to an empty object and clears any multi-line expression.
  - `.exit` - Close the I/O stream, which will cause the REPL to exit.
  - `.help` - Show this list of special commands.

