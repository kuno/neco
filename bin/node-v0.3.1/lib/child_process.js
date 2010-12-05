var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Stream = require('net').Stream;
var InternalChildProcess = process.binding('child_process').ChildProcess;
var constants;


var spawn = exports.spawn = function (path, args /*, options OR env, customFds */) {
  var child = new ChildProcess();
  child.spawn.apply(child, arguments);
  return child;
};

exports.exec = function (command /*, options, callback */) {
  if (arguments.length < 3) {
    return exports.execFile("/bin/sh", ["-c", command], arguments[1]);
  } else if (arguments.length < 4) {
    return exports.execFile("/bin/sh", ["-c", command], arguments[1], arguments[2]);
  } else {
    return exports.execFile("/bin/sh", ["-c", command], arguments[1], arguments[2], arguments[3]);
  }
};


// execFile("something.sh", { env: ENV }, funciton() { })

exports.execFile = function (file /* args, options, callback */) {
  var options = { encoding: 'utf8'
                , timeout: 0
                , maxBuffer: 200*1024
                , killSignal: 'SIGTERM'
                , cwd: null
                , env: null
                };
  var args, optionArg, callback;

  // Parse the parameters.

  if (typeof arguments[arguments.length-1] === "function") {
    callback = arguments[arguments.length-1];
  }

  if (Array.isArray(arguments[1])) {
    args = arguments[1];
    if (typeof arguments[2] === 'object') optionArg = arguments[2];
  } else {
    args = [];
    if (typeof arguments[1] === 'object') optionArg = arguments[1];
  }

  // Merge optionArg into options
  if (optionArg) {
    var keys = Object.keys(options);
    for (var i = 0, len = keys.length; i < len; i++) {
      var k = keys[i];
      if (optionArg[k] !== undefined) options[k] = optionArg[k];
    }
  }

  var child = spawn(file, args, {cwd: options.cwd, env: options.env});
  var stdout = "";
  var stderr = "";
  var killed = false;
  var exited = false;
  var timeoutId;

  function exithandler (code, signal) {
    if (exited) return;
    exited = true;

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (!callback) return;

    if (code === 0 && signal === null) {
      callback(null, stdout, stderr);
    } else {
      var e = new Error("Command failed: " + stderr);
      e.killed = child.killed || killed;
      e.code = code;
      e.signal = signal;
      callback(e, stdout, stderr);
    }
  }

  function kill () {
    killed = true;
    child.kill(options.killSignal);
    process.nextTick(function () {
      exithandler(null, options.killSignal)
    });
  }

  if (options.timeout > 0) {
    timeoutId = setTimeout(function () {
      kill();
      timeoutId = null;
    }, options.timeout);
  }

  child.stdout.setEncoding(options.encoding);
  child.stderr.setEncoding(options.encoding);

  child.stdout.addListener("data", function (chunk) {
    stdout += chunk;
    if (stdout.length > options.maxBuffer) {
      kill();
    }
  });

  child.stderr.addListener("data", function (chunk) {
    stderr += chunk;
    if (stderr.length > options.maxBuffer) {
      kill();
    }
  });

  child.addListener("exit", exithandler);

  return child;
};


function ChildProcess () {
  EventEmitter.call(this);

  var self = this;

  this.killed = false;

  var gotCHLD = false;
  var exitCode;
  var termSignal;
  var internal = this._internal = new InternalChildProcess();

  var stdin  = this.stdin  = new Stream();
  var stdout = this.stdout = new Stream();
  var stderr = this.stderr = new Stream();

  var stderrClosed = false;
  var stdoutClosed = false;

  stderr.addListener('close', function () {
    stderrClosed = true;
    if (gotCHLD && (!self.stdout || stdoutClosed)) {
      self.emit('exit', exitCode, termSignal);
    }
  });

  stdout.addListener('close', function () {
    stdoutClosed = true;
    if (gotCHLD && (!self.stderr || stderrClosed)) {
      self.emit('exit', exitCode, termSignal);
    }
  });

  internal.onexit = function (code, signal) {
    gotCHLD = true;
    exitCode = code;
    termSignal = signal;
    if (self.stdin) {
      self.stdin.end();
    }
    if (   (!self.stdout || !self.stdout.readable)
        && (!self.stderr || !self.stderr.readable)) {
      self.emit('exit', exitCode, termSignal);
    }
  };

  this.__defineGetter__('pid', function () { return internal.pid; });
}
util.inherits(ChildProcess, EventEmitter);


ChildProcess.prototype.kill = function (sig) {
  if (this._internal.pid) {
    this.killed = true;
    if (!constants) constants = process.binding("constants");
    sig = sig || 'SIGTERM';
    if (!constants[sig]) throw new Error("Unknown signal: " + sig);
    return this._internal.kill(constants[sig]);
  }
};


ChildProcess.prototype.spawn = function (path, args, options, customFds) {
  args = args || [];

  var cwd, env;
  if (!options || options.cwd === undefined &&
      options.env === undefined &&
      options.customFds === undefined) {
    // Deprecated API: (path, args, options, env, customFds)
    cwd = "";
    env = options || process.env;
    customFds = customFds || [-1, -1, -1];
  } else {
    // Recommended API: (path, args, options)
    cwd = options.cwd || "";
    env = options.env || process.env;
    customFds = options.customFds || [-1, -1, -1];
  }

  var envPairs = [];
  var keys = Object.keys(env);
  for (var index = 0, keysLength = keys.length; index < keysLength; index++) {
    var key = keys[index];
    envPairs.push(key + "=" + env[key]);
  }

  var fds = this.fds = this._internal.spawn(path, args, cwd, envPairs, customFds);

  if (customFds[0] === -1 || customFds[0] === undefined) {
    this.stdin.open(fds[0]);
    this.stdin.writable = true;
    this.stdin.readable = false;
  } else {
    this.stdin = null;
  }

  if (customFds[1] === -1 || customFds[1] === undefined) {
    this.stdout.open(fds[1]);
    this.stdout.writable = false;
    this.stdout.readable = true;
    this.stdout.resume();
  } else {
    this.stdout = null;
  }

  if (customFds[2] === -1 || customFds[2] === undefined) {
    this.stderr.open(fds[2]);
    this.stderr.writable = false;
    this.stderr.readable = true;
    this.stderr.resume();
  } else {
    this.stderr = null;
  }
};

