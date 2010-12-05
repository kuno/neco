// Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
#include <node_child_process.h>
#include <node.h>

#include <assert.h>
#include <string.h>
#include <stdlib.h>
#include <errno.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#if defined(__FreeBSD__ ) || defined(__OpenBSD__)
#include <sys/wait.h>
#endif

# ifdef __APPLE__
# include <crt_externs.h>
# define environ (*_NSGetEnviron())
# else
extern char **environ;
# endif

namespace node {

using namespace v8;

static Persistent<String> pid_symbol;
static Persistent<String> onexit_symbol;


// TODO share with other modules
static inline int SetNonBlocking(int fd) {
  int flags = fcntl(fd, F_GETFL, 0);
  int r = fcntl(fd, F_SETFL, flags | O_NONBLOCK);
  if (r != 0) {
    perror("SetNonBlocking()");
  }
  return r;
}


static inline int SetCloseOnExec(int fd) {
  int flags = fcntl(fd, F_GETFD, 0);
  int r = fcntl(fd, F_SETFD, flags | FD_CLOEXEC);
  if (r != 0) {
    perror("SetCloseOnExec()");
  }
  return r;
}


static inline int ResetFlags(int fd) {
  int flags = fcntl(fd, F_GETFL, 0);
  // blocking
  int r = fcntl(fd, F_SETFL, flags & ~O_NONBLOCK);
  flags = fcntl(fd, F_GETFD, 0);
  // unset the CLOEXEC
  fcntl(fd, F_SETFD, flags & ~FD_CLOEXEC);
  return r;
}


void ChildProcess::Initialize(Handle<Object> target) {
  HandleScope scope;

  Local<FunctionTemplate> t = FunctionTemplate::New(ChildProcess::New);
  t->InstanceTemplate()->SetInternalFieldCount(1);
  t->SetClassName(String::NewSymbol("ChildProcess"));

  pid_symbol = NODE_PSYMBOL("pid");
  onexit_symbol = NODE_PSYMBOL("onexit");

  NODE_SET_PROTOTYPE_METHOD(t, "spawn", ChildProcess::Spawn);
  NODE_SET_PROTOTYPE_METHOD(t, "kill", ChildProcess::Kill);

  target->Set(String::NewSymbol("ChildProcess"), t->GetFunction());
}


Handle<Value> ChildProcess::New(const Arguments& args) {
  HandleScope scope;
  ChildProcess *p = new ChildProcess();
  p->Wrap(args.Holder());
  return args.This();
}


// This is an internal function. The third argument should be an array
// of key value pairs seperated with '='.
Handle<Value> ChildProcess::Spawn(const Arguments& args) {
  HandleScope scope;

  if (args.Length() < 3 ||
      !args[0]->IsString() ||
      !args[1]->IsArray() ||
      !args[2]->IsString() ||
      !args[3]->IsArray()) {
    return ThrowException(Exception::Error(String::New("Bad argument.")));
  }

  ChildProcess *child = ObjectWrap::Unwrap<ChildProcess>(args.Holder());

  String::Utf8Value file(args[0]->ToString());

  int i;

  // Copy second argument args[1] into a c-string array called argv.
  // The array must be null terminated, and the first element must be
  // the name of the executable -- hence the complication.
  Local<Array> argv_handle = Local<Array>::Cast(args[1]);
  int argc = argv_handle->Length();
  int argv_length = argc + 1 + 1;
  char **argv = new char*[argv_length]; // heap allocated to detect errors
  argv[0] = strdup(*file); // + 1 for file
  argv[argv_length-1] = NULL;  // + 1 for NULL;
  for (i = 0; i < argc; i++) {
    String::Utf8Value arg(argv_handle->Get(Integer::New(i))->ToString());
    argv[i+1] = strdup(*arg);
  }

  // Copy third argument, args[2], into a c-string called cwd.
  String::Utf8Value arg(args[2]->ToString());
  char *cwd = strdup(*arg);

  // Copy fourth argument, args[3], into a c-string array called env.
  Local<Array> env_handle = Local<Array>::Cast(args[3]);
  int envc = env_handle->Length();
  char **env = new char*[envc+1]; // heap allocated to detect errors
  env[envc] = NULL;
  for (int i = 0; i < envc; i++) {
    String::Utf8Value pair(env_handle->Get(Integer::New(i))->ToString());
    env[i] = strdup(*pair);
  }

  int custom_fds[3] = { -1, -1, -1 };
  if (args[4]->IsArray()) {
    // Set the custom file descriptor values (if any) for the child process
    Local<Array> custom_fds_handle = Local<Array>::Cast(args[4]);
    int custom_fds_len = custom_fds_handle->Length();
    for (int i = 0; i < custom_fds_len; i++) {
      if (custom_fds_handle->Get(i)->IsUndefined()) continue;
      Local<Integer> fd = custom_fds_handle->Get(i)->ToInteger();
      custom_fds[i] = fd->Value();
    }
  }

  int fds[3];

  int r = child->Spawn(argv[0], argv, cwd, env, fds, custom_fds);

  for (i = 0; i < argv_length; i++) free(argv[i]);
  delete [] argv;

  for (i = 0; i < envc; i++) free(env[i]);
  delete [] env;

  if (r != 0) {
    return ThrowException(Exception::Error(String::New("Error spawning")));
  }

  Local<Array> a = Array::New(3);

  assert(fds[0] >= 0);
  a->Set(0, Integer::New(fds[0])); // stdin
  assert(fds[1] >= 0);
  a->Set(1, Integer::New(fds[1])); // stdout
  assert(fds[2] >= 0);
  a->Set(2, Integer::New(fds[2])); // stderr

  return scope.Close(a);
}


Handle<Value> ChildProcess::Kill(const Arguments& args) {
  HandleScope scope;
  ChildProcess *child = ObjectWrap::Unwrap<ChildProcess>(args.Holder());
  assert(child);

  if (child->pid_ < 1) {
    return ThrowException(Exception::Error(String::New("No such process")));
  }

  int sig = SIGTERM;

  if (args.Length() > 0) {
    if (args[0]->IsNumber()) {
      sig = args[0]->Int32Value();
    } else {
      return ThrowException(Exception::Error(String::New("Bad argument.")));
    }
  }

  if (child->Kill(sig) != 0) {
    return ThrowException(Exception::Error(String::New(strerror(errno))));
  }

  return Undefined();
}


void ChildProcess::Stop() {
  if (ev_is_active(&child_watcher_)) {
    ev_child_stop(EV_DEFAULT_UC_ &child_watcher_);
    Unref();
  }
  // Don't kill the PID here. We want to allow for killing the parent
  // process and reparenting to initd. This is perhaps not going the best
  // technique for daemonizing, but I don't want to rule it out.
  pid_ = -1;
}


// Note that args[0] must be the same as the "file" param.  This is an
// execvp() requirement.
//
int ChildProcess::Spawn(const char *file,
                        char *const args[],
                        const char *cwd,
                        char **env,
                        int stdio_fds[3],
                        int custom_fds[3]) {
  HandleScope scope;
  assert(pid_ == -1);
  assert(!ev_is_active(&child_watcher_));

  int stdin_pipe[2], stdout_pipe[2], stderr_pipe[2];

  /* An implementation of popen(), basically */
  if (custom_fds[0] == -1 && pipe(stdin_pipe) < 0 ||
      custom_fds[1] == -1 && pipe(stdout_pipe) < 0 ||
      custom_fds[2] == -1 && pipe(stderr_pipe) < 0) {
    perror("pipe()");
    return -1;
  }

  // Set the close-on-exec FD flag
  if (custom_fds[0] == -1) {
    SetCloseOnExec(stdin_pipe[0]);
    SetCloseOnExec(stdin_pipe[1]);
  }

  if (custom_fds[1] == -1) {
    SetCloseOnExec(stdout_pipe[0]);
    SetCloseOnExec(stdout_pipe[1]);
  }

  if (custom_fds[2] == -1) {
    SetCloseOnExec(stderr_pipe[0]);
    SetCloseOnExec(stderr_pipe[1]);
  }

  // Save environ in the case that we get it clobbered
  // by the child process.
  char **save_our_env = environ;

  switch (pid_ = vfork()) {
    case -1:  // Error.
      Stop();
      return -4;

    case 0:  // Child.
      if (custom_fds[0] == -1) {
        close(stdin_pipe[1]);  // close write end
        dup2(stdin_pipe[0],  STDIN_FILENO);
      } else {
        ResetFlags(custom_fds[0]);
        dup2(custom_fds[0], STDIN_FILENO);
      }

      if (custom_fds[1] == -1) {
        close(stdout_pipe[0]);  // close read end
        dup2(stdout_pipe[1], STDOUT_FILENO);
      } else {
        ResetFlags(custom_fds[1]);
        dup2(custom_fds[1], STDOUT_FILENO);
      }

      if (custom_fds[2] == -1) {
        close(stderr_pipe[0]);  // close read end
        dup2(stderr_pipe[1], STDERR_FILENO);
      } else {
        ResetFlags(custom_fds[2]);
        dup2(custom_fds[2], STDERR_FILENO);
      }

      if (strlen(cwd) && chdir(cwd)) {
        perror("chdir()");
        _exit(127);
      }

      environ = env;

      execvp(file, args);
      perror("execvp()");
      _exit(127);
  }

  // Parent.

  // Restore environment.
  environ = save_our_env;

  ev_child_set(&child_watcher_, pid_, 0);
  ev_child_start(EV_DEFAULT_UC_ &child_watcher_);
  Ref();
  handle_->Set(pid_symbol, Integer::New(pid_));

  if (custom_fds[0] == -1) {
    close(stdin_pipe[0]);
    stdio_fds[0] = stdin_pipe[1];
    SetNonBlocking(stdin_pipe[1]);
  } else {
    stdio_fds[0] = custom_fds[0];
  }

  if (custom_fds[1] == -1) {
    close(stdout_pipe[1]);
    stdio_fds[1] = stdout_pipe[0];
    SetNonBlocking(stdout_pipe[0]);
  } else {
    stdio_fds[1] = custom_fds[1];
  }

  if (custom_fds[2] == -1) {
    close(stderr_pipe[1]);
    stdio_fds[2] = stderr_pipe[0];
    SetNonBlocking(stderr_pipe[0]);
  } else {
    stdio_fds[2] = custom_fds[2];
  }

  return 0;
}


void ChildProcess::OnExit(int status) {
  HandleScope scope;

  pid_ = -1;
  Stop();

  handle_->Set(pid_symbol, Null());

  Local<Value> onexit_v = handle_->Get(onexit_symbol);
  assert(onexit_v->IsFunction());
  Local<Function> onexit = Local<Function>::Cast(onexit_v);

  TryCatch try_catch;

  Local<Value> argv[2];
  if (WIFEXITED(status)) {
    argv[0] = Integer::New(WEXITSTATUS(status));
  } else {
    argv[0] = Local<Value>::New(Null());
  }

  if (WIFSIGNALED(status)) {
    argv[1] = String::NewSymbol(signo_string(WTERMSIG(status)));
  } else {
    argv[1] = Local<Value>::New(Null());
  }

  onexit->Call(handle_, 2, argv);

  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
}


int ChildProcess::Kill(int sig) {
  if (pid_ < 1) return -1;
  return kill(pid_, sig);
}

}  // namespace node

NODE_MODULE(node_child_process, node::ChildProcess::Initialize);
