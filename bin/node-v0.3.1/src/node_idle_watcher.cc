// Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
#include <node_idle_watcher.h>

#include <node.h>
#include <v8.h>

#include <assert.h>

namespace node {

using namespace v8;

Persistent<FunctionTemplate> IdleWatcher::constructor_template;
static Persistent<String> callback_symbol;

void IdleWatcher::Initialize(Handle<Object> target) {
  HandleScope scope;

  Local<FunctionTemplate> t = FunctionTemplate::New(IdleWatcher::New);
  constructor_template = Persistent<FunctionTemplate>::New(t);
  constructor_template->InstanceTemplate()->SetInternalFieldCount(1);
  constructor_template->SetClassName(String::NewSymbol("IdleWatcher"));

  NODE_SET_PROTOTYPE_METHOD(constructor_template, "start", IdleWatcher::Start);
  NODE_SET_PROTOTYPE_METHOD(constructor_template, "stop", IdleWatcher::Stop);
  NODE_SET_PROTOTYPE_METHOD(constructor_template, "setPriority",
      IdleWatcher::SetPriority);

  target->Set(String::NewSymbol("IdleWatcher"), constructor_template->GetFunction());

  callback_symbol = NODE_PSYMBOL("callback");
}


Handle<Value> IdleWatcher::SetPriority(const Arguments& args) {
  IdleWatcher *idle = ObjectWrap::Unwrap<IdleWatcher>(args.Holder());

  HandleScope scope;

  int priority = args[0]->Int32Value();

  ev_set_priority(&idle->watcher_, priority);

  return Undefined();
}


void IdleWatcher::Callback(EV_P_ ev_idle *w, int revents) {
  IdleWatcher *idle = static_cast<IdleWatcher*>(w->data);

  assert(w == &idle->watcher_);
  assert(revents == EV_IDLE);

  HandleScope scope;

  Local<Value> callback_v = idle->handle_->Get(callback_symbol);
  if (!callback_v->IsFunction()) {
    idle->Stop();
    return;
  }

  Local<Function> callback = Local<Function>::Cast(callback_v);

  TryCatch try_catch;

  callback->Call(idle->handle_, 0, NULL);

  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
}


//
//  var idle = new process.IdleWatcher();
//  idle.callback = function () { /* ... */  };
//  idle.start();
//
Handle<Value> IdleWatcher::New(const Arguments& args) {
  if (!args.IsConstructCall()) {
    return FromConstructorTemplate(constructor_template, args);
  }

  HandleScope scope;

  IdleWatcher *s = new IdleWatcher();
  s->Wrap(args.This());

  return args.This();
}


Handle<Value> IdleWatcher::Start(const Arguments& args) {
  HandleScope scope;
  IdleWatcher *idle = ObjectWrap::Unwrap<IdleWatcher>(args.Holder());
  idle->Start();
  return Undefined();
}


void IdleWatcher::Start () {
  if (!watcher_.active) {
    ev_idle_start(EV_DEFAULT_UC_ &watcher_);
    Ref();
  }
}


Handle<Value> IdleWatcher::Stop(const Arguments& args) {
  HandleScope scope;
  IdleWatcher *idle = ObjectWrap::Unwrap<IdleWatcher>(args.Holder());
  idle->Stop();
  return Undefined();
}


void IdleWatcher::Stop () {
  if (watcher_.active) {
    ev_idle_stop(EV_DEFAULT_UC_ &watcher_);
    Unref();
  }
}


}  // namespace node
