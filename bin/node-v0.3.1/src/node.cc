// Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
#include <node.h>

#include <locale.h>

#include <stdio.h>
#include <stdlib.h>
#include <strings.h>
#include <string.h>
#include <limits.h> /* PATH_MAX */
#include <assert.h>
#include <unistd.h>
#include <errno.h>
#include <dlfcn.h> /* dlopen(), dlsym() */
#include <sys/types.h>
#include <unistd.h> /* setuid, getuid */
#include <pwd.h> /* getpwnam() */
#include <grp.h> /* getgrnam() */

#include "platform.h"

#include <node_buffer.h>
#include <node_io_watcher.h>
#include <node_net.h>
#include <node_events.h>
#include <node_cares.h>
#include <node_file.h>
#if 0
// not in use
# include <node_idle_watcher.h>
#endif
#include <node_http_parser.h>
#include <node_signal_watcher.h>
#include <node_stat_watcher.h>
#include <node_timer.h>
#include <node_child_process.h>
#include <node_constants.h>
#include <node_stdio.h>
#include <node_javascript.h>
#include <node_version.h>
#ifdef HAVE_OPENSSL
#include <node_crypto.h>
#endif
#include <node_script.h>

#include <v8-debug.h>

#define ARRAY_SIZE(a) (sizeof(a) / sizeof(*(a)))

using namespace v8;

# ifdef __APPLE__
# include <crt_externs.h>
# define environ (*_NSGetEnviron())
# else
extern char **environ;
# endif

namespace node {

static Persistent<Object> process;

static Persistent<String> errno_symbol;
static Persistent<String> syscall_symbol;
static Persistent<String> errpath_symbol;

static Persistent<String> rss_symbol;
static Persistent<String> vsize_symbol;
static Persistent<String> heap_total_symbol;
static Persistent<String> heap_used_symbol;

static Persistent<String> listeners_symbol;
static Persistent<String> uncaught_exception_symbol;
static Persistent<String> emit_symbol;


static char *eval_string = NULL;
static int option_end_index = 0;
static bool use_debug_agent = false;
static bool debug_wait_connect = false;
static int debug_port=5858;
static int max_stack_size = 0;

static ev_check check_tick_watcher;
static ev_prepare prepare_tick_watcher;
static ev_idle tick_spinner;
static bool need_tick_cb;
static Persistent<String> tick_callback_sym;

static ev_async eio_want_poll_notifier;
static ev_async eio_done_poll_notifier;
static ev_idle  eio_poller;

// Buffer for getpwnam_r(), getgrpam_r() and other misc callers; keep this
// scoped at file-level rather than method-level to avoid excess stack usage.
static char getbuf[PATH_MAX + 1];

// We need to notify V8 when we're idle so that it can run the garbage
// collector. The interface to this is V8::IdleNotification(). It returns
// true if the heap hasn't be fully compacted, and needs to be run again.
// Returning false means that it doesn't have anymore work to do.
//
// A rather convoluted algorithm has been devised to determine when Node is
// idle. You'll have to figure it out for yourself.
static ev_check gc_check;
static ev_idle  gc_idle;
static ev_timer gc_timer;
bool need_gc;


#define FAST_TICK 0.7
#define GC_WAIT_TIME 5.
#define RPM_SAMPLES 100
#define TICK_TIME(n) tick_times[(tick_time_head - (n)) % RPM_SAMPLES]
static ev_tstamp tick_times[RPM_SAMPLES];
static int tick_time_head;

static void StartGCTimer () {
  if (!ev_is_active(&gc_timer)) {
    ev_timer_start(EV_DEFAULT_UC_ &gc_timer);
    ev_unref(EV_DEFAULT_UC);
  }
}

static void StopGCTimer () {
  if (ev_is_active(&gc_timer)) {
    ev_ref(EV_DEFAULT_UC);
    ev_timer_stop(EV_DEFAULT_UC_ &gc_timer);
  }
}

static void Idle(EV_P_ ev_idle *watcher, int revents) {
  assert(watcher == &gc_idle);
  assert(revents == EV_IDLE);

  //fprintf(stderr, "idle\n");

  if (V8::IdleNotification()) {
    ev_idle_stop(EV_A_ watcher);
    StopGCTimer();
  }
}


// Called directly after every call to select() (or epoll, or whatever)
static void Check(EV_P_ ev_check *watcher, int revents) {
  assert(watcher == &gc_check);
  assert(revents == EV_CHECK);

  tick_times[tick_time_head] = ev_now(EV_DEFAULT_UC);
  tick_time_head = (tick_time_head + 1) % RPM_SAMPLES;

  StartGCTimer();

  for (int i = 0; i < (int)(GC_WAIT_TIME/FAST_TICK); i++) {
    double d = TICK_TIME(i+1) - TICK_TIME(i+2);
    //printf("d = %f\n", d);
    // If in the last 5 ticks the difference between
    // ticks was less than 0.7 seconds, then continue.
    if (d < FAST_TICK) {
      //printf("---\n");
      return;
    }
  }

  // Otherwise start the gc!

  //fprintf(stderr, "start idle 2\n");
  ev_idle_start(EV_A_ &gc_idle);
}


static Handle<Value> NeedTickCallback(const Arguments& args) {
  HandleScope scope;
  need_tick_cb = true;
  // TODO: this tick_spinner shouldn't be necessary. An ev_prepare should be
  // sufficent, the problem is only in the case of the very last "tick" -
  // there is nothing left to do in the event loop and libev will exit. The
  // ev_prepare callback isn't called before exiting. Thus we start this
  // tick_spinner to keep the event loop alive long enough to handle it.
  ev_idle_start(EV_DEFAULT_UC_ &tick_spinner);
  return Undefined();
}


static void Spin(EV_P_ ev_idle *watcher, int revents) {
  assert(watcher == &tick_spinner);
  assert(revents == EV_IDLE);
}


static void Tick(void) {
  // Avoid entering a V8 scope.
  if (!need_tick_cb) return;

  need_tick_cb = false;
  ev_idle_stop(EV_DEFAULT_UC_ &tick_spinner);

  HandleScope scope;

  if (tick_callback_sym.IsEmpty()) {
    // Lazily set the symbol
    tick_callback_sym =
      Persistent<String>::New(String::NewSymbol("_tickCallback"));
  }

  Local<Value> cb_v = process->Get(tick_callback_sym);
  if (!cb_v->IsFunction()) return;
  Local<Function> cb = Local<Function>::Cast(cb_v);

  TryCatch try_catch;

  cb->Call(process, 0, NULL);

  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
}


static void PrepareTick(EV_P_ ev_prepare *watcher, int revents) {
  assert(watcher == &prepare_tick_watcher);
  assert(revents == EV_PREPARE);
  Tick();
}


static void CheckTick(EV_P_ ev_check *watcher, int revents) {
  assert(watcher == &check_tick_watcher);
  assert(revents == EV_CHECK);
  Tick();
}


static void DoPoll(EV_P_ ev_idle *watcher, int revents) {
  assert(watcher == &eio_poller);
  assert(revents == EV_IDLE);

  //printf("eio_poller\n");

  if (eio_poll() != -1) {
    //printf("eio_poller stop\n");
    ev_idle_stop(EV_DEFAULT_UC_ watcher);
  }
}


// Called from the main thread.
static void WantPollNotifier(EV_P_ ev_async *watcher, int revents) {
  assert(watcher == &eio_want_poll_notifier);
  assert(revents == EV_ASYNC);

  //printf("want poll notifier\n");

  if (eio_poll() == -1) {
    //printf("eio_poller start\n");
    ev_idle_start(EV_DEFAULT_UC_ &eio_poller);
  }
}


static void DonePollNotifier(EV_P_ ev_async *watcher, int revents) {
  assert(watcher == &eio_done_poll_notifier);
  assert(revents == EV_ASYNC);

  //printf("done poll notifier\n");

  if (eio_poll() != -1) {
    //printf("eio_poller stop\n");
    ev_idle_stop(EV_DEFAULT_UC_ &eio_poller);
  }
}


// EIOWantPoll() is called from the EIO thread pool each time an EIO
// request (that is, one of the node.fs.* functions) has completed.
static void EIOWantPoll(void) {
  // Signal the main thread that eio_poll need to be processed.
  ev_async_send(EV_DEFAULT_UC_ &eio_want_poll_notifier);
}


static void EIODonePoll(void) {
  // Signal the main thread that we should stop calling eio_poll().
  // from the idle watcher.
  ev_async_send(EV_DEFAULT_UC_ &eio_done_poll_notifier);
}


static inline const char *errno_string(int errorno) {
#define ERRNO_CASE(e)  case e: return #e;
  switch (errorno) {

#ifdef EACCES
  ERRNO_CASE(EACCES);
#endif

#ifdef EADDRINUSE
  ERRNO_CASE(EADDRINUSE);
#endif

#ifdef EADDRNOTAVAIL
  ERRNO_CASE(EADDRNOTAVAIL);
#endif

#ifdef EAFNOSUPPORT
  ERRNO_CASE(EAFNOSUPPORT);
#endif

#ifdef EAGAIN
  ERRNO_CASE(EAGAIN);
#endif

#ifdef EWOULDBLOCK
# if EAGAIN != EWOULDBLOCK
  ERRNO_CASE(EWOULDBLOCK);
# endif
#endif

#ifdef EALREADY
  ERRNO_CASE(EALREADY);
#endif

#ifdef EBADF
  ERRNO_CASE(EBADF);
#endif

#ifdef EBADMSG
  ERRNO_CASE(EBADMSG);
#endif

#ifdef EBUSY
  ERRNO_CASE(EBUSY);
#endif

#ifdef ECANCELED
  ERRNO_CASE(ECANCELED);
#endif

#ifdef ECHILD
  ERRNO_CASE(ECHILD);
#endif

#ifdef ECONNABORTED
  ERRNO_CASE(ECONNABORTED);
#endif

#ifdef ECONNREFUSED
  ERRNO_CASE(ECONNREFUSED);
#endif

#ifdef ECONNRESET
  ERRNO_CASE(ECONNRESET);
#endif

#ifdef EDEADLK
  ERRNO_CASE(EDEADLK);
#endif

#ifdef EDESTADDRREQ
  ERRNO_CASE(EDESTADDRREQ);
#endif

#ifdef EDOM
  ERRNO_CASE(EDOM);
#endif

#ifdef EDQUOT
  ERRNO_CASE(EDQUOT);
#endif

#ifdef EEXIST
  ERRNO_CASE(EEXIST);
#endif

#ifdef EFAULT
  ERRNO_CASE(EFAULT);
#endif

#ifdef EFBIG
  ERRNO_CASE(EFBIG);
#endif

#ifdef EHOSTUNREACH
  ERRNO_CASE(EHOSTUNREACH);
#endif

#ifdef EIDRM
  ERRNO_CASE(EIDRM);
#endif

#ifdef EILSEQ
  ERRNO_CASE(EILSEQ);
#endif

#ifdef EINPROGRESS
  ERRNO_CASE(EINPROGRESS);
#endif

#ifdef EINTR
  ERRNO_CASE(EINTR);
#endif

#ifdef EINVAL
  ERRNO_CASE(EINVAL);
#endif

#ifdef EIO
  ERRNO_CASE(EIO);
#endif

#ifdef EISCONN
  ERRNO_CASE(EISCONN);
#endif

#ifdef EISDIR
  ERRNO_CASE(EISDIR);
#endif

#ifdef ELOOP
  ERRNO_CASE(ELOOP);
#endif

#ifdef EMFILE
  ERRNO_CASE(EMFILE);
#endif

#ifdef EMLINK
  ERRNO_CASE(EMLINK);
#endif

#ifdef EMSGSIZE
  ERRNO_CASE(EMSGSIZE);
#endif

#ifdef EMULTIHOP
  ERRNO_CASE(EMULTIHOP);
#endif

#ifdef ENAMETOOLONG
  ERRNO_CASE(ENAMETOOLONG);
#endif

#ifdef ENETDOWN
  ERRNO_CASE(ENETDOWN);
#endif

#ifdef ENETRESET
  ERRNO_CASE(ENETRESET);
#endif

#ifdef ENETUNREACH
  ERRNO_CASE(ENETUNREACH);
#endif

#ifdef ENFILE
  ERRNO_CASE(ENFILE);
#endif

#ifdef ENOBUFS
  ERRNO_CASE(ENOBUFS);
#endif

#ifdef ENODATA
  ERRNO_CASE(ENODATA);
#endif

#ifdef ENODEV
  ERRNO_CASE(ENODEV);
#endif

#ifdef ENOENT
  ERRNO_CASE(ENOENT);
#endif

#ifdef ENOEXEC
  ERRNO_CASE(ENOEXEC);
#endif

#ifdef ENOLINK
  ERRNO_CASE(ENOLINK);
#endif

#ifdef ENOLCK
# if ENOLINK != ENOLCK
  ERRNO_CASE(ENOLCK);
# endif
#endif

#ifdef ENOMEM
  ERRNO_CASE(ENOMEM);
#endif

#ifdef ENOMSG
  ERRNO_CASE(ENOMSG);
#endif

#ifdef ENOPROTOOPT
  ERRNO_CASE(ENOPROTOOPT);
#endif

#ifdef ENOSPC
  ERRNO_CASE(ENOSPC);
#endif

#ifdef ENOSR
  ERRNO_CASE(ENOSR);
#endif

#ifdef ENOSTR
  ERRNO_CASE(ENOSTR);
#endif

#ifdef ENOSYS
  ERRNO_CASE(ENOSYS);
#endif

#ifdef ENOTCONN
  ERRNO_CASE(ENOTCONN);
#endif

#ifdef ENOTDIR
  ERRNO_CASE(ENOTDIR);
#endif

#ifdef ENOTEMPTY
  ERRNO_CASE(ENOTEMPTY);
#endif

#ifdef ENOTSOCK
  ERRNO_CASE(ENOTSOCK);
#endif

#ifdef ENOTSUP
  ERRNO_CASE(ENOTSUP);
#else
# ifdef EOPNOTSUPP
  ERRNO_CASE(EOPNOTSUPP);
# endif
#endif

#ifdef ENOTTY
  ERRNO_CASE(ENOTTY);
#endif

#ifdef ENXIO
  ERRNO_CASE(ENXIO);
#endif


#ifdef EOVERFLOW
  ERRNO_CASE(EOVERFLOW);
#endif

#ifdef EPERM
  ERRNO_CASE(EPERM);
#endif

#ifdef EPIPE
  ERRNO_CASE(EPIPE);
#endif

#ifdef EPROTO
  ERRNO_CASE(EPROTO);
#endif

#ifdef EPROTONOSUPPORT
  ERRNO_CASE(EPROTONOSUPPORT);
#endif

#ifdef EPROTOTYPE
  ERRNO_CASE(EPROTOTYPE);
#endif

#ifdef ERANGE
  ERRNO_CASE(ERANGE);
#endif

#ifdef EROFS
  ERRNO_CASE(EROFS);
#endif

#ifdef ESPIPE
  ERRNO_CASE(ESPIPE);
#endif

#ifdef ESRCH
  ERRNO_CASE(ESRCH);
#endif

#ifdef ESTALE
  ERRNO_CASE(ESTALE);
#endif

#ifdef ETIME
  ERRNO_CASE(ETIME);
#endif

#ifdef ETIMEDOUT
  ERRNO_CASE(ETIMEDOUT);
#endif

#ifdef ETXTBSY
  ERRNO_CASE(ETXTBSY);
#endif

#ifdef EXDEV
  ERRNO_CASE(EXDEV);
#endif

  default: return "";
  }
}

const char *signo_string(int signo) {
#define SIGNO_CASE(e)  case e: return #e;
  switch (signo) {

#ifdef SIGHUP
  SIGNO_CASE(SIGHUP);
#endif

#ifdef SIGINT
  SIGNO_CASE(SIGINT);
#endif

#ifdef SIGQUIT
  SIGNO_CASE(SIGQUIT);
#endif

#ifdef SIGILL
  SIGNO_CASE(SIGILL);
#endif

#ifdef SIGTRAP
  SIGNO_CASE(SIGTRAP);
#endif

#ifdef SIGABRT
  SIGNO_CASE(SIGABRT);
#endif

#ifdef SIGIOT
# if SIGABRT != SIGIOT
  SIGNO_CASE(SIGIOT);
# endif
#endif

#ifdef SIGBUS
  SIGNO_CASE(SIGBUS);
#endif

#ifdef SIGFPE
  SIGNO_CASE(SIGFPE);
#endif

#ifdef SIGKILL
  SIGNO_CASE(SIGKILL);
#endif

#ifdef SIGUSR1
  SIGNO_CASE(SIGUSR1);
#endif

#ifdef SIGSEGV
  SIGNO_CASE(SIGSEGV);
#endif

#ifdef SIGUSR2
  SIGNO_CASE(SIGUSR2);
#endif

#ifdef SIGPIPE
  SIGNO_CASE(SIGPIPE);
#endif

#ifdef SIGALRM
  SIGNO_CASE(SIGALRM);
#endif

  SIGNO_CASE(SIGTERM);
  SIGNO_CASE(SIGCHLD);

#ifdef SIGSTKFLT
  SIGNO_CASE(SIGSTKFLT);
#endif


#ifdef SIGCONT
  SIGNO_CASE(SIGCONT);
#endif

#ifdef SIGSTOP
  SIGNO_CASE(SIGSTOP);
#endif

#ifdef SIGTSTP
  SIGNO_CASE(SIGTSTP);
#endif

#ifdef SIGTTIN
  SIGNO_CASE(SIGTTIN);
#endif

#ifdef SIGTTOU
  SIGNO_CASE(SIGTTOU);
#endif

#ifdef SIGURG
  SIGNO_CASE(SIGURG);
#endif

#ifdef SIGXCPU
  SIGNO_CASE(SIGXCPU);
#endif

#ifdef SIGXFSZ
  SIGNO_CASE(SIGXFSZ);
#endif

#ifdef SIGVTALRM
  SIGNO_CASE(SIGVTALRM);
#endif

#ifdef SIGPROF
  SIGNO_CASE(SIGPROF);
#endif

#ifdef SIGWINCH
  SIGNO_CASE(SIGWINCH);
#endif

#ifdef SIGIO
  SIGNO_CASE(SIGIO);
#endif

#ifdef SIGPOLL
# if SIGPOLL != SIGIO
  SIGNO_CASE(SIGPOLL);
# endif
#endif

#ifdef SIGLOST
  SIGNO_CASE(SIGLOST);
#endif

#ifdef SIGPWR
# if SIGPWR != SIGLOST
  SIGNO_CASE(SIGPWR);
# endif
#endif

#ifdef SIGSYS
  SIGNO_CASE(SIGSYS);
#endif

  default: return "";
  }
}


Local<Value> ErrnoException(int errorno,
                            const char *syscall,
                            const char *msg,
                            const char *path) {
  Local<Value> e;
  Local<String> estring = String::NewSymbol(errno_string(errorno));
  if (!msg[0]) msg = strerror(errorno);
  Local<String> message = String::NewSymbol(msg);

  Local<String> cons1 = String::Concat(estring, String::NewSymbol(", "));
  Local<String> cons2 = String::Concat(cons1, message);

  if (errno_symbol.IsEmpty()) {
    syscall_symbol = NODE_PSYMBOL("syscall");
    errno_symbol = NODE_PSYMBOL("errno");
    errpath_symbol = NODE_PSYMBOL("path");
  }

  if (path) {
    Local<String> cons3 = String::Concat(cons2, String::NewSymbol(" '"));
    Local<String> cons4 = String::Concat(cons3, String::New(path));
    Local<String> cons5 = String::Concat(cons4, String::NewSymbol("'"));
    e = Exception::Error(cons5);
  } else {
    e = Exception::Error(cons2);
  }

  Local<Object> obj = e->ToObject();

  obj->Set(errno_symbol, Integer::New(errorno));
  if (path) obj->Set(errpath_symbol, String::New(path));
  if (syscall) obj->Set(syscall_symbol, String::NewSymbol(syscall));
  return e;
}


Handle<Value> FromConstructorTemplate(Persistent<FunctionTemplate>& t,
                                      const Arguments& args) {
  HandleScope scope;

  const int argc = args.Length();
  Local<Value>* argv = new Local<Value>[argc];

  for (int i = 0; i < argc; ++i) {
    argv[i] = args[i];
  }

  Local<Object> instance = t->GetFunction()->NewInstance(argc, argv);

  delete[] argv;

  return scope.Close(instance);
}


enum encoding ParseEncoding(Handle<Value> encoding_v, enum encoding _default) {
  HandleScope scope;

  if (!encoding_v->IsString()) return _default;

  String::Utf8Value encoding(encoding_v->ToString());

  if (strcasecmp(*encoding, "utf8") == 0) {
    return UTF8;
  } else if (strcasecmp(*encoding, "utf-8") == 0) {
    return UTF8;
  } else if (strcasecmp(*encoding, "ascii") == 0) {
    return ASCII;
  } else if (strcasecmp(*encoding, "base64") == 0) {
    return BASE64;
  } else if (strcasecmp(*encoding, "binary") == 0) {
    return BINARY;
  } else if (strcasecmp(*encoding, "raw") == 0) {
    fprintf(stderr, "'raw' (array of integers) has been removed. "
                    "Use 'binary'.\n");
    return BINARY;
  } else if (strcasecmp(*encoding, "raws") == 0) {
    fprintf(stderr, "'raws' encoding has been renamed to 'binary'. "
                    "Please update your code.\n");
    return BINARY;
  } else {
    return _default;
  }
}

Local<Value> Encode(const void *buf, size_t len, enum encoding encoding) {
  HandleScope scope;

  if (!len) return scope.Close(String::Empty());

  if (encoding == BINARY) {
    const unsigned char *cbuf = static_cast<const unsigned char*>(buf);
    uint16_t * twobytebuf = new uint16_t[len];
    for (size_t i = 0; i < len; i++) {
      // XXX is the following line platform independent?
      twobytebuf[i] = cbuf[i];
    }
    Local<String> chunk = String::New(twobytebuf, len);
    delete [] twobytebuf; // TODO use ExternalTwoByteString?
    return scope.Close(chunk);
  }

  // utf8 or ascii encoding
  Local<String> chunk = String::New((const char*)buf, len);
  return scope.Close(chunk);
}

// Returns -1 if the handle was not valid for decoding
ssize_t DecodeBytes(v8::Handle<v8::Value> val, enum encoding encoding) {
  HandleScope scope;

  if (val->IsArray()) {
    fprintf(stderr, "'raw' encoding (array of integers) has been removed. "
                    "Use 'binary'.\n");
    assert(0);
    return -1;
  }

  Local<String> str = val->ToString();

  if (encoding == UTF8) return str->Utf8Length();

  return str->Length();
}

#ifndef MIN
# define MIN(a, b) ((a) < (b) ? (a) : (b))
#endif

// Returns number of bytes written.
ssize_t DecodeWrite(char *buf,
                    size_t buflen,
                    v8::Handle<v8::Value> val,
                    enum encoding encoding) {
  HandleScope scope;

  // XXX
  // A lot of improvement can be made here. See:
  // http://code.google.com/p/v8/issues/detail?id=270
  // http://groups.google.com/group/v8-dev/browse_thread/thread/dba28a81d9215291/ece2b50a3b4022c
  // http://groups.google.com/group/v8-users/browse_thread/thread/1f83b0ba1f0a611

  if (val->IsArray()) {
    fprintf(stderr, "'raw' encoding (array of integers) has been removed. "
                    "Use 'binary'.\n");
    assert(0);
    return -1;
  }

  Local<String> str = val->ToString();

  if (encoding == UTF8) {
    str->WriteUtf8(buf, buflen, NULL, String::HINT_MANY_WRITES_EXPECTED);
    return buflen;
  }

  if (encoding == ASCII) {
    str->WriteAscii(buf, 0, buflen, String::HINT_MANY_WRITES_EXPECTED);
    return buflen;
  }

  // THIS IS AWFUL!!! FIXME

  assert(encoding == BINARY);

  uint16_t * twobytebuf = new uint16_t[buflen];

  str->Write(twobytebuf, 0, buflen, String::HINT_MANY_WRITES_EXPECTED);

  for (size_t i = 0; i < buflen; i++) {
    unsigned char *b = reinterpret_cast<unsigned char*>(&twobytebuf[i]);
    assert(b[1] == 0);
    buf[i] = b[0];
  }

  delete [] twobytebuf;

  return buflen;
}

// Extracts a C str from a V8 Utf8Value.
const char* ToCString(const v8::String::Utf8Value& value) {
  return *value ? *value : "<str conversion failed>";
}

static void ReportException(TryCatch &try_catch, bool show_line) {
  Handle<Message> message = try_catch.Message();

  node::Stdio::DisableRawMode(STDIN_FILENO);
  fprintf(stderr, "\n");

  if (show_line && !message.IsEmpty()) {
    // Print (filename):(line number): (message).
    String::Utf8Value filename(message->GetScriptResourceName());
    const char* filename_string = ToCString(filename);
    int linenum = message->GetLineNumber();
    fprintf(stderr, "%s:%i\n", filename_string, linenum);
    // Print line of source code.
    String::Utf8Value sourceline(message->GetSourceLine());
    const char* sourceline_string = ToCString(sourceline);

    // HACK HACK HACK
    //
    // FIXME
    //
    // Because of how CommonJS modules work, all scripts are wrapped with a
    // "function (function (exports, __filename, ...) {"
    // to provide script local variables.
    //
    // When reporting errors on the first line of a script, this wrapper
    // function is leaked to the user. This HACK is to remove it. The length
    // of the wrapper is 62. That wrapper is defined in src/node.js
    //
    // If that wrapper is ever changed, then this number also has to be
    // updated. Or - someone could clean this up so that the two peices
    // don't need to be changed.
    //
    // Even better would be to get support into V8 for wrappers that
    // shouldn't be reported to users.
    int offset = linenum == 1 ? 62 : 0;

    fprintf(stderr, "%s\n", sourceline_string + offset);
    // Print wavy underline (GetUnderline is deprecated).
    int start = message->GetStartColumn();
    for (int i = offset; i < start; i++) {
      fprintf(stderr, " ");
    }
    int end = message->GetEndColumn();
    for (int i = start; i < end; i++) {
      fprintf(stderr, "^");
    }
    fprintf(stderr, "\n");
  }

  String::Utf8Value trace(try_catch.StackTrace());

  if (trace.length() > 0) {
    fprintf(stderr, "%s\n", *trace);
  } else {
    // this really only happens for RangeErrors, since they're the only
    // kind that won't have all this info in the trace.
    Local<Value> er = try_catch.Exception();
    String::Utf8Value msg(!er->IsObject() ? er->ToString()
                         : er->ToObject()->Get(String::New("message"))->ToString());
    fprintf(stderr, "%s\n", *msg);
  }

  fflush(stderr);
}

// Executes a str within the current v8 context.
Local<Value> ExecuteString(Local<String> source, Local<Value> filename) {
  HandleScope scope;
  TryCatch try_catch;

  Local<v8::Script> script = v8::Script::Compile(source, filename);
  if (script.IsEmpty()) {
    ReportException(try_catch, true);
    exit(1);
  }

  Local<Value> result = script->Run();
  if (result.IsEmpty()) {
    ReportException(try_catch, true);
    exit(1);
  }

  return scope.Close(result);
}


static Handle<Value> Chdir(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 1 || !args[0]->IsString()) {
    return ThrowException(Exception::Error(String::New("Bad argument.")));
  }

  String::Utf8Value path(args[0]->ToString());

  int r = chdir(*path);

  if (r != 0) {
    return ThrowException(Exception::Error(String::New(strerror(errno))));
  }

  return Undefined();
}

static Handle<Value> Cwd(const Arguments& args) {
  HandleScope scope;
  assert(args.Length() == 0);

  char *r = getcwd(getbuf, ARRAY_SIZE(getbuf) - 1);
  if (r == NULL) {
    return ThrowException(Exception::Error(String::New(strerror(errno))));
  }

  getbuf[ARRAY_SIZE(getbuf) - 1] = '\0';
  Local<String> cwd = String::New(r);

  return scope.Close(cwd);
}

static Handle<Value> Umask(const Arguments& args){
  HandleScope scope;
  unsigned int old;
  if(args.Length() < 1) {
    old = umask(0);
    umask((mode_t)old);
  }
  else if(!args[0]->IsInt32()) {
    return ThrowException(Exception::TypeError(
          String::New("argument must be an integer.")));
  }
  else {
    old = umask((mode_t)args[0]->Uint32Value());
  }
  return scope.Close(Uint32::New(old));
}


static Handle<Value> GetUid(const Arguments& args) {
  HandleScope scope;
  assert(args.Length() == 0);
  int uid = getuid();
  return scope.Close(Integer::New(uid));
}

static Handle<Value> GetGid(const Arguments& args) {
  HandleScope scope;
  assert(args.Length() == 0);
  int gid = getgid();
  return scope.Close(Integer::New(gid));
}


static Handle<Value> SetGid(const Arguments& args) {
  HandleScope scope;

  if (args.Length() < 1) {
    return ThrowException(Exception::Error(
      String::New("setgid requires 1 argument")));
  }

  int gid;

  if (args[0]->IsNumber()) {
    gid = args[0]->Int32Value();
  } else if (args[0]->IsString()) {
    String::Utf8Value grpnam(args[0]->ToString());
    struct group grp, *grpp = NULL;
    int err;

    if ((err = getgrnam_r(*grpnam, &grp, getbuf, ARRAY_SIZE(getbuf), &grpp)) ||
        grpp == NULL) {
      return ThrowException(ErrnoException(errno, "getgrnam_r"));
    }

    gid = grpp->gr_gid;
  } else {
    return ThrowException(Exception::Error(
      String::New("setgid argument must be a number or a string")));
  }

  int result;
  if ((result = setgid(gid)) != 0) {
    return ThrowException(ErrnoException(errno, "setgid"));
  }
  return Undefined();
}

static Handle<Value> SetUid(const Arguments& args) {
  HandleScope scope;

  if (args.Length() < 1) {
    return ThrowException(Exception::Error(
          String::New("setuid requires 1 argument")));
  }

  int uid;

  if (args[0]->IsNumber()) {
    uid = args[0]->Int32Value();
  } else if (args[0]->IsString()) {
    String::Utf8Value pwnam(args[0]->ToString());
    struct passwd pwd, *pwdp = NULL;
    int err;

    if ((err = getpwnam_r(*pwnam, &pwd, getbuf, ARRAY_SIZE(getbuf), &pwdp)) ||
        pwdp == NULL) {
      return ThrowException(ErrnoException(errno, "getpwnam_r"));
    }

    uid = pwdp->pw_uid;
  } else {
    return ThrowException(Exception::Error(
      String::New("setuid argument must be a number or a string")));
  }

  int result;
  if ((result = setuid(uid)) != 0) {
    return ThrowException(ErrnoException(errno, "setuid"));
  }
  return Undefined();
}


v8::Handle<v8::Value> Exit(const v8::Arguments& args) {
  HandleScope scope;
  exit(args[0]->IntegerValue());
  return Undefined();
}


static void CheckStatus(EV_P_ ev_timer *watcher, int revents) {
  assert(watcher == &gc_timer);
  assert(revents == EV_TIMEOUT);

  // check memory
  size_t rss, vsize;
  if (!ev_is_active(&gc_idle) && OS::GetMemory(&rss, &vsize) == 0) {
    if (rss > 1024*1024*128) {
      // larger than 128 megs, just start the idle watcher
      ev_idle_start(EV_A_ &gc_idle);
      return;
    }
  }

  double d = ev_now(EV_DEFAULT_UC) - TICK_TIME(3);

  //printfb("timer d = %f\n", d);

  if (d  >= GC_WAIT_TIME - 1.) {
    //fprintf(stderr, "start idle\n");
    ev_idle_start(EV_A_ &gc_idle);
  }
}


v8::Handle<v8::Value> MemoryUsage(const v8::Arguments& args) {
  HandleScope scope;
  assert(args.Length() == 0);

  size_t rss, vsize;

  int r = OS::GetMemory(&rss, &vsize);

  if (r != 0) {
    return ThrowException(Exception::Error(String::New(strerror(errno))));
  }

  Local<Object> info = Object::New();

  if (rss_symbol.IsEmpty()) {
    rss_symbol = NODE_PSYMBOL("rss");
    vsize_symbol = NODE_PSYMBOL("vsize");
    heap_total_symbol = NODE_PSYMBOL("heapTotal");
    heap_used_symbol = NODE_PSYMBOL("heapUsed");
  }

  info->Set(rss_symbol, Integer::NewFromUnsigned(rss));
  info->Set(vsize_symbol, Integer::NewFromUnsigned(vsize));

  // V8 memory usage
  HeapStatistics v8_heap_stats;
  V8::GetHeapStatistics(&v8_heap_stats);
  info->Set(heap_total_symbol,
            Integer::NewFromUnsigned(v8_heap_stats.total_heap_size()));
  info->Set(heap_used_symbol,
            Integer::NewFromUnsigned(v8_heap_stats.used_heap_size()));

  return scope.Close(info);
}


Handle<Value> Kill(const Arguments& args) {
  HandleScope scope;

  if (args.Length() != 2 || !args[0]->IsNumber() || !args[1]->IsNumber()) {
    return ThrowException(Exception::Error(String::New("Bad argument.")));
  }

  pid_t pid = args[0]->IntegerValue();
  int sig = args[1]->Int32Value();
  int r = kill(pid, sig);

  if (r != 0) return ThrowException(ErrnoException(errno, "kill"));

  return Undefined();
}


typedef void (*extInit)(Handle<Object> exports);

// DLOpen is node.dlopen(). Used to load 'module.node' dynamically shared
// objects.
Handle<Value> DLOpen(const v8::Arguments& args) {
  HandleScope scope;

  if (args.Length() < 2) return Undefined();

  String::Utf8Value filename(args[0]->ToString()); // Cast
  Local<Object> target = args[1]->ToObject(); // Cast

  // Actually call dlopen().
  // FIXME: This is a blocking function and should be called asynchronously!
  // This function should be moved to file.cc and use libeio to make this
  // system call.
  void *handle = dlopen(*filename, RTLD_LAZY);

  // Handle errors.
  if (handle == NULL) {
    Local<Value> exception = Exception::Error(String::New(dlerror()));
    return ThrowException(exception);
  }

  String::Utf8Value symbol(args[0]->ToString());
  char *symstr = NULL;
  {
    char *sym = *symbol;
    char *p = strrchr(sym, '/');
    if (p != NULL) {
      sym = p+1;
    }

    p = strrchr(sym, '.');
    if (p != NULL) {
      *p = '\0';
    }

    size_t slen = strlen(sym);
    symstr = static_cast<char*>(calloc(1, slen + sizeof("_module") + 1));
    memcpy(symstr, sym, slen);
    memcpy(symstr+slen, "_module", sizeof("_module") + 1);
  }

  // Get the init() function from the dynamically shared object.
  node_module_struct *mod = static_cast<node_module_struct *>(dlsym(handle, symstr));
  free(symstr);
  // Error out if not found.
  if (mod == NULL) {
    /* Start Compatibility hack: Remove once everyone is using NODE_MODULE macro */
    node_module_struct compat_mod;
    mod = &compat_mod;
    mod->version = NODE_MODULE_VERSION;

    void *init_handle = dlsym(handle, "init");
    if (init_handle == NULL) {
      dlclose(handle);
      Local<Value> exception =
        Exception::Error(String::New("No module symbol found in module."));
      return ThrowException(exception);
    }
    mod->register_func = (extInit)(init_handle);
    /* End Compatibility hack */
  }

  if (mod->version != NODE_MODULE_VERSION) {
    Local<Value> exception =
      Exception::Error(String::New("Module version mismatch, refusing to load."));
    return ThrowException(exception);
  }

  // Execute the C++ module
  mod->register_func(target);

  // Tell coverity that 'handle' should not be freed when we return.
  // coverity[leaked_storage]
  return Undefined();
}


Handle<Value> Compile(const Arguments& args) {
  HandleScope scope;

  if (args.Length() < 2) {
    return ThrowException(Exception::TypeError(
          String::New("needs two arguments.")));
  }

  Local<String> source = args[0]->ToString();
  Local<String> filename = args[1]->ToString();

  TryCatch try_catch;

  Local<v8::Script> script = v8::Script::Compile(source, filename);
  if (try_catch.HasCaught()) {
    // Hack because I can't get a proper stacktrace on SyntaxError
    ReportException(try_catch, true);
    exit(1);
  }

  Local<Value> result = script->Run();
  if (try_catch.HasCaught()) {
    ReportException(try_catch, false);
    exit(1);
  }

  return scope.Close(result);
}

static void OnFatalError(const char* location, const char* message) {
  if (location) {
    fprintf(stderr, "FATAL ERROR: %s %s\n", location, message);
  } else {
    fprintf(stderr, "FATAL ERROR: %s\n", message);
  }
  exit(1);
}

static int uncaught_exception_counter = 0;

void FatalException(TryCatch &try_catch) {
  HandleScope scope;

  // Check if uncaught_exception_counter indicates a recursion
  if (uncaught_exception_counter > 0) {
    ReportException(try_catch, true);
    exit(1);
  }

  if (listeners_symbol.IsEmpty()) {
    listeners_symbol = NODE_PSYMBOL("listeners");
    uncaught_exception_symbol = NODE_PSYMBOL("uncaughtException");
    emit_symbol = NODE_PSYMBOL("emit");
  }

  Local<Value> listeners_v = process->Get(listeners_symbol);
  assert(listeners_v->IsFunction());

  Local<Function> listeners = Local<Function>::Cast(listeners_v);

  Local<String> uncaught_exception_symbol_l = Local<String>::New(uncaught_exception_symbol);
  Local<Value> argv[1] = { uncaught_exception_symbol_l  };
  Local<Value> ret = listeners->Call(process, 1, argv);

  assert(ret->IsArray());

  Local<Array> listener_array = Local<Array>::Cast(ret);

  uint32_t length = listener_array->Length();
  // Report and exit if process has no "uncaughtException" listener
  if (length == 0) {
    ReportException(try_catch, true);
    exit(1);
  }

  // Otherwise fire the process "uncaughtException" event
  Local<Value> emit_v = process->Get(emit_symbol);
  assert(emit_v->IsFunction());

  Local<Function> emit = Local<Function>::Cast(emit_v);

  Local<Value> error = try_catch.Exception();
  Local<Value> event_argv[2] = { uncaught_exception_symbol_l, error };

  uncaught_exception_counter++;
  emit->Call(process, 2, event_argv);
  // Decrement so we know if the next exception is a recursion or not
  uncaught_exception_counter--;
}


static ev_async debug_watcher;

static void DebugMessageCallback(EV_P_ ev_async *watcher, int revents) {
  HandleScope scope;
  assert(watcher == &debug_watcher);
  assert(revents == EV_ASYNC);
  Debug::ProcessDebugMessages();
}

static void DebugMessageDispatch(void) {
  // This function is called from V8's debug thread when a debug TCP client
  // has sent a message.

  // Send a signal to our main thread saying that it should enter V8 to
  // handle the message.
  ev_async_send(EV_DEFAULT_UC_ &debug_watcher);
}

static void DebugBreakMessageHandler(const Debug::Message& message) {
  // do nothing with debug messages.
  // The message handler will get changed by DebuggerAgent::CreateSession in
  // debug-agent.cc of v8/src when a new session is created
}

Persistent<Object> binding_cache;

static Handle<Value> Binding(const Arguments& args) {
  HandleScope scope;

  Local<String> module = args[0]->ToString();
  String::Utf8Value module_v(module);
  node_module_struct* modp;

  if (binding_cache.IsEmpty()) {
    binding_cache = Persistent<Object>::New(Object::New());
  }

  Local<Object> exports;

  if (binding_cache->Has(module)) {
    exports = binding_cache->Get(module)->ToObject();

  } else if ((modp = get_builtin_module(*module_v)) != NULL) {
    exports = Object::New();
    modp->register_func(exports);
    binding_cache->Set(module, exports);

  } else if (!strcmp(*module_v, "constants")) {
    exports = Object::New();
    DefineConstants(exports);
    binding_cache->Set(module, exports);

  } else if (!strcmp(*module_v, "io_watcher")) {
    exports = Object::New();
    IOWatcher::Initialize(exports);
    binding_cache->Set(module, exports);

  } else if (!strcmp(*module_v, "timer")) {
    exports = Object::New();
    Timer::Initialize(exports);
    binding_cache->Set(module, exports);

  } else if (!strcmp(*module_v, "natives")) {
    exports = Object::New();
    DefineJavaScript(exports);
    binding_cache->Set(module, exports);

  } else {

    return ThrowException(Exception::Error(String::New("No such module")));
  }

  return scope.Close(exports);
}


static Handle<Value> ProcessTitleGetter(Local<String> property,
                                        const AccessorInfo& info) {
  HandleScope scope;
  int len;
  const char *s = OS::GetProcessTitle(&len);
  return scope.Close(s ? String::New(s, len) : String::Empty());
}


static void ProcessTitleSetter(Local<String> property,
                               Local<Value> value,
                               const AccessorInfo& info) {
  HandleScope scope;
  String::Utf8Value title(value->ToString());
  OS::SetProcessTitle(*title);
}


static Handle<Value> EnvGetter(Local<String> property,
                               const AccessorInfo& info) {
  String::Utf8Value key(property);
  const char* val = getenv(*key);
  if (val) {
    HandleScope scope;
    return scope.Close(String::New(val));
  }
  return Undefined();
}


static Handle<Value> EnvSetter(Local<String> property,
                               Local<Value> value,
                               const AccessorInfo& info) {
  String::Utf8Value key(property);
  String::Utf8Value val(value);
  setenv(*key, *val, 1);
  return value;
}


static Handle<Integer> EnvQuery(Local<String> property,
                                const AccessorInfo& info) {
  String::Utf8Value key(property);
  if (getenv(*key)) {
    HandleScope scope;
    return scope.Close(Integer::New(None));
  }
  return Handle<Integer>();
}


static Handle<Boolean> EnvDeleter(Local<String> property,
                                  const AccessorInfo& info) {
  String::Utf8Value key(property);
  if (getenv(*key)) {
    unsetenv(*key);	// prototyped as `void unsetenv(const char*)` on some platforms
    return True();
  }
  return False();
}


static Handle<Array> EnvEnumerator(const AccessorInfo& info) {
  HandleScope scope;

  int size = 0;
  while (environ[size]) size++;

  Local<Array> env = Array::New(size);

  for (int i = 0; i < size; ++i) {
    const char* var = environ[i];
    const char* s = strchr(var, '=');
    const int length = s ? s - var : strlen(var);
    env->Set(i, String::New(var, length));
  }

  return scope.Close(env);
}


static void Load(int argc, char *argv[]) {
  HandleScope scope;

  Local<FunctionTemplate> process_template = FunctionTemplate::New();
  node::EventEmitter::Initialize(process_template);

  process = Persistent<Object>::New(process_template->GetFunction()->NewInstance());


  process->SetAccessor(String::New("title"),
                       ProcessTitleGetter,
                       ProcessTitleSetter);

  // process.version
  process->Set(String::NewSymbol("version"), String::New(NODE_VERSION));

  // process.installPrefix
  process->Set(String::NewSymbol("installPrefix"), String::New(NODE_PREFIX));

  Local<Object> versions = Object::New();
  char buf[20];
  process->Set(String::NewSymbol("versions"), versions);
  // +1 to get rid of the leading 'v'
  versions->Set(String::NewSymbol("node"), String::New(NODE_VERSION+1));
  versions->Set(String::NewSymbol("v8"), String::New(V8::GetVersion()));
  versions->Set(String::NewSymbol("ares"), String::New(ARES_VERSION_STR));
  snprintf(buf, 20, "%d.%d", ev_version_major(), ev_version_minor());
  versions->Set(String::NewSymbol("ev"), String::New(buf));



  // process.platform
  process->Set(String::NewSymbol("platform"), String::New(PLATFORM));

  // process.argv
  int i, j;
  Local<Array> arguments = Array::New(argc - option_end_index + 1);
  arguments->Set(Integer::New(0), String::New(argv[0]));
  for (j = 1, i = option_end_index; i < argc; j++, i++) {
    Local<String> arg = String::New(argv[i]);
    arguments->Set(Integer::New(j), arg);
  }
  // assign it
  process->Set(String::NewSymbol("ARGV"), arguments);
  process->Set(String::NewSymbol("argv"), arguments);

  // create process.env
  Local<ObjectTemplate> envTemplate = ObjectTemplate::New();
  envTemplate->SetNamedPropertyHandler(EnvGetter, EnvSetter, EnvQuery, EnvDeleter, EnvEnumerator, Undefined());

  // assign process.ENV
  Local<Object> env = envTemplate->NewInstance();
  process->Set(String::NewSymbol("ENV"), env);
  process->Set(String::NewSymbol("env"), env);

  process->Set(String::NewSymbol("pid"), Integer::New(getpid()));

  // -e, --eval
  if (eval_string) {
    process->Set(String::NewSymbol("_eval"), String::New(eval_string));
  }

  size_t size = 2*PATH_MAX;
  char execPath[size];
  if (OS::GetExecutablePath(execPath, &size) != 0) {
    // as a last ditch effort, fallback on argv[0] ?
    process->Set(String::NewSymbol("execPath"), String::New(argv[0]));
  } else {
    process->Set(String::NewSymbol("execPath"), String::New(execPath, size));
  }


  // define various internal methods
  NODE_SET_METHOD(process, "compile", Compile);
  NODE_SET_METHOD(process, "_needTickCallback", NeedTickCallback);
  NODE_SET_METHOD(process, "reallyExit", Exit);
  NODE_SET_METHOD(process, "chdir", Chdir);
  NODE_SET_METHOD(process, "cwd", Cwd);
  NODE_SET_METHOD(process, "getuid", GetUid);
  NODE_SET_METHOD(process, "setuid", SetUid);

  NODE_SET_METHOD(process, "setgid", SetGid);
  NODE_SET_METHOD(process, "getgid", GetGid);

  NODE_SET_METHOD(process, "umask", Umask);
  NODE_SET_METHOD(process, "dlopen", DLOpen);
  NODE_SET_METHOD(process, "_kill", Kill);
  NODE_SET_METHOD(process, "memoryUsage", MemoryUsage);

  NODE_SET_METHOD(process, "binding", Binding);

  // Assign the EventEmitter. It was created in main().
  process->Set(String::NewSymbol("EventEmitter"),
               EventEmitter::constructor_template->GetFunction());

  // Compile, execute the src/node.js file. (Which was included as static C
  // string in node_natives.h. 'natve_node' is the string containing that
  // source code.)

  // The node.js file returns a function 'f'

  TryCatch try_catch;

  Local<Value> f_value = ExecuteString(String::New(MainSource()),
                                       String::New("node.js"));
  if (try_catch.HasCaught())  {
    ReportException(try_catch, true);
    exit(10);
  }
  assert(f_value->IsFunction());
  Local<Function> f = Local<Function>::Cast(f_value);

  // Now we call 'f' with the 'process' variable that we've built up with
  // all our bindings. Inside node.js we'll take care of assigning things to
  // their places.

  // We start the process this way in order to be more modular. Developers
  // who do not like how 'src/node.js' setups the module system but do like
  // Node's I/O bindings may want to replace 'f' with their own function.

  // Add a reference to the global object
  Local<Object> global = v8::Context::GetCurrent()->Global();
  Local<Value> args[1] = { Local<Value>::New(process) };

  f->Call(global, 1, args);

  if (try_catch.HasCaught())  {
    ReportException(try_catch, true);
    exit(11);
  }
}

static void PrintHelp();

static void ParseDebugOpt(const char* arg) {
  const char *p = 0;

  use_debug_agent = true;
  if (!strcmp (arg, "--debug-brk")) {
    debug_wait_connect = true;
    return;
  } else if (!strcmp(arg, "--debug")) {
    return;
  } else if (strstr(arg, "--debug-brk=") == arg) {
    debug_wait_connect = true;
    p = 1 + strchr(arg, '=');
    debug_port = atoi(p);
  } else if (strstr(arg, "--debug=") == arg) {
    p = 1 + strchr(arg, '=');
    debug_port = atoi(p);
  }
  if (p && debug_port > 1024 && debug_port <  65536)
      return;

  fprintf(stderr, "Bad debug option.\n");
  if (p) fprintf(stderr, "Debug port must be in range 1025 to 65535.\n");

  PrintHelp();
  exit(1);
}

static void PrintHelp() {
  printf("Usage: node [options] script.js [arguments] \n"
         "Options:\n"
         "  -v, --version        print node's version\n"
         "  --debug[=port]       enable remote debugging via given TCP port\n"
         "                       without stopping the execution\n"
         "  --debug-brk[=port]   as above, but break in script.js and\n"
         "                       wait for remote debugger to connect\n"
         "  --v8-options         print v8 command line options\n"
         "  --vars               print various compiled-in variables\n"
         "  --max-stack-size=val set max v8 stack size (bytes)\n"
         "\n"
         "Enviromental variables:\n"
         "NODE_PATH              ':'-separated list of directories\n"
         "                       prefixed to the module search path,\n"
         "                       require.paths.\n"
         "NODE_DEBUG             Print additional debugging output.\n"
         "NODE_MODULE_CONTEXTS   Set to 1 to load modules in their own\n"
         "                       global contexts.\n"
         "NODE_DISABLE_COLORS  Set to 1 to disable colors in the REPL\n"
         "\n"
         "Documentation can be found at http://nodejs.org/api.html"
         " or with 'man node'\n");
}

// Parse node command line arguments.
static void ParseArgs(int *argc, char **argv) {
  int i;

  // TODO use parse opts
  for (i = 1; i < *argc; i++) {
    const char *arg = argv[i];
    if (strstr(arg, "--debug") == arg) {
      ParseDebugOpt(arg);
      argv[i] = const_cast<char*>("");
    } else if (strcmp(arg, "--version") == 0 || strcmp(arg, "-v") == 0) {
      printf("%s\n", NODE_VERSION);
      exit(0);
    } else if (strcmp(arg, "--vars") == 0) {
      printf("NODE_PREFIX: %s\n", NODE_PREFIX);
      printf("NODE_CFLAGS: %s\n", NODE_CFLAGS);
      exit(0);
    } else if (strstr(arg, "--max-stack-size=") == arg) {
      const char *p = 0;
      p = 1 + strchr(arg, '=');
      max_stack_size = atoi(p);
      argv[i] = const_cast<char*>("");
    } else if (strcmp(arg, "--help") == 0 || strcmp(arg, "-h") == 0) {
      PrintHelp();
      exit(0);
    } else if (strcmp(arg, "--eval") == 0 || strcmp(arg, "-e") == 0) {
      if (*argc <= i + 1) {
        fprintf(stderr, "Error: --eval requires an argument\n");
        exit(1);
      }
      argv[i] = const_cast<char*>("");
      eval_string = argv[++i];
    } else if (strcmp(arg, "--v8-options") == 0) {
      argv[i] = const_cast<char*>("--help");
    } else if (argv[i][0] != '-') {
      break;
    }
  }

  option_end_index = i;
}


static void AtExit() {
  node::Stdio::Flush();
  node::Stdio::DisableRawMode(STDIN_FILENO);
}


static void SignalExit(int signal) {
  exit(1);
}


static int RegisterSignalHandler(int signal, void (*handler)(int)) {
  struct sigaction sa;

  memset(&sa, 0, sizeof(sa));
  sa.sa_handler = handler;
  sigfillset(&sa.sa_mask);
  return sigaction(signal, &sa, NULL);
}


int Start(int argc, char *argv[]) {
  // Hack aroung with the argv pointer. Used for process.title = "blah".
  argv = node::OS::SetupArgs(argc, argv);

  // Parse a few arguments which are specific to Node.
  node::ParseArgs(&argc, argv);
  // Parse the rest of the args (up to the 'option_end_index' (where '--' was
  // in the command line))
  int v8argc = node::option_end_index;
  char **v8argv = argv;

  if (node::debug_wait_connect) {
    // v8argv is a copy of argv up to the script file argument +2 if --debug-brk
    // to expose the v8 debugger js object so that node.js can set
    // a breakpoint on the first line of the startup script
    v8argc += 2;
    v8argv = new char*[v8argc];
    memcpy(v8argv, argv, sizeof(argv) * node::option_end_index);
    v8argv[node::option_end_index] = const_cast<char*>("--expose_debug_as");
    v8argv[node::option_end_index + 1] = const_cast<char*>("v8debug");
  }

  // For the normal stack which moves from high to low addresses when frames
  // are pushed, we can compute the limit as stack_size bytes below the
  // the address of a stack variable (e.g. &stack_var) as an approximation
  // of the start of the stack (we're assuming that we haven't pushed a lot
  // of frames yet).
  if (node::max_stack_size != 0) {
    uint32_t stack_var;
    ResourceConstraints constraints;

    uint32_t *stack_limit = &stack_var - (node::max_stack_size / sizeof(uint32_t));
    constraints.set_stack_limit(stack_limit);
    SetResourceConstraints(&constraints); // Must be done before V8::Initialize
  }
  V8::SetFlagsFromCommandLine(&v8argc, v8argv, false);

  // Ignore SIGPIPE
  RegisterSignalHandler(SIGPIPE, SIG_IGN);
  RegisterSignalHandler(SIGINT, SignalExit);
  RegisterSignalHandler(SIGTERM, SignalExit);


  // Initialize the default ev loop.
#if defined(__sun)
  // TODO(Ryan) I'm experiencing abnormally high load using Solaris's
  // EVBACKEND_PORT. Temporarally forcing select() until I debug.
  ev_default_loop(EVBACKEND_POLL);
#elif defined(__MAC_OS_X_VERSION_MIN_REQUIRED) && __MAC_OS_X_VERSION_MIN_REQUIRED >= 1060
  ev_default_loop(EVBACKEND_KQUEUE);
#else
  ev_default_loop(EVFLAG_AUTO);
#endif

  ev_prepare_init(&node::prepare_tick_watcher, node::PrepareTick);
  ev_prepare_start(EV_DEFAULT_UC_ &node::prepare_tick_watcher);
  ev_unref(EV_DEFAULT_UC);

  ev_check_init(&node::check_tick_watcher, node::CheckTick);
  ev_check_start(EV_DEFAULT_UC_ &node::check_tick_watcher);
  ev_unref(EV_DEFAULT_UC);

  ev_idle_init(&node::tick_spinner, node::Spin);

  ev_check_init(&node::gc_check, node::Check);
  ev_check_start(EV_DEFAULT_UC_ &node::gc_check);
  ev_unref(EV_DEFAULT_UC);

  ev_idle_init(&node::gc_idle, node::Idle);
  ev_timer_init(&node::gc_timer, node::CheckStatus, 5., 5.);


  // Setup the EIO thread pool
  { // It requires 3, yes 3, watchers.
    ev_idle_init(&node::eio_poller, node::DoPoll);

    ev_async_init(&node::eio_want_poll_notifier, node::WantPollNotifier);
    ev_async_start(EV_DEFAULT_UC_ &node::eio_want_poll_notifier);
    ev_unref(EV_DEFAULT_UC);

    ev_async_init(&node::eio_done_poll_notifier, node::DonePollNotifier);
    ev_async_start(EV_DEFAULT_UC_ &node::eio_done_poll_notifier);
    ev_unref(EV_DEFAULT_UC);

    eio_init(node::EIOWantPoll, node::EIODonePoll);
    // Don't handle more than 10 reqs on each eio_poll(). This is to avoid
    // race conditions. See test/simple/test-eio-race.js
    eio_set_max_poll_reqs(10);
  }

  V8::Initialize();
  HandleScope handle_scope;

  V8::SetFatalErrorHandler(node::OnFatalError);

  // If the --debug flag was specified then initialize the debug thread.
  if (node::use_debug_agent) {
    // Initialize the async watcher for receiving messages from the debug
    // thread and marshal it into the main thread. DebugMessageCallback()
    // is called from the main thread to execute a random bit of javascript
    // - which will give V8 control so it can handle whatever new message
    // had been received on the debug thread.
    ev_async_init(&node::debug_watcher, node::DebugMessageCallback);
    ev_set_priority(&node::debug_watcher, EV_MAXPRI);
    // Set the callback DebugMessageDispatch which is called from the debug
    // thread.
    Debug::SetDebugMessageDispatchHandler(node::DebugMessageDispatch);
    // Start the async watcher.
    ev_async_start(EV_DEFAULT_UC_ &node::debug_watcher);
    // unref it so that we exit the event loop despite it being active.
    ev_unref(EV_DEFAULT_UC);

    // Start the debug thread and it's associated TCP server on port 5858.
    bool r = Debug::EnableAgent("node " NODE_VERSION, node::debug_port);
    if (node::debug_wait_connect) {
      // Set up an empty handler so v8 will not continue until a debugger
      // attaches. This is the same behavior as Debug::EnableAgent(_,_,true)
      // except we don't break at the beginning of the script.
      // see Debugger::StartAgent in debug.cc of v8/src
      Debug::SetMessageHandler2(node::DebugBreakMessageHandler);
    }

    // Crappy check that everything went well. FIXME
    assert(r);
    // Print out some information.
    printf("debugger listening on port %d\n", node::debug_port);
  }

  // Create the one and only Context.
  Persistent<v8::Context> context = v8::Context::New();
  v8::Context::Scope context_scope(context);

  atexit(node::AtExit);

  // Create all the objects, load modules, do everything.
  // so your next reading stop should be node::Load()!
  node::Load(argc, argv);

  // TODO Probably don't need to start this each time.
  // Avoids failing on test/simple/test-eio-race3.js though
  ev_idle_start(EV_DEFAULT_UC_ &eio_poller);

  // All our arguments are loaded. We've evaluated all of the scripts. We
  // might even have created TCP servers. Now we enter the main eventloop. If
  // there are no watchers on the loop (except for the ones that were
  // ev_unref'd) then this function exits. As long as there are active
  // watchers, it blocks.
  ev_loop(EV_DEFAULT_UC_ 0);


  // process.emit('exit')
  Local<Value> emit_v = process->Get(String::New("emit"));
  assert(emit_v->IsFunction());
  Local<Function> emit = Local<Function>::Cast(emit_v);
  Local<Value> args[] = { String::New("exit") };
  TryCatch try_catch;
  emit->Call(process, 1, args);
  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }


#ifndef NDEBUG
  // Clean up.
  context.Dispose();
  V8::Dispose();
#endif  // NDEBUG
  return 0;
}


}  // namespace node
