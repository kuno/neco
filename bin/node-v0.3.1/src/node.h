// Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
#ifndef SRC_NODE_H_
#define SRC_NODE_H_

#include <ev.h>
#include <eio.h>
#include <v8.h>
#include <sys/types.h> /* struct stat */
#include <sys/stat.h>

#include <node_object_wrap.h>

#ifndef NODE_STRINGIFY
#define NODE_STRINGIFY(n) NODE_STRINGIFY_HELPER(n)
#define NODE_STRINGIFY_HELPER(n) #n
#endif

namespace node {

int Start (int argc, char *argv[]);

#define NODE_PSYMBOL(s) Persistent<String>::New(String::NewSymbol(s))

/* Converts a unixtime to V8 Date */
#define NODE_UNIXTIME_V8(t) v8::Date::New(1000*static_cast<double>(t))
#define NODE_V8_UNIXTIME(v) (static_cast<double>((v)->IntegerValue())/1000.0);

#define NODE_DEFINE_CONSTANT(target, constant)                            \
  (target)->Set(v8::String::NewSymbol(#constant),                         \
                v8::Integer::New(constant),                               \
                static_cast<v8::PropertyAttribute>(v8::ReadOnly|v8::DontDelete))

#define NODE_SET_METHOD(obj, name, callback)                              \
  obj->Set(v8::String::NewSymbol(name),                                   \
           v8::FunctionTemplate::New(callback)->GetFunction())

#define NODE_SET_PROTOTYPE_METHOD(templ, name, callback)                  \
do {                                                                      \
  v8::Local<v8::Signature> __callback##_SIG = v8::Signature::New(templ);  \
  v8::Local<v8::FunctionTemplate> __callback##_TEM =                      \
    FunctionTemplate::New(callback, v8::Handle<v8::Value>(),              \
                          __callback##_SIG);                              \
  templ->PrototypeTemplate()->Set(v8::String::NewSymbol(name),            \
                                  __callback##_TEM);                      \
} while (0)

enum encoding {ASCII, UTF8, BASE64, BINARY};
enum encoding ParseEncoding(v8::Handle<v8::Value> encoding_v,
                            enum encoding _default = BINARY);
void FatalException(v8::TryCatch &try_catch);

v8::Local<v8::Value> Encode(const void *buf, size_t len,
                            enum encoding encoding = BINARY);

// Returns -1 if the handle was not valid for decoding
ssize_t DecodeBytes(v8::Handle<v8::Value>,
                    enum encoding encoding = BINARY);

// returns bytes written.
ssize_t DecodeWrite(char *buf,
                    size_t buflen,
                    v8::Handle<v8::Value>,
                    enum encoding encoding = BINARY);

v8::Local<v8::Object> BuildStatsObject(struct stat * s);


/**
 * Call this when your constructor is invoked as a regular function, e.g. Buffer(10) instead of new Buffer(10).
 * @param constructorTemplate Constructor template to instantiate from.
 * @param args The arguments object passed to your constructor.
 * @see v8::Arguments::IsConstructCall
 */
v8::Handle<v8::Value> FromConstructorTemplate(v8::Persistent<v8::FunctionTemplate>& constructorTemplate, const v8::Arguments& args);


static inline v8::Persistent<v8::Function>* cb_persist(
    const v8::Local<v8::Value> &v) {
  v8::Persistent<v8::Function> *fn = new v8::Persistent<v8::Function>();
  *fn = v8::Persistent<v8::Function>::New(v8::Local<v8::Function>::Cast(v));
  return fn;
}

static inline v8::Persistent<v8::Function>* cb_unwrap(void *data) {
  v8::Persistent<v8::Function> *cb =
    reinterpret_cast<v8::Persistent<v8::Function>*>(data);
  assert((*cb)->IsFunction());
  return cb;
}

static inline void cb_destroy(v8::Persistent<v8::Function> * cb) {
  cb->Dispose();
  delete cb;
}

v8::Local<v8::Value> ErrnoException(int errorno,
                                    const char *syscall = NULL,
                                    const char *msg = "",
                                    const char *path = NULL);

const char *signo_string(int errorno);

struct node_module_struct {
  int version;
  void *dso_handle;
  const char *filename;
  void (*register_func) (v8::Handle<v8::Object> target);
  const char *modname;
};

node_module_struct* get_builtin_module(const char *name);

/**
 * When this version number is changed, node.js will refuse
 * to load older modules.  This should be done whenever
 * an API is broken in the C++ side, including in v8 or
 * other dependencies
 */
#define NODE_MODULE_VERSION (1)

#define NODE_STANDARD_MODULE_STUFF \
          NODE_MODULE_VERSION,     \
          NULL,                    \
          __FILE__

#define NODE_MODULE(modname, regfunc)   \
  node::node_module_struct modname ## _module =    \
  {                                     \
      NODE_STANDARD_MODULE_STUFF,       \
      regfunc,                          \
      NODE_STRINGIFY(modname)           \
  };

#define NODE_MODULE_DECL(modname) \
  extern node::node_module_struct modname ## _module;


}  // namespace node
#endif  // SRC_NODE_H_
