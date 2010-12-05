#include <node_crypto.h>
#include <v8.h>

#include <node.h>
#include <node_buffer.h>

#include <string.h>
#include <stdlib.h>

#include <errno.h>

#if OPENSSL_VERSION_NUMBER >= 0x10000000L
# define OPENSSL_CONST const
#else
# define OPENSSL_CONST
#endif

namespace node {

using namespace v8;

static Persistent<String> errno_symbol;
static Persistent<String> syscall_symbol;
static Persistent<String> subject_symbol;
static Persistent<String> issuer_symbol;
static Persistent<String> valid_from_symbol;
static Persistent<String> valid_to_symbol;
static Persistent<String> fingerprint_symbol;
static Persistent<String> name_symbol;
static Persistent<String> version_symbol;


static int verify_callback(int ok, X509_STORE_CTX *ctx) {
  assert(ok);
  return(1); // Ignore errors by now. VerifyPeer will catch them by using SSL_get_verify_result.
}


void SecureContext::Initialize(Handle<Object> target) {
  HandleScope scope;

  Local<FunctionTemplate> t = FunctionTemplate::New(SecureContext::New);
  t->InstanceTemplate()->SetInternalFieldCount(1);
  t->SetClassName(String::NewSymbol("SecureContext"));

  NODE_SET_PROTOTYPE_METHOD(t, "init", SecureContext::Init);
  NODE_SET_PROTOTYPE_METHOD(t, "setKey", SecureContext::SetKey);
  NODE_SET_PROTOTYPE_METHOD(t, "setCert", SecureContext::SetCert);
  NODE_SET_PROTOTYPE_METHOD(t, "addCACert", SecureContext::AddCACert);
  NODE_SET_PROTOTYPE_METHOD(t, "setCiphers", SecureContext::SetCiphers);
  NODE_SET_PROTOTYPE_METHOD(t, "close", SecureContext::Close);

  target->Set(String::NewSymbol("SecureContext"), t->GetFunction());
}


Handle<Value> SecureContext::New(const Arguments& args) {
  HandleScope scope;
  SecureContext *p = new SecureContext();
  p->Wrap(args.Holder());
  return args.This();
}


Handle<Value> SecureContext::Init(const Arguments& args) {
  HandleScope scope;

  SecureContext *sc = ObjectWrap::Unwrap<SecureContext>(args.Holder());

  OPENSSL_CONST SSL_METHOD *method = SSLv23_method();

  if (args.Length() == 1) {
    if (!args[0]->IsString())
    return ThrowException(Exception::TypeError(
          String::New("Bad parameter")));

    String::Utf8Value sslmethod(args[0]->ToString());
    if (strcmp(*sslmethod, "SSLv2_method") == 0)
      method = SSLv2_method();
    if (strcmp(*sslmethod, "SSLv2_server_method") == 0)
      method = SSLv2_server_method();
    if (strcmp(*sslmethod, "SSLv2_client_method") == 0)
      method = SSLv2_client_method();
    if (strcmp(*sslmethod, "SSLv3_method") == 0)
      method = SSLv3_method();
    if (strcmp(*sslmethod, "SSLv3_server_method") == 0)
      method = SSLv3_server_method();
    if (strcmp(*sslmethod, "SSLv3_client_method") == 0)
      method = SSLv3_client_method();
    if (strcmp(*sslmethod, "SSLv23_method") == 0)
      method = SSLv23_method();
    if (strcmp(*sslmethod, "SSLv23_server_method") == 0)
      method = SSLv23_server_method();
    if (strcmp(*sslmethod, "SSLv23_client_method") == 0)
      method = SSLv23_client_method();
    if (strcmp(*sslmethod, "TLSv1_method") == 0)
      method = TLSv1_method();
    if (strcmp(*sslmethod, "TLSv1_server_method") == 0)
      method = TLSv1_server_method();
    if (strcmp(*sslmethod, "TLSv1_client_method") == 0)
      method = TLSv1_client_method();
  }

  sc->ctx_ = SSL_CTX_new(method);
  // Enable session caching?
  SSL_CTX_set_session_cache_mode(sc->ctx_, SSL_SESS_CACHE_SERVER);
  // SSL_CTX_set_session_cache_mode(sc->ctx_,SSL_SESS_CACHE_OFF);

  sc->ca_store_ = X509_STORE_new();
  SSL_CTX_set_cert_store(sc->ctx_, sc->ca_store_);
  return True();
}


Handle<Value> SecureContext::SetKey(const Arguments& args) {
  HandleScope scope;

  SecureContext *sc = ObjectWrap::Unwrap<SecureContext>(args.Holder());

  if (args.Length() != 1 || !args[0]->IsString()) {
    return ThrowException(Exception::TypeError(String::New("Bad parameter")));
  }

  String::Utf8Value key_pem(args[0]->ToString());

  BIO *bp = BIO_new(BIO_s_mem());

  if (!BIO_write(bp, *key_pem, key_pem.length())) {
    BIO_free(bp);
    return False();
  }

  EVP_PKEY* pkey = PEM_read_bio_PrivateKey(bp, NULL, NULL, NULL);

  if (pkey == NULL) {
    BIO_free(bp);
    return False();
  }

  SSL_CTX_use_PrivateKey(sc->ctx_, pkey);
  BIO_free(bp);
  // XXX Free pkey? 

  return True();
}


Handle<Value> SecureContext::SetCert(const Arguments& args) {
  HandleScope scope;

  SecureContext *sc = ObjectWrap::Unwrap<SecureContext>(args.Holder());

  if (args.Length() != 1 ||
      !args[0]->IsString()) {
    return ThrowException(Exception::TypeError(
          String::New("Bad parameter")));
  }
  String::Utf8Value cert_pem(args[0]->ToString());

  BIO *bp = BIO_new(BIO_s_mem());

  if (!BIO_write(bp, *cert_pem, cert_pem.length())) {
    BIO_free(bp);
    return False();
  }

  X509 * x509 = PEM_read_bio_X509(bp, NULL, NULL, NULL);

  if (x509 == NULL) {
    BIO_free(bp);
    return False();
  }

  SSL_CTX_use_certificate(sc->ctx_, x509);

  BIO_free(bp);
  X509_free(x509);

  return True();
}


Handle<Value> SecureContext::AddCACert(const Arguments& args) {
  HandleScope scope;

  SecureContext *sc = ObjectWrap::Unwrap<SecureContext>(args.Holder());

  if (args.Length() != 1 || !args[0]->IsString()) {
    return ThrowException(Exception::TypeError(String::New("Bad parameter")));
  }
  String::Utf8Value cert_pem(args[0]->ToString());

  BIO *bp = BIO_new(BIO_s_mem());

  if (!BIO_write(bp, *cert_pem, cert_pem.length())) {
    BIO_free(bp);
    return False();
  }

  X509 *x509 = PEM_read_bio_X509(bp, NULL, NULL, NULL);

  if (x509 == NULL) {
    BIO_free(bp);
    return False();
  }

  X509_STORE_add_cert(sc->ca_store_, x509);

  BIO_free(bp);
  X509_free(x509);

  return True();
}


Handle<Value> SecureContext::SetCiphers(const Arguments& args) {
  HandleScope scope;

  SecureContext *sc = ObjectWrap::Unwrap<SecureContext>(args.Holder());

  if (args.Length() != 1 || !args[0]->IsString()) {
    return ThrowException(Exception::TypeError(String::New("Bad parameter")));
  }

  String::Utf8Value ciphers(args[0]->ToString());
  SSL_CTX_set_cipher_list(sc->ctx_, *ciphers);

  return True();
}


Handle<Value> SecureContext::Close(const Arguments& args) {
  HandleScope scope;

  SecureContext *sc = ObjectWrap::Unwrap<SecureContext>(args.Holder());

  if (sc->ctx_ != NULL) {
    SSL_CTX_free(sc->ctx_);
    return True();
  }

  return False();
}

char ssl_error_buf[512];

static int serr(SSL *ssl, const char* func, int rv) {
  if (rv >= 0) {
    return rv;
  }

  int err = SSL_get_error(ssl, rv);
  if (err != SSL_ERROR_WANT_WRITE &&
      err != SSL_ERROR_WANT_READ) {
    ERR_error_string_n(ERR_get_error(), &ssl_error_buf[0], sizeof(ssl_error_buf));
    /* fprintf(stderr, "[%p] SSL: %s failed: (%d:%d) %s\n", ssl, func, err, rv, buf); */
    return rv;
  } else if (err == SSL_ERROR_WANT_WRITE) {
    /* fprintf(stderr, "[%p] SSL: %s want write\n", ssl, func); */
  } else if (err == SSL_ERROR_WANT_READ) {
    /* fprintf(stderr, "[%p] SSL: %s want read\n", ssl, func); */
  }

  return 0;
}

void SecureStream::Initialize(Handle<Object> target) {
  HandleScope scope;

  Local<FunctionTemplate> t = FunctionTemplate::New(SecureStream::New);
  t->InstanceTemplate()->SetInternalFieldCount(1);
  t->SetClassName(String::NewSymbol("SecureStream"));

  NODE_SET_PROTOTYPE_METHOD(t, "encIn", SecureStream::EncIn);
  NODE_SET_PROTOTYPE_METHOD(t, "clearOut", SecureStream::ClearOut);
  NODE_SET_PROTOTYPE_METHOD(t, "clearIn", SecureStream::ClearIn);
  NODE_SET_PROTOTYPE_METHOD(t, "encOut", SecureStream::EncOut);
  NODE_SET_PROTOTYPE_METHOD(t, "clearPending", SecureStream::ClearPending);
  NODE_SET_PROTOTYPE_METHOD(t, "encPending", SecureStream::EncPending);
  NODE_SET_PROTOTYPE_METHOD(t, "getPeerCertificate", SecureStream::GetPeerCertificate);
  NODE_SET_PROTOTYPE_METHOD(t, "isInitFinished", SecureStream::IsInitFinished);
  NODE_SET_PROTOTYPE_METHOD(t, "verifyPeer", SecureStream::VerifyPeer);
  NODE_SET_PROTOTYPE_METHOD(t, "getCurrentCipher", SecureStream::GetCurrentCipher);
  NODE_SET_PROTOTYPE_METHOD(t, "start", SecureStream::Start);
  NODE_SET_PROTOTYPE_METHOD(t, "shutdown", SecureStream::Shutdown);
  NODE_SET_PROTOTYPE_METHOD(t, "close", SecureStream::Close);

  target->Set(String::NewSymbol("SecureStream"), t->GetFunction());
}


Handle<Value> SecureStream::New(const Arguments& args) {
  HandleScope scope;

  SecureStream *p = new SecureStream();
  p->Wrap(args.Holder());

  if (args.Length() < 1 || !args[0]->IsObject()) {
    return ThrowException(Exception::Error(String::New(
      "First argument must be a crypto module Credentials")));
  }

  SecureContext *sc = ObjectWrap::Unwrap<SecureContext>(args[0]->ToObject());

  bool is_server = args[1]->BooleanValue();
  bool should_verify = args[2]->BooleanValue();

  p->ssl_ = SSL_new(sc->ctx_);
  p->bio_read_ = BIO_new(BIO_s_mem());
  p->bio_write_ = BIO_new(BIO_s_mem());
  SSL_set_bio(p->ssl_, p->bio_read_, p->bio_write_);

  if ((p->should_verify_ = should_verify)) {
    SSL_set_verify(p->ssl_, SSL_VERIFY_PEER, verify_callback);
  }

  if ((p->is_server_ = is_server)) {
    SSL_set_accept_state(p->ssl_);
  } else {
    SSL_set_connect_state(p->ssl_);
  }

  return args.This();
}


Handle<Value> SecureStream::EncIn(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());

  if (args.Length() < 3) {
    return ThrowException(Exception::TypeError(
          String::New("Takes 3 parameters")));
  }

  if (!Buffer::HasInstance(args[0])) {
    return ThrowException(Exception::TypeError(
          String::New("Second argument should be a buffer")));
  }

  Local<Object> buffer_obj = args[0]->ToObject();
  char *buffer_data = Buffer::Data(buffer_obj);
  size_t buffer_length = Buffer::Length(buffer_obj);

  size_t off = args[1]->Int32Value();
  if (off >= buffer_length) {
    return ThrowException(Exception::Error(
          String::New("Offset is out of bounds")));
  }

  size_t len = args[2]->Int32Value();
  if (off + len > buffer_length) {
    return ThrowException(Exception::Error(
          String::New("Length is extends beyond buffer")));
  }

  int bytes_written = serr(ss->ssl_, "BIO_write", BIO_write(ss->bio_read_, (char*)buffer_data + off, len));

  if (bytes_written < 0) {
    if (errno == EAGAIN || errno == EINTR) return Null();
    return ThrowException(ErrnoException(errno, "read"));
  }

  return scope.Close(Integer::New(bytes_written));
}


Handle<Value> SecureStream::ClearOut(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());

  if (args.Length() < 3) {
    return ThrowException(Exception::TypeError(
          String::New("Takes 3 parameters")));
  }

  if (!Buffer::HasInstance(args[0])) {
    return ThrowException(Exception::TypeError(
          String::New("Second argument should be a buffer")));
  }

  Local<Object> buffer_obj = args[0]->ToObject();
  char *buffer_data = Buffer::Data(buffer_obj);
  size_t buffer_length = Buffer::Length(buffer_obj);

  size_t off = args[1]->Int32Value();
  if (off >= buffer_length) {
    return ThrowException(Exception::Error(
          String::New("Offset is out of bounds")));
  }

  size_t len = args[2]->Int32Value();
  if (off + len > buffer_length) {
    return ThrowException(Exception::Error(
          String::New("Length is extends beyond buffer")));
  }

  int bytes_read;

  if (!SSL_is_init_finished(ss->ssl_)) {
    if (ss->is_server_) {
      bytes_read =  serr(ss->ssl_, "SSL_accept:ClearOut", SSL_accept(ss->ssl_));
    } else {
      bytes_read = serr(ss->ssl_, "SSL_connect:ClearOut", SSL_connect(ss->ssl_));
    }
    if (bytes_read < 0) {
      return ThrowException(Exception::Error(v8::String::New(ssl_error_buf)));
    }
    return scope.Close(Integer::New(0));
  }

  bytes_read = serr(ss->ssl_, "SSL_read:ClearOut", SSL_read(ss->ssl_, (char*)buffer_data + off, len));
  if (bytes_read < 0) {
    return ThrowException(Exception::Error(v8::String::New(ssl_error_buf)));
  }

  return scope.Close(Integer::New(bytes_read));
}


Handle<Value> SecureStream::ClearPending(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());
  int bytes_pending = BIO_pending(ss->bio_read_);
  return scope.Close(Integer::New(bytes_pending));
}


Handle<Value> SecureStream::EncPending(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());
  int bytes_pending = BIO_pending(ss->bio_write_);
  return scope.Close(Integer::New(bytes_pending));
}


Handle<Value> SecureStream::EncOut(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());

  if (args.Length() < 3) {
    return ThrowException(Exception::TypeError(
          String::New("Takes 3 parameters")));
  }

  if (!Buffer::HasInstance(args[0])) {
    return ThrowException(Exception::TypeError(
          String::New("Second argument should be a buffer")));
  }

  Local<Object> buffer_obj = args[0]->ToObject();
  char *buffer_data = Buffer::Data(buffer_obj);
  size_t buffer_length = Buffer::Length(buffer_obj);

  size_t off = args[1]->Int32Value();
  if (off >= buffer_length) {
    return ThrowException(Exception::Error(
          String::New("Offset is out of bounds")));
  }

  size_t len = args[2]->Int32Value();
  if (off + len > buffer_length) {
    return ThrowException(Exception::Error(
          String::New("Length is extends beyond buffer")));
  }

  int bytes_read = serr(ss->ssl_, "BIO_read:EncOut", BIO_read(ss->bio_write_, (char*)buffer_data + off, len));

  return scope.Close(Integer::New(bytes_read));
}


Handle<Value> SecureStream::ClearIn(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());

  if (args.Length() < 3) {
    return ThrowException(Exception::TypeError(
          String::New("Takes 3 parameters")));
  }

  if (!Buffer::HasInstance(args[0])) {
    return ThrowException(Exception::TypeError(
          String::New("Second argument should be a buffer")));
  }

  Local<Object> buffer_obj = args[0]->ToObject();
  char *buffer_data = Buffer::Data(buffer_obj);
  size_t buffer_length = Buffer::Length(buffer_obj);

  size_t off = args[1]->Int32Value();
  if (off >= buffer_length) {
    return ThrowException(Exception::Error(
          String::New("Offset is out of bounds")));
  }

  size_t len = args[2]->Int32Value();
  if (off + len > buffer_length) {
    return ThrowException(Exception::Error(
          String::New("Length is extends beyond buffer")));
  }

  if (!SSL_is_init_finished(ss->ssl_)) {
    int s;
    if (ss->is_server_) {
      s = serr(ss->ssl_, "SSL_accept:ClearIn", SSL_accept(ss->ssl_));
    } else {
      s = serr(ss->ssl_, "SSL_connect:ClearIn", SSL_connect(ss->ssl_));
    }

    if (s < 0) {
      return ThrowException(Exception::Error(v8::String::New(ssl_error_buf)));
    }

    return scope.Close(Integer::New(0));
  }

  int bytes_written = serr(ss->ssl_, "SSL_write:ClearIn", SSL_write(ss->ssl_, (char*)buffer_data + off, len));

  if (bytes_written < 0) {
    return ThrowException(Exception::Error(v8::String::New(ssl_error_buf)));
  }

  return scope.Close(Integer::New(bytes_written));
}


Handle<Value> SecureStream::GetPeerCertificate(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());

  if (ss->ssl_ == NULL) return Undefined();
  Local<Object> info = Object::New();
  X509* peer_cert = SSL_get_peer_certificate(ss->ssl_);
  if (peer_cert != NULL) {
    char* subject = X509_NAME_oneline(X509_get_subject_name(peer_cert), 0, 0);
    if (subject != NULL) {
      info->Set(subject_symbol, String::New(subject));
      OPENSSL_free(subject);
    }
    char* issuer = X509_NAME_oneline(X509_get_issuer_name(peer_cert), 0, 0);
    if (subject != NULL) {
      info->Set(issuer_symbol, String::New(issuer));
      OPENSSL_free(issuer);
    }
    char buf[256];
    BIO* bio = BIO_new(BIO_s_mem());
    ASN1_TIME_print(bio, X509_get_notBefore(peer_cert));
    memset(buf, 0, sizeof(buf));
    BIO_read(bio, buf, sizeof(buf) - 1);
    info->Set(valid_from_symbol, String::New(buf));
    ASN1_TIME_print(bio, X509_get_notAfter(peer_cert));
    memset(buf, 0, sizeof(buf));
    BIO_read(bio, buf, sizeof(buf) - 1);
    BIO_free(bio);
    info->Set(valid_to_symbol, String::New(buf));

    unsigned int md_size, i;
    unsigned char md[EVP_MAX_MD_SIZE];
    if (X509_digest(peer_cert, EVP_sha1(), md, &md_size)) {
      const char hex[] = "0123456789ABCDEF";
      char fingerprint[EVP_MAX_MD_SIZE * 3];

      for (i=0; i<md_size; i++) {
        fingerprint[3*i] = hex[(md[i] & 0xf0) >> 4];
        fingerprint[(3*i)+1] = hex[(md[i] & 0x0f)];
        fingerprint[(3*i)+2] = ':';
      }

      if (md_size > 0) {
        fingerprint[(3*(md_size-1))+2] = '\0';
      }
      else {
        fingerprint[0] = '\0';
      }

      info->Set(fingerprint_symbol, String::New(fingerprint));
    }

    X509_free(peer_cert);
  }
  return scope.Close(info);
}

Handle<Value> SecureStream::Start(const Arguments& args) {
  HandleScope scope;
  int rv;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());

  if (!SSL_is_init_finished(ss->ssl_)) {
    if (ss->is_server_) {
      rv = serr(ss->ssl_, "SSL_accept:Start", SSL_accept(ss->ssl_));
    } else {
      rv = serr(ss->ssl_, "SSL_connect:Start", SSL_connect(ss->ssl_));
    }

    if (rv < 0) {
      return ThrowException(Exception::Error(v8::String::New(ssl_error_buf)));
    }

    if (rv == 1) {
      return True();
    } else {
      return False();
    }
  }

  return True();
}

Handle<Value> SecureStream::Shutdown(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());

  if (ss->ssl_ == NULL) return False();
  if (SSL_shutdown(ss->ssl_) == 1) {
    return True();
  }
  return False();
}


Handle<Value> SecureStream::IsInitFinished(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());

  if (ss->ssl_ == NULL) return False();
  if (SSL_is_init_finished(ss->ssl_)) {
    return True();
  }
  return False();
}


Handle<Value> SecureStream::VerifyPeer(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());

  if (ss->ssl_ == NULL) return False();
  if (!ss->should_verify_) return False();
  X509* peer_cert = SSL_get_peer_certificate(ss->ssl_);
  if (peer_cert==NULL) return False();
  X509_free(peer_cert);

  long x509_verify_error = SSL_get_verify_result(ss->ssl_);

  // Can also check for:
  // X509_V_ERR_CERT_HAS_EXPIRED
  // X509_V_ERR_DEPTH_ZERO_SELF_SIGNED_CERT
  // X509_V_ERR_SELF_SIGNED_CERT_IN_CHAIN
  // X509_V_ERR_INVALID_CA
  // X509_V_ERR_PATH_LENGTH_EXCEEDED
  // X509_V_ERR_INVALID_PURPOSE
  // X509_V_ERR_DEPTH_ZERO_SELF_SIGNED_CERT

  // printf("%s\n", X509_verify_cert_error_string(x509_verify_error));

  if (!x509_verify_error) return True();
  return False();
}


Handle<Value> SecureStream::GetCurrentCipher(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());
  OPENSSL_CONST SSL_CIPHER *c;

  if ( ss->ssl_ == NULL ) return Undefined();
  c = SSL_get_current_cipher(ss->ssl_);
  if ( c == NULL ) return Undefined();
  Local<Object> info = Object::New();
  const char *cipher_name = SSL_CIPHER_get_name(c);
  info->Set(name_symbol, String::New(cipher_name));
  const char *cipher_version = SSL_CIPHER_get_version(c);
  info->Set(version_symbol, String::New(cipher_version));
  return scope.Close(info);
}

Handle<Value> SecureStream::Close(const Arguments& args) {
  HandleScope scope;

  SecureStream *ss = ObjectWrap::Unwrap<SecureStream>(args.Holder());

  if (ss->ssl_ != NULL) {
    SSL_free(ss->ssl_);
    ss->ssl_ = NULL;
  }
  return True();
}


static void HexEncode(unsigned char *md_value,
                      int md_len,
                      char** md_hexdigest,
                      int* md_hex_len) {
  *md_hex_len = (2*(md_len));
  *md_hexdigest = new char[*md_hex_len + 1];
  for (int i = 0; i < md_len; i++) {
    snprintf((char *)(*md_hexdigest + (i*2)), 3, "%02x",  md_value[i]);
  }
}

#define hex2i(c) ((c) <= '9' ? ((c) - '0') : (c) <= 'Z' ? ((c) - 'A' + 10) \
                 : ((c) - 'a' + 10))

static void HexDecode(unsigned char *input,
                      int length,
                      char** buf64,
                      int* buf64_len) {
  *buf64_len = (length/2);
  *buf64 = new char[length/2 + 1];
  char *b = *buf64;
  for(int i = 0; i < length-1; i+=2) {
    b[i/2]  = (hex2i(input[i])<<4) | (hex2i(input[i+1]));
  }
}


void base64(unsigned char *input, int length, char** buf64, int* buf64_len) {
  BIO *b64 = BIO_new(BIO_f_base64());
  BIO *bmem = BIO_new(BIO_s_mem());
  b64 = BIO_push(b64, bmem);
  BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
  int len = BIO_write(b64, input, length);
  assert(len == length);
  int r = BIO_flush(b64);
  assert(r == 1);

  BUF_MEM *bptr;
  BIO_get_mem_ptr(b64, &bptr);

  *buf64_len = bptr->length;
  *buf64 = new char[*buf64_len+1];
  memcpy(*buf64, bptr->data, *buf64_len);
  char* b = *buf64;
  b[*buf64_len] = 0;

  BIO_free_all(b64);
}


void unbase64(unsigned char *input,
               int length,
               char** buffer,
               int* buffer_len) {
  BIO *b64, *bmem;
  *buffer = new char[length];
  memset(*buffer, 0, length);

  b64 = BIO_new(BIO_f_base64());
  BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
  bmem = BIO_new_mem_buf(input, length);
  bmem = BIO_push(b64, bmem);

  *buffer_len = BIO_read(bmem, *buffer, length);
  BIO_free_all(bmem);
}


// LengthWithoutIncompleteUtf8 from V8 d8-posix.cc
// see http://v8.googlecode.com/svn/trunk/src/d8-posix.cc
static int LengthWithoutIncompleteUtf8(char* buffer, int len) {
  int answer = len;
  // 1-byte encoding.
  static const int kUtf8SingleByteMask = 0x80;
  static const int kUtf8SingleByteValue = 0x00;
  // 2-byte encoding.
  static const int kUtf8TwoByteMask = 0xe0;
  static const int kUtf8TwoByteValue = 0xc0;
  // 3-byte encoding.
  static const int kUtf8ThreeByteMask = 0xf0;
  static const int kUtf8ThreeByteValue = 0xe0;
  // 4-byte encoding.
  static const int kUtf8FourByteMask = 0xf8;
  static const int kUtf8FourByteValue = 0xf0;
  // Subsequent bytes of a multi-byte encoding.
  static const int kMultiByteMask = 0xc0;
  static const int kMultiByteValue = 0x80;
  int multi_byte_bytes_seen = 0;
  while (answer > 0) {
    int c = buffer[answer - 1];
    // Ends in valid single-byte sequence?
    if ((c & kUtf8SingleByteMask) == kUtf8SingleByteValue) return answer;
    // Ends in one or more subsequent bytes of a multi-byte value?
    if ((c & kMultiByteMask) == kMultiByteValue) {
      multi_byte_bytes_seen++;
      answer--;
    } else {
      if ((c & kUtf8TwoByteMask) == kUtf8TwoByteValue) {
        if (multi_byte_bytes_seen >= 1) {
          return answer + 2;
        }
        return answer - 1;
      } else if ((c & kUtf8ThreeByteMask) == kUtf8ThreeByteValue) {
        if (multi_byte_bytes_seen >= 2) {
          return answer + 3;
        }
        return answer - 1;
      } else if ((c & kUtf8FourByteMask) == kUtf8FourByteValue) {
        if (multi_byte_bytes_seen >= 3) {
          return answer + 4;
        }
        return answer - 1;
      } else {
        return answer;  // Malformed UTF-8.
      }
    }
  }
  return 0;
}


// local decrypt final without strict padding check
// to work with php mcrypt
// see http://www.mail-archive.com/openssl-dev@openssl.org/msg19927.html
int local_EVP_DecryptFinal_ex(EVP_CIPHER_CTX *ctx,
                              unsigned char *out,
                              int *outl) {
  int i,b;
  int n;

  *outl=0;
  b=ctx->cipher->block_size;

  if (ctx->flags & EVP_CIPH_NO_PADDING) {
    if(ctx->buf_len) {
      EVPerr(EVP_F_EVP_DECRYPTFINAL,EVP_R_DATA_NOT_MULTIPLE_OF_BLOCK_LENGTH);
      return 0;
    }
    *outl = 0;
    return 1;
  }

  if (b > 1) {
    if (ctx->buf_len || !ctx->final_used) {
      EVPerr(EVP_F_EVP_DECRYPTFINAL,EVP_R_WRONG_FINAL_BLOCK_LENGTH);
      return(0);
    }

    if (b > (int)(sizeof(ctx->final) / sizeof(ctx->final[0]))) {
      EVPerr(EVP_F_EVP_DECRYPTFINAL,EVP_R_BAD_DECRYPT);
      return(0);
    }

    n=ctx->final[b-1];

    if (n > b) {
      EVPerr(EVP_F_EVP_DECRYPTFINAL,EVP_R_BAD_DECRYPT);
      return(0);
    }

    for (i=0; i<n; i++) {
      if (ctx->final[--b] != n) {
        EVPerr(EVP_F_EVP_DECRYPTFINAL,EVP_R_BAD_DECRYPT);
        return(0);
      }
    }

    n=ctx->cipher->block_size-n;

    for (i=0; i<n; i++) {
      out[i]=ctx->final[i];
    }
    *outl=n;
  } else {
    *outl=0;
  }

  return(1);
}


class Cipher : public ObjectWrap {
 public:
  static void Initialize (v8::Handle<v8::Object> target) {
    HandleScope scope;

    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    t->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_PROTOTYPE_METHOD(t, "init", CipherInit);
    NODE_SET_PROTOTYPE_METHOD(t, "initiv", CipherInitIv);
    NODE_SET_PROTOTYPE_METHOD(t, "update", CipherUpdate);
    NODE_SET_PROTOTYPE_METHOD(t, "final", CipherFinal);

    target->Set(String::NewSymbol("Cipher"), t->GetFunction());
  }


  bool CipherInit(char* cipherType, char* key_buf, int key_buf_len) {
    cipher = EVP_get_cipherbyname(cipherType);
    if(!cipher) {
      fprintf(stderr, "node-crypto : Unknown cipher %s\n", cipherType);
      return false;
    }

    unsigned char key[EVP_MAX_KEY_LENGTH],iv[EVP_MAX_IV_LENGTH];
    int key_len = EVP_BytesToKey(cipher, EVP_md5(), NULL, (unsigned char*) key_buf, key_buf_len, 1, key, iv);

    EVP_CIPHER_CTX_init(&ctx);
    EVP_CipherInit(&ctx,cipher,(unsigned char *)key,(unsigned char *)iv, true);
    if (!EVP_CIPHER_CTX_set_key_length(&ctx,key_len)) {
    	fprintf(stderr, "node-crypto : Invalid key length %d\n", key_len);
    	EVP_CIPHER_CTX_cleanup(&ctx);
    	return false;
    }
    initialised_ = true;
    return true;
  }


  bool CipherInitIv(char* cipherType,
                    char* key,
                    int key_len,
                    char *iv,
                    int iv_len) {
    cipher = EVP_get_cipherbyname(cipherType);
    if(!cipher) {
      fprintf(stderr, "node-crypto : Unknown cipher %s\n", cipherType);
      return false;
    }
    if (EVP_CIPHER_iv_length(cipher)!=iv_len) {
    	fprintf(stderr, "node-crypto : Invalid IV length %d\n", iv_len);
      return false;
    }
    EVP_CIPHER_CTX_init(&ctx);
    EVP_CipherInit(&ctx,cipher,(unsigned char *)key,(unsigned char *)iv, true);
    if (!EVP_CIPHER_CTX_set_key_length(&ctx,key_len)) {
    	fprintf(stderr, "node-crypto : Invalid key length %d\n", key_len);
    	EVP_CIPHER_CTX_cleanup(&ctx);
    	return false;
    }
    initialised_ = true;
    return true;
  }


  int CipherUpdate(char* data, int len, unsigned char** out, int* out_len) {
    if (!initialised_) return 0;
    *out_len=len+EVP_CIPHER_CTX_block_size(&ctx);
    *out= new unsigned char[*out_len];

    EVP_CipherUpdate(&ctx, *out, out_len, (unsigned char*)data, len);
    return 1;
  }

  int CipherFinal(unsigned char** out, int *out_len) {
    if (!initialised_) return 0;
    *out = new unsigned char[EVP_CIPHER_CTX_block_size(&ctx)];
    EVP_CipherFinal(&ctx,*out,out_len);
    EVP_CIPHER_CTX_cleanup(&ctx);
    initialised_ = false;
    return 1;
  }


 protected:

  static Handle<Value> New (const Arguments& args) {
    HandleScope scope;

    Cipher *cipher = new Cipher();
    cipher->Wrap(args.This());
    return args.This();
  }

  static Handle<Value> CipherInit(const Arguments& args) {
    HandleScope scope;

    Cipher *cipher = ObjectWrap::Unwrap<Cipher>(args.This());

    cipher->incomplete_base64=NULL;

    if (args.Length() <= 1 || !args[0]->IsString() || !args[1]->IsString()) {
      return ThrowException(Exception::Error(String::New(
        "Must give cipher-type, key")));
    }

    ssize_t key_buf_len = DecodeBytes(args[1], BINARY);

    if (key_buf_len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    char* key_buf = new char[key_buf_len];
    ssize_t key_written = DecodeWrite(key_buf, key_buf_len, args[1], BINARY);
    assert(key_written == key_buf_len);

    String::Utf8Value cipherType(args[0]->ToString());

    bool r = cipher->CipherInit(*cipherType, key_buf, key_buf_len);

    delete [] key_buf;

    if (!r) {
      return ThrowException(Exception::Error(String::New("CipherInit error")));
    }

    return args.This();
  }


  static Handle<Value> CipherInitIv(const Arguments& args) {
    Cipher *cipher = ObjectWrap::Unwrap<Cipher>(args.This());
		
    HandleScope scope;

    cipher->incomplete_base64=NULL;

    if (args.Length() <= 2 || !args[0]->IsString() || !args[1]->IsString() || !args[2]->IsString()) {
      return ThrowException(Exception::Error(String::New(
        "Must give cipher-type, key, and iv as argument")));
    }
    ssize_t key_len = DecodeBytes(args[1], BINARY);

    if (key_len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    ssize_t iv_len = DecodeBytes(args[2], BINARY);

    if (iv_len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    char* key_buf = new char[key_len];
    ssize_t key_written = DecodeWrite(key_buf, key_len, args[1], BINARY);
    assert(key_written == key_len);

    char* iv_buf = new char[iv_len];
    ssize_t iv_written = DecodeWrite(iv_buf, iv_len, args[2], BINARY);
    assert(iv_written == iv_len);

    String::Utf8Value cipherType(args[0]->ToString());
    	
    bool r = cipher->CipherInitIv(*cipherType, key_buf,key_len,iv_buf,iv_len);

    delete [] key_buf;
    delete [] iv_buf;

    if (!r) {
      return ThrowException(Exception::Error(String::New("CipherInitIv error")));
    }

    return args.This();
  }


  static Handle<Value> CipherUpdate(const Arguments& args) {
    Cipher *cipher = ObjectWrap::Unwrap<Cipher>(args.This());

    HandleScope scope;

    enum encoding enc = ParseEncoding(args[1]);
    ssize_t len = DecodeBytes(args[0], enc);

    if (len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    unsigned char *out=0;
    int out_len=0, r;
    if (Buffer::HasInstance(args[0])) {
      Local<Object> buffer_obj = args[0]->ToObject();
      char *buffer_data = Buffer::Data(buffer_obj);
      size_t buffer_length = Buffer::Length(buffer_obj);

      r = cipher->CipherUpdate(buffer_data, buffer_length, &out, &out_len);
    } else {
      char* buf = new char[len];
      ssize_t written = DecodeWrite(buf, len, args[0], enc);
      assert(written == len);
      r = cipher->CipherUpdate(buf, len,&out,&out_len);
      delete [] buf;
    }

    if (!r) {
      delete [] out;
      Local<Value> exception = Exception::TypeError(String::New("DecipherUpdate fail"));
      return ThrowException(exception);
    }

    Local<Value> outString;
    if (out_len==0) {
      outString=String::New("");
    } else {
    	if (args.Length() <= 2 || !args[2]->IsString()) {
	      // Binary
	      outString = Encode(out, out_len, BINARY);
	    } else {
	      char* out_hexdigest;
	      int out_hex_len;
	      String::Utf8Value encoding(args[2]->ToString());
	      if (strcasecmp(*encoding, "hex") == 0) {
	        // Hex encoding
	        HexEncode(out, out_len, &out_hexdigest, &out_hex_len);
	        outString = Encode(out_hexdigest, out_hex_len, BINARY);
	        delete [] out_hexdigest;
	      } else if (strcasecmp(*encoding, "base64") == 0) {
          // Base64 encoding
          // Check to see if we need to add in previous base64 overhang
          if (cipher->incomplete_base64!=NULL){
            unsigned char* complete_base64 = new unsigned char[out_len+cipher->incomplete_base64_len+1];
            memcpy(complete_base64, cipher->incomplete_base64, cipher->incomplete_base64_len);
            memcpy(&complete_base64[cipher->incomplete_base64_len], out, out_len);
            delete [] out;

            delete [] cipher->incomplete_base64;
            cipher->incomplete_base64=NULL;

            out=complete_base64;
            out_len += cipher->incomplete_base64_len;
          }

          // Check to see if we need to trim base64 stream
          if (out_len%3!=0){
            cipher->incomplete_base64_len = out_len%3;
            cipher->incomplete_base64 = new char[cipher->incomplete_base64_len+1];
            memcpy(cipher->incomplete_base64,
                   &out[out_len-cipher->incomplete_base64_len],
                   cipher->incomplete_base64_len);
            out_len -= cipher->incomplete_base64_len;
            out[out_len]=0;
          }

	        base64(out, out_len, &out_hexdigest, &out_hex_len);
	        outString = Encode(out_hexdigest, out_hex_len, BINARY);
	        delete [] out_hexdigest;
	      } else if (strcasecmp(*encoding, "binary") == 0) {
	        outString = Encode(out, out_len, BINARY);
	      } else {
          fprintf(stderr, "node-crypto : Cipher .update encoding "
                          "can be binary, hex or base64\n");
	      }
	    }
    }

    if (out) delete [] out;

    return scope.Close(outString);
  }

  static Handle<Value> CipherFinal(const Arguments& args) {
    Cipher *cipher = ObjectWrap::Unwrap<Cipher>(args.This());

    HandleScope scope;

    unsigned char* out_value;
    int out_len;
    char* out_hexdigest;
    int out_hex_len;
    Local<Value> outString ;

    int r = cipher->CipherFinal(&out_value, &out_len);

    if (out_len == 0 || r == 0) {
      return scope.Close(String::New(""));
    }

    if (args.Length() == 0 || !args[0]->IsString()) {
      // Binary
      outString = Encode(out_value, out_len, BINARY);
    } else {
      String::Utf8Value encoding(args[0]->ToString());
      if (strcasecmp(*encoding, "hex") == 0) {
        // Hex encoding
        HexEncode(out_value, out_len, &out_hexdigest, &out_hex_len);
        outString = Encode(out_hexdigest, out_hex_len, BINARY);
        delete [] out_hexdigest;
      } else if (strcasecmp(*encoding, "base64") == 0) {
        base64(out_value, out_len, &out_hexdigest, &out_hex_len);
        outString = Encode(out_hexdigest, out_hex_len, BINARY);
        delete [] out_hexdigest;
      } else if (strcasecmp(*encoding, "binary") == 0) {
        outString = Encode(out_value, out_len, BINARY);
      } else {
        fprintf(stderr, "node-crypto : Cipher .final encoding "
                        "can be binary, hex or base64\n");
      }
    }
    delete [] out_value;
    return scope.Close(outString);
  }

  Cipher () : ObjectWrap ()
  {
    initialised_ = false;
  }

  ~Cipher ()
  {
  }

 private:

  EVP_CIPHER_CTX ctx; /* coverity[member_decl] */
  const EVP_CIPHER *cipher; /* coverity[member_decl] */
  bool initialised_;
  char* incomplete_base64; /* coverity[member_decl] */
  int incomplete_base64_len; /* coverity[member_decl] */

};



class Decipher : public ObjectWrap {
 public:
  static void
  Initialize (v8::Handle<v8::Object> target)
  {
    HandleScope scope;

    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    t->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_PROTOTYPE_METHOD(t, "init", DecipherInit);
    NODE_SET_PROTOTYPE_METHOD(t, "initiv", DecipherInitIv);
    NODE_SET_PROTOTYPE_METHOD(t, "update", DecipherUpdate);
    NODE_SET_PROTOTYPE_METHOD(t, "final", DecipherFinal);
    NODE_SET_PROTOTYPE_METHOD(t, "finaltol", DecipherFinalTolerate);

    target->Set(String::NewSymbol("Decipher"), t->GetFunction());
  }

  bool DecipherInit(char* cipherType, char* key_buf, int key_buf_len) {
    cipher_ = EVP_get_cipherbyname(cipherType);

    if(!cipher_) {
      fprintf(stderr, "node-crypto : Unknown cipher %s\n", cipherType);
      return false;
    }

    unsigned char key[EVP_MAX_KEY_LENGTH],iv[EVP_MAX_IV_LENGTH];
    int key_len = EVP_BytesToKey(cipher_,
                                 EVP_md5(),
                                 NULL,
                                 (unsigned char*)(key_buf),
                                 key_buf_len,
                                 1,
                                 key,
                                 iv);

    EVP_CIPHER_CTX_init(&ctx);
    EVP_CipherInit(&ctx,
                   cipher_,
                   (unsigned char*)(key),
                   (unsigned char *)(iv),
                   false);
    if (!EVP_CIPHER_CTX_set_key_length(&ctx,key_len)) {
    	fprintf(stderr, "node-crypto : Invalid key length %d\n", key_len);
    	EVP_CIPHER_CTX_cleanup(&ctx);
    	return false;
    }
    initialised_ = true;
    return true;
  }


  bool DecipherInitIv(char* cipherType,
                      char* key,
                      int key_len,
                      char *iv,
                      int iv_len) {
    cipher_ = EVP_get_cipherbyname(cipherType);
    if(!cipher_) {
      fprintf(stderr, "node-crypto : Unknown cipher %s\n", cipherType);
      return false;
    }
    if (EVP_CIPHER_iv_length(cipher_) != iv_len) {
    	fprintf(stderr, "node-crypto : Invalid IV length %d\n", iv_len);
      return false;
    }
    EVP_CIPHER_CTX_init(&ctx);
    EVP_CipherInit(&ctx,
                   cipher_,
                   (unsigned char*)(key),
                   (unsigned char *)(iv),
                   false);
    if (!EVP_CIPHER_CTX_set_key_length(&ctx,key_len)) {
    	fprintf(stderr, "node-crypto : Invalid key length %d\n", key_len);
    	EVP_CIPHER_CTX_cleanup(&ctx);
    	return false;
    }
    initialised_ = true;
    return true;
  }

  int DecipherUpdate(char* data, int len, unsigned char** out, int* out_len) {
    if (!initialised_) return 0;
    *out_len=len+EVP_CIPHER_CTX_block_size(&ctx);
    *out= new unsigned char[*out_len];

    EVP_CipherUpdate(&ctx, *out, out_len, (unsigned char*)data, len);
    return 1;
  }

  // coverity[alloc_arg]
  int DecipherFinal(unsigned char** out, int *out_len, bool tolerate_padding) {
    if (!initialised_) return 0;
    *out = new unsigned char[EVP_CIPHER_CTX_block_size(&ctx)];
    if (tolerate_padding) {
      local_EVP_DecryptFinal_ex(&ctx,*out,out_len);
    } else {
      EVP_CipherFinal(&ctx,*out,out_len);
    }
    EVP_CIPHER_CTX_cleanup(&ctx);
    initialised_ = false;
    return 1;
  }


 protected:

  static Handle<Value> New (const Arguments& args) {
    HandleScope scope;

    Decipher *cipher = new Decipher();
    cipher->Wrap(args.This());
    return args.This();
  }

  static Handle<Value> DecipherInit(const Arguments& args) {
    Decipher *cipher = ObjectWrap::Unwrap<Decipher>(args.This());
		
    HandleScope scope;

    cipher->incomplete_utf8=NULL;
    cipher->incomplete_hex_flag=false;

    if (args.Length() <= 1 || !args[0]->IsString() || !args[1]->IsString()) {
      return ThrowException(Exception::Error(String::New(
        "Must give cipher-type, key as argument")));
    }

    ssize_t key_len = DecodeBytes(args[1], BINARY);

    if (key_len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    char* key_buf = new char[key_len];
    ssize_t key_written = DecodeWrite(key_buf, key_len, args[1], BINARY);
    assert(key_written == key_len);

    String::Utf8Value cipherType(args[0]->ToString());
    	
    bool r = cipher->DecipherInit(*cipherType, key_buf,key_len);

    delete [] key_buf;

    if (!r) {
      return ThrowException(Exception::Error(String::New("DecipherInit error")));
    }

    return args.This();
  }

  static Handle<Value> DecipherInitIv(const Arguments& args) {
    Decipher *cipher = ObjectWrap::Unwrap<Decipher>(args.This());
		
    HandleScope scope;

    cipher->incomplete_utf8=NULL;
    cipher->incomplete_hex_flag=false;

    if (args.Length() <= 2 || !args[0]->IsString() || !args[1]->IsString() || !args[2]->IsString()) {
      return ThrowException(Exception::Error(String::New(
        "Must give cipher-type, key, and iv as argument")));
    }

    ssize_t key_len = DecodeBytes(args[1], BINARY);

    if (key_len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    ssize_t iv_len = DecodeBytes(args[2], BINARY);

    if (iv_len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    char* key_buf = new char[key_len];
    ssize_t key_written = DecodeWrite(key_buf, key_len, args[1], BINARY);
    assert(key_written == key_len);

    char* iv_buf = new char[iv_len];
    ssize_t iv_written = DecodeWrite(iv_buf, iv_len, args[2], BINARY);
    assert(iv_written == iv_len);

    String::Utf8Value cipherType(args[0]->ToString());
    	
    bool r = cipher->DecipherInitIv(*cipherType, key_buf,key_len,iv_buf,iv_len);

    delete [] key_buf;
    delete [] iv_buf;

    if (!r) {
      return ThrowException(Exception::Error(String::New("DecipherInitIv error")));
    }

    return args.This();
  }

  static Handle<Value> DecipherUpdate(const Arguments& args) {
    HandleScope scope;

    Decipher *cipher = ObjectWrap::Unwrap<Decipher>(args.This());

    ssize_t len = DecodeBytes(args[0], BINARY);
    if (len < 0) {
        return ThrowException(Exception::Error(String::New(
            "node`DecodeBytes() failed")));
    }

    char* buf;
    // if alloc_buf then buf must be deleted later
    bool alloc_buf = false;
    if (Buffer::HasInstance(args[0])) {
      Local<Object> buffer_obj = args[0]->ToObject();
      char *buffer_data = Buffer::Data(buffer_obj);
      size_t buffer_length = Buffer::Length(buffer_obj);

      buf = buffer_data;
      len = buffer_length;
    } else {
      alloc_buf = true;
      buf = new char[len];
      ssize_t written = DecodeWrite(buf, len, args[0], BINARY);
      assert(written == len);
    }

    char* ciphertext;
    int ciphertext_len;

    if (args.Length() <= 1 || !args[1]->IsString()) {
      // Binary - do nothing
    } else {
      String::Utf8Value encoding(args[1]->ToString());
      if (strcasecmp(*encoding, "hex") == 0) {
        // Hex encoding
        // Do we have a previous hex carry over?
        if (cipher->incomplete_hex_flag) {
          char* complete_hex = new char[len+2];
          memcpy(complete_hex, &cipher->incomplete_hex, 1);
          memcpy(complete_hex+1, buf, len);
          if (alloc_buf) {
            delete [] buf;
            alloc_buf = false;
          }
          buf = complete_hex;
          len += 1;
        }
        // Do we have an incomplete hex stream?
        if ((len>0) && (len % 2 !=0)) {
          len--;
          cipher->incomplete_hex=buf[len];
          cipher->incomplete_hex_flag=true;
          buf[len]=0;
        }
        HexDecode((unsigned char*)buf, len, (char **)&ciphertext, &ciphertext_len);

        if (alloc_buf) {
          delete [] buf;
          alloc_buf = false;
        }
        buf = ciphertext;
        len = ciphertext_len;

      } else if (strcasecmp(*encoding, "base64") == 0) {
        unbase64((unsigned char*)buf, len, (char **)&ciphertext, &ciphertext_len);
        if (alloc_buf) {
          delete [] buf;
          alloc_buf = false;
        }
        buf = ciphertext;
        len = ciphertext_len;

      } else if (strcasecmp(*encoding, "binary") == 0) {
        // Binary - do nothing

      } else {
        fprintf(stderr, "node-crypto : Decipher .update encoding "
                        "can be binary, hex or base64\n");
      }
    }

    unsigned char *out=0;
    int out_len=0;
    int r = cipher->DecipherUpdate(buf, len, &out, &out_len);

    if (!r) {
      delete [] out;
      Local<Value> exception = Exception::TypeError(String::New("DecipherUpdate fail"));
      return ThrowException(exception);
    }

    Local<Value> outString;
    if (out_len==0) {
      outString=String::New("");
    } else if (args.Length() <= 2 || !args[2]->IsString()) {
      outString = Encode(out, out_len, BINARY);
    } else {
      enum encoding enc = ParseEncoding(args[2]);
      if (enc == UTF8) {
        // See if we have any overhang from last utf8 partial ending
        if (cipher->incomplete_utf8!=NULL) {
          char* complete_out = new char[cipher->incomplete_utf8_len + out_len];
          memcpy(complete_out, cipher->incomplete_utf8, cipher->incomplete_utf8_len);
          memcpy((char *)complete_out+cipher->incomplete_utf8_len, out, out_len);
          delete [] out;

          delete [] cipher->incomplete_utf8;
          cipher->incomplete_utf8 = NULL;

          out = (unsigned char*)complete_out;
          out_len += cipher->incomplete_utf8_len;
        }
        // Check to see if we have a complete utf8 stream
        int utf8_len = LengthWithoutIncompleteUtf8((char *)out, out_len);
        if (utf8_len<out_len) { // We have an incomplete ut8 ending
          cipher->incomplete_utf8_len = out_len-utf8_len;
          cipher->incomplete_utf8 = new unsigned char[cipher->incomplete_utf8_len+1];
          memcpy(cipher->incomplete_utf8, &out[utf8_len], cipher->incomplete_utf8_len);
        }
        outString = Encode(out, utf8_len, enc);
      } else {
        outString = Encode(out, out_len, enc);
      }
    }

    if (out) delete [] out;

    if (alloc_buf) delete [] buf;
    return scope.Close(outString);

  }

  static Handle<Value> DecipherFinal(const Arguments& args) {
    HandleScope scope;

    Decipher *cipher = ObjectWrap::Unwrap<Decipher>(args.This());

    unsigned char* out_value;
    int out_len;
    Local<Value> outString;

    int r = cipher->DecipherFinal(&out_value, &out_len, false);

    if (out_len == 0 || r == 0) {
      return scope.Close(String::New(""));
    }


    if (args.Length() == 0 || !args[0]->IsString()) {
      outString = Encode(out_value, out_len, BINARY);
    } else {
      enum encoding enc = ParseEncoding(args[0]);
      if (enc == UTF8) {
        // See if we have any overhang from last utf8 partial ending
        if (cipher->incomplete_utf8!=NULL) {
          char* complete_out = new char[cipher->incomplete_utf8_len + out_len];
          memcpy(complete_out, cipher->incomplete_utf8, cipher->incomplete_utf8_len);
          memcpy((char *)complete_out+cipher->incomplete_utf8_len, out_value, out_len);

          delete [] cipher->incomplete_utf8;
          cipher->incomplete_utf8=NULL;

          outString = Encode(complete_out, cipher->incomplete_utf8_len+out_len, enc);
          delete [] complete_out;
        } else {
          outString = Encode(out_value, out_len, enc);
        }
      } else {
        outString = Encode(out_value, out_len, enc);
      }
    }
    delete [] out_value;
    return scope.Close(outString);
  }

  static Handle<Value> DecipherFinalTolerate(const Arguments& args) {
    Decipher *cipher = ObjectWrap::Unwrap<Decipher>(args.This());

    HandleScope scope;

    unsigned char* out_value;
    int out_len;
    Local<Value> outString ;

    int r = cipher->DecipherFinal(&out_value, &out_len, true);

    if (out_len == 0 || r == 0) {
      delete [] out_value;
      return scope.Close(String::New(""));
    }


    if (args.Length() == 0 || !args[0]->IsString()) {
      outString = Encode(out_value, out_len, BINARY);
    } else {
      enum encoding enc = ParseEncoding(args[0]);
      if (enc == UTF8) {
        // See if we have any overhang from last utf8 partial ending
        if (cipher->incomplete_utf8!=NULL) {
          char* complete_out = new char[cipher->incomplete_utf8_len + out_len];
          memcpy(complete_out, cipher->incomplete_utf8, cipher->incomplete_utf8_len);
          memcpy((char *)complete_out+cipher->incomplete_utf8_len, out_value, out_len);

          delete [] cipher->incomplete_utf8;
          cipher->incomplete_utf8 = NULL;

          outString = Encode(complete_out, cipher->incomplete_utf8_len+out_len, enc);
          delete [] complete_out;
        } else {
          outString = Encode(out_value, out_len, enc);
        }
      } else {
        outString = Encode(out_value, out_len, enc);
      }
    }
    delete [] out_value;
    return scope.Close(outString);
  }

  Decipher () : ObjectWrap () {
    initialised_ = false;
  }

  ~Decipher () { }

 private:

  EVP_CIPHER_CTX ctx;
  const EVP_CIPHER *cipher_;
  bool initialised_;
  unsigned char* incomplete_utf8;
  int incomplete_utf8_len;
  char incomplete_hex;
  bool incomplete_hex_flag;
};




class Hmac : public ObjectWrap {
 public:
  static void Initialize (v8::Handle<v8::Object> target) {
    HandleScope scope;

    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    t->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_PROTOTYPE_METHOD(t, "init", HmacInit);
    NODE_SET_PROTOTYPE_METHOD(t, "update", HmacUpdate);
    NODE_SET_PROTOTYPE_METHOD(t, "digest", HmacDigest);

    target->Set(String::NewSymbol("Hmac"), t->GetFunction());
  }

  bool HmacInit(char* hashType, char* key, int key_len) {
    md = EVP_get_digestbyname(hashType);
    if(!md) {
      fprintf(stderr, "node-crypto : Unknown message digest %s\n", hashType);
      return false;
    }
    HMAC_CTX_init(&ctx);
    HMAC_Init(&ctx, key, key_len, md);
    initialised_ = true;
    return true;

  }

  int HmacUpdate(char* data, int len) {
    if (!initialised_) return 0;
    HMAC_Update(&ctx, (unsigned char*)data, len);
    return 1;
  }

  int HmacDigest(unsigned char** md_value, unsigned int *md_len) {
    if (!initialised_) return 0;
    *md_value = new unsigned char[EVP_MAX_MD_SIZE];
    HMAC_Final(&ctx, *md_value, md_len);
    HMAC_CTX_cleanup(&ctx);
    initialised_ = false;
    return 1;
  }


 protected:

  static Handle<Value> New (const Arguments& args) {
    HandleScope scope;

    Hmac *hmac = new Hmac();
    hmac->Wrap(args.This());
    return args.This();
  }

  static Handle<Value> HmacInit(const Arguments& args) {
    Hmac *hmac = ObjectWrap::Unwrap<Hmac>(args.This());

    HandleScope scope;

    if (args.Length() == 0 || !args[0]->IsString()) {
      return ThrowException(Exception::Error(String::New(
        "Must give hashtype string as argument")));
    }

    ssize_t len = DecodeBytes(args[1], BINARY);

    if (len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    char* buf = new char[len];
    ssize_t written = DecodeWrite(buf, len, args[1], BINARY);
    assert(written == len);

    String::Utf8Value hashType(args[0]->ToString());

    bool r = hmac->HmacInit(*hashType, buf, len);

    delete [] buf;

    if (!r) {
      return ThrowException(Exception::Error(String::New("hmac error")));
    }

    return args.This();
  }

  static Handle<Value> HmacUpdate(const Arguments& args) {
    Hmac *hmac = ObjectWrap::Unwrap<Hmac>(args.This());

    HandleScope scope;

    enum encoding enc = ParseEncoding(args[1]);
    ssize_t len = DecodeBytes(args[0], enc);

    if (len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    int r;
	
    if( Buffer::HasInstance(args[0])) {
      Local<Object> buffer_obj = args[0]->ToObject();
      char *buffer_data = Buffer::Data(buffer_obj);
      size_t buffer_length = Buffer::Length(buffer_obj);

      r = hmac->HmacUpdate(buffer_data, buffer_length);
    } else {
      char* buf = new char[len];
      ssize_t written = DecodeWrite(buf, len, args[0], enc);
      assert(written == len);
      r = hmac->HmacUpdate(buf, len);
      delete [] buf;
    }

    if (!r) {
      Local<Value> exception = Exception::TypeError(String::New("HmacUpdate fail"));
      return ThrowException(exception);
    }

    return args.This();
  }

  static Handle<Value> HmacDigest(const Arguments& args) {
    Hmac *hmac = ObjectWrap::Unwrap<Hmac>(args.This());

    HandleScope scope;

    unsigned char* md_value;
    unsigned int md_len;
    char* md_hexdigest;
    int md_hex_len;
    Local<Value> outString ;

    int r = hmac->HmacDigest(&md_value, &md_len);

    if (md_len == 0 || r == 0) {
      return scope.Close(String::New(""));
    }

    if (args.Length() == 0 || !args[0]->IsString()) {
      // Binary
      outString = Encode(md_value, md_len, BINARY);
    } else {
      String::Utf8Value encoding(args[0]->ToString());
      if (strcasecmp(*encoding, "hex") == 0) {
        // Hex encoding
        HexEncode(md_value, md_len, &md_hexdigest, &md_hex_len);
        outString = Encode(md_hexdigest, md_hex_len, BINARY);
        delete [] md_hexdigest;
      } else if (strcasecmp(*encoding, "base64") == 0) {
        base64(md_value, md_len, &md_hexdigest, &md_hex_len);
        outString = Encode(md_hexdigest, md_hex_len, BINARY);
        delete [] md_hexdigest;
      } else if (strcasecmp(*encoding, "binary") == 0) {
        outString = Encode(md_value, md_len, BINARY);
      } else {
        fprintf(stderr, "node-crypto : Hmac .digest encoding "
                        "can be binary, hex or base64\n");
      }
    }
    delete [] md_value;
    return scope.Close(outString);
  }

  Hmac () : ObjectWrap () {
    initialised_ = false;
  }

  ~Hmac () { }

 private:

  HMAC_CTX ctx; /* coverity[member_decl] */
  const EVP_MD *md; /* coverity[member_decl] */
  bool initialised_;
};


class Hash : public ObjectWrap {
 public:
  static void Initialize (v8::Handle<v8::Object> target) {
    HandleScope scope;

    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    t->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_PROTOTYPE_METHOD(t, "update", HashUpdate);
    NODE_SET_PROTOTYPE_METHOD(t, "digest", HashDigest);

    target->Set(String::NewSymbol("Hash"), t->GetFunction());
  }

  bool HashInit (const char* hashType) {
    md = EVP_get_digestbyname(hashType);
    if(!md) {
      fprintf(stderr, "node-crypto : Unknown message digest %s\n", hashType);
      return false;
    }
    EVP_MD_CTX_init(&mdctx);
    EVP_DigestInit_ex(&mdctx, md, NULL);
    initialised_ = true;
    return true;
  }

  int HashUpdate(char* data, int len) {
    if (!initialised_) return 0;
    EVP_DigestUpdate(&mdctx, data, len);
    return 1;
  }


 protected:

  static Handle<Value> New (const Arguments& args) {
    HandleScope scope;

    if (args.Length() == 0 || !args[0]->IsString()) {
      return ThrowException(Exception::Error(String::New(
        "Must give hashtype string as argument")));
    }

    Hash *hash = new Hash();
    hash->Wrap(args.This());

    String::Utf8Value hashType(args[0]->ToString());

    hash->HashInit(*hashType);

    return args.This();
  }

  static Handle<Value> HashUpdate(const Arguments& args) {
    HandleScope scope;

    Hash *hash = ObjectWrap::Unwrap<Hash>(args.This());

    enum encoding enc = ParseEncoding(args[1]);
    ssize_t len = DecodeBytes(args[0], enc);

    if (len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    int r;

    if (Buffer::HasInstance(args[0])) {
      Local<Object> buffer_obj = args[0]->ToObject();
      char *buffer_data = Buffer::Data(buffer_obj);
      size_t buffer_length = Buffer::Length(buffer_obj);
      r = hash->HashUpdate(buffer_data, buffer_length);
    } else {
      char* buf = new char[len];
      ssize_t written = DecodeWrite(buf, len, args[0], enc);
      assert(written == len);
      r = hash->HashUpdate(buf, len);
      delete[] buf;
    }

    if (!r) {
      Local<Value> exception = Exception::TypeError(String::New("HashUpdate fail"));
      return ThrowException(exception);
    }

    return args.This();
  }

  static Handle<Value> HashDigest(const Arguments& args) {
    HandleScope scope;

    Hash *hash = ObjectWrap::Unwrap<Hash>(args.This());

    if (!hash->initialised_) {
      return ThrowException(Exception::Error(String::New("Not initialized")));
    }

    unsigned char md_value[EVP_MAX_MD_SIZE];
    unsigned int md_len;

    EVP_DigestFinal_ex(&hash->mdctx, md_value, &md_len);
    EVP_MD_CTX_cleanup(&hash->mdctx);
    hash->initialised_ = false;

    if (md_len == 0) {
      return scope.Close(String::New(""));
    }

    Local<Value> outString;

    if (args.Length() == 0 || !args[0]->IsString()) {
      // Binary
      outString = Encode(md_value, md_len, BINARY);
    } else {
      String::Utf8Value encoding(args[0]->ToString());
      if (strcasecmp(*encoding, "hex") == 0) {
        // Hex encoding
        char* md_hexdigest;
        int md_hex_len;
        HexEncode(md_value, md_len, &md_hexdigest, &md_hex_len);
        outString = Encode(md_hexdigest, md_hex_len, BINARY);
        delete [] md_hexdigest;
      } else if (strcasecmp(*encoding, "base64") == 0) {
        char* md_hexdigest;
        int md_hex_len;
        base64(md_value, md_len, &md_hexdigest, &md_hex_len);
        outString = Encode(md_hexdigest, md_hex_len, BINARY);
        delete [] md_hexdigest;
      } else if (strcasecmp(*encoding, "binary") == 0) {
        outString = Encode(md_value, md_len, BINARY);
      } else {
        fprintf(stderr, "node-crypto : Hash .digest encoding "
                        "can be binary, hex or base64\n");
      }
    }

    return scope.Close(outString);
  }

  Hash () : ObjectWrap () {
    initialised_ = false;
  }

  ~Hash () { }

 private:

  EVP_MD_CTX mdctx; /* coverity[member_decl] */
  const EVP_MD *md; /* coverity[member_decl] */
  bool initialised_;
};

class Sign : public ObjectWrap {
 public:
  static void
  Initialize (v8::Handle<v8::Object> target) {
    HandleScope scope;

    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    t->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_PROTOTYPE_METHOD(t, "init", SignInit);
    NODE_SET_PROTOTYPE_METHOD(t, "update", SignUpdate);
    NODE_SET_PROTOTYPE_METHOD(t, "sign", SignFinal);

    target->Set(String::NewSymbol("Sign"), t->GetFunction());
  }

  bool SignInit (const char* signType) {
    md = EVP_get_digestbyname(signType);
    if(!md) {
      printf("Unknown message digest %s\n", signType);
      return false;
    }
    EVP_MD_CTX_init(&mdctx);
    EVP_SignInit_ex(&mdctx, md, NULL);
    initialised_ = true;
    return true;

  }

  int SignUpdate(char* data, int len) {
    if (!initialised_) return 0;
    EVP_SignUpdate(&mdctx, data, len);
    return 1;
  }

  int SignFinal(unsigned char** md_value,
                unsigned int *md_len,
                char* key_pem,
                int key_pemLen) {
    if (!initialised_) return 0;

    BIO *bp = NULL;
    EVP_PKEY* pkey;
    bp = BIO_new(BIO_s_mem());
    if(!BIO_write(bp, key_pem, key_pemLen)) return 0;

    pkey = PEM_read_bio_PrivateKey( bp, NULL, NULL, NULL );
    if (pkey == NULL) return 0;

    EVP_SignFinal(&mdctx, *md_value, md_len, pkey);
    EVP_MD_CTX_cleanup(&mdctx);
    initialised_ = false;
    EVP_PKEY_free(pkey);
    BIO_free(bp);
    return 1;
  }


 protected:

  static Handle<Value> New (const Arguments& args) {
    HandleScope scope;

    Sign *sign = new Sign();
    sign->Wrap(args.This());

    return args.This();
  }

  static Handle<Value> SignInit(const Arguments& args) {
    HandleScope scope;

    Sign *sign = ObjectWrap::Unwrap<Sign>(args.This());

    if (args.Length() == 0 || !args[0]->IsString()) {
      return ThrowException(Exception::Error(String::New(
        "Must give signtype string as argument")));
    }

    String::Utf8Value signType(args[0]->ToString());

    bool r = sign->SignInit(*signType);

    if (!r) {
      return ThrowException(Exception::Error(String::New("SignInit error")));
    }

    return args.This();
  }

  static Handle<Value> SignUpdate(const Arguments& args) {
    Sign *sign = ObjectWrap::Unwrap<Sign>(args.This());

    HandleScope scope;

    enum encoding enc = ParseEncoding(args[1]);
    ssize_t len = DecodeBytes(args[0], enc);

    if (len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    int r;

    if (Buffer::HasInstance(args[0])) {
      Local<Object> buffer_obj = args[0]->ToObject();
      char *buffer_data = Buffer::Data(buffer_obj);
      size_t buffer_length = Buffer::Length(buffer_obj);

      r = sign->SignUpdate(buffer_data, buffer_length);
    } else {
      char* buf = new char[len];
      ssize_t written = DecodeWrite(buf, len, args[0], enc);
      assert(written == len);
      r = sign->SignUpdate(buf, len);
      delete [] buf;
    }

    if (!r) {
      Local<Value> exception = Exception::TypeError(String::New("SignUpdate fail"));
      return ThrowException(exception);
    }

    return args.This();
  }

  static Handle<Value> SignFinal(const Arguments& args) {
    Sign *sign = ObjectWrap::Unwrap<Sign>(args.This());

    HandleScope scope;

    unsigned char* md_value;
    unsigned int md_len;
    char* md_hexdigest;
    int md_hex_len;
    Local<Value> outString;

    md_len = 8192; // Maximum key size is 8192 bits
    md_value = new unsigned char[md_len];

    ssize_t len = DecodeBytes(args[0], BINARY);

    if (len < 0) {
      delete [] md_value;
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    char* buf = new char[len];
    ssize_t written = DecodeWrite(buf, len, args[0], BINARY);
    assert(written == len);

    int r = sign->SignFinal(&md_value, &md_len, buf, len);

    delete [] buf;

    if (md_len == 0 || r == 0) {
      delete [] md_value;
      return scope.Close(String::New(""));
    }

    if (args.Length() == 1 || !args[1]->IsString()) {
      // Binary
      outString = Encode(md_value, md_len, BINARY);
    } else {
      String::Utf8Value encoding(args[1]->ToString());
      if (strcasecmp(*encoding, "hex") == 0) {
        // Hex encoding
        HexEncode(md_value, md_len, &md_hexdigest, &md_hex_len);
        outString = Encode(md_hexdigest, md_hex_len, BINARY);
        delete [] md_hexdigest;
      } else if (strcasecmp(*encoding, "base64") == 0) {
        base64(md_value, md_len, &md_hexdigest, &md_hex_len);
        outString = Encode(md_hexdigest, md_hex_len, BINARY);
        delete [] md_hexdigest;
      } else if (strcasecmp(*encoding, "binary") == 0) {
        outString = Encode(md_value, md_len, BINARY);
      } else {
        outString = String::New("");
        fprintf(stderr, "node-crypto : Sign .sign encoding "
                        "can be binary, hex or base64\n");
      }
    }

    delete [] md_value;
    return scope.Close(outString);
  }

  Sign () : ObjectWrap () {
    initialised_ = false;
  }

  ~Sign () { }

 private:

  EVP_MD_CTX mdctx; /* coverity[member_decl] */
  const EVP_MD *md; /* coverity[member_decl] */
  bool initialised_;
};

class Verify : public ObjectWrap {
 public:
  static void Initialize (v8::Handle<v8::Object> target) {
    HandleScope scope;

    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    t->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_PROTOTYPE_METHOD(t, "init", VerifyInit);
    NODE_SET_PROTOTYPE_METHOD(t, "update", VerifyUpdate);
    NODE_SET_PROTOTYPE_METHOD(t, "verify", VerifyFinal);

    target->Set(String::NewSymbol("Verify"), t->GetFunction());
  }


  bool VerifyInit (const char* verifyType) {
    md = EVP_get_digestbyname(verifyType);
    if(!md) {
      fprintf(stderr, "node-crypto : Unknown message digest %s\n", verifyType);
      return false;
    }
    EVP_MD_CTX_init(&mdctx);
    EVP_VerifyInit_ex(&mdctx, md, NULL);
    initialised_ = true;
    return true;
  }


  int VerifyUpdate(char* data, int len) {
    if (!initialised_) return 0;
    EVP_VerifyUpdate(&mdctx, data, len);
    return 1;
  }


  int VerifyFinal(char* key_pem, int key_pemLen, unsigned char* sig, int siglen) {
    if (!initialised_) return 0;

    BIO *bp = NULL;
    EVP_PKEY* pkey;
    X509 *x509;

    bp = BIO_new(BIO_s_mem());
    if(!BIO_write(bp, key_pem, key_pemLen)) return 0;

    x509 = PEM_read_bio_X509(bp, NULL, NULL, NULL );
    if (x509==NULL) return 0;

    pkey=X509_get_pubkey(x509);
    if (pkey==NULL) return 0;

    int r = EVP_VerifyFinal(&mdctx, sig, siglen, pkey);
    EVP_PKEY_free (pkey);

    if (r != 1) {
      ERR_print_errors_fp (stderr);
    }
    X509_free(x509);
    BIO_free(bp);
    EVP_MD_CTX_cleanup(&mdctx);
    initialised_ = false;
    return r;
  }


 protected:

  static Handle<Value> New (const Arguments& args) {
    HandleScope scope;

    Verify *verify = new Verify();
    verify->Wrap(args.This());

    return args.This();
  }


  static Handle<Value> VerifyInit(const Arguments& args) {
    Verify *verify = ObjectWrap::Unwrap<Verify>(args.This());

    HandleScope scope;

    if (args.Length() == 0 || !args[0]->IsString()) {
      return ThrowException(Exception::Error(String::New(
        "Must give verifytype string as argument")));
    }

    String::Utf8Value verifyType(args[0]->ToString());

    bool r = verify->VerifyInit(*verifyType);

    if (!r) {
      return ThrowException(Exception::Error(String::New("VerifyInit error")));
    }

    return args.This();
  }


  static Handle<Value> VerifyUpdate(const Arguments& args) {
    HandleScope scope;

    Verify *verify = ObjectWrap::Unwrap<Verify>(args.This());

    enum encoding enc = ParseEncoding(args[1]);
    ssize_t len = DecodeBytes(args[0], enc);

    if (len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    int r;

    if(Buffer::HasInstance(args[0])) {
      Local<Object> buffer_obj = args[0]->ToObject();
      char *buffer_data = Buffer::Data(buffer_obj);
      size_t buffer_length = Buffer::Length(buffer_obj);

      r = verify->VerifyUpdate(buffer_data, buffer_length);
    } else {
      char* buf = new char[len];
      ssize_t written = DecodeWrite(buf, len, args[0], enc);
      assert(written == len);
      r = verify->VerifyUpdate(buf, len);
      delete [] buf;
    }

    if (!r) {
      Local<Value> exception = Exception::TypeError(String::New("VerifyUpdate fail"));
      return ThrowException(exception);
    }

    return args.This();
  }


  static Handle<Value> VerifyFinal(const Arguments& args) {
    HandleScope scope;

    Verify *verify = ObjectWrap::Unwrap<Verify>(args.This());

    ssize_t klen = DecodeBytes(args[0], BINARY);

    if (klen < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    char* kbuf = new char[klen];
    ssize_t kwritten = DecodeWrite(kbuf, klen, args[0], BINARY);
    assert(kwritten == klen);


    ssize_t hlen = DecodeBytes(args[1], BINARY);

    if (hlen < 0) {
      delete [] kbuf;
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    unsigned char* hbuf = new unsigned char[hlen];
    ssize_t hwritten = DecodeWrite((char *)hbuf, hlen, args[1], BINARY);
    assert(hwritten == hlen);
    unsigned char* dbuf;
    int dlen;

    int r=-1;

    if (args.Length() == 2 || !args[2]->IsString()) {
      // Binary
      r = verify->VerifyFinal(kbuf, klen, hbuf, hlen);
    } else {
      String::Utf8Value encoding(args[2]->ToString());
      if (strcasecmp(*encoding, "hex") == 0) {
        // Hex encoding
        HexDecode(hbuf, hlen, (char **)&dbuf, &dlen);
        r = verify->VerifyFinal(kbuf, klen, dbuf, dlen);
        delete [] dbuf;
      } else if (strcasecmp(*encoding, "base64") == 0) {
        // Base64 encoding
        unbase64(hbuf, hlen, (char **)&dbuf, &dlen);
        r = verify->VerifyFinal(kbuf, klen, dbuf, dlen);
        delete [] dbuf;
      } else if (strcasecmp(*encoding, "binary") == 0) {
        r = verify->VerifyFinal(kbuf, klen, hbuf, hlen);
      } else {
        fprintf(stderr, "node-crypto : Verify .verify encoding "
                        "can be binary, hex or base64\n");
      }
    }

    delete [] kbuf;
    delete [] hbuf;

    return scope.Close(Integer::New(r));
  }

  Verify () : ObjectWrap () {
    initialised_ = false;
  }

  ~Verify () { }

 private:

  EVP_MD_CTX mdctx; /* coverity[member_decl] */
  const EVP_MD *md; /* coverity[member_decl] */
  bool initialised_;

};





void InitCrypto(Handle<Object> target) {
  HandleScope scope;

  SSL_library_init();
  OpenSSL_add_all_algorithms();
  OpenSSL_add_all_digests();
  SSL_load_error_strings();
  ERR_load_crypto_strings();

  SecureContext::Initialize(target);
  SecureStream::Initialize(target);
  Cipher::Initialize(target);
  Decipher::Initialize(target);
  Hmac::Initialize(target);
  Hash::Initialize(target);
  Sign::Initialize(target);
  Verify::Initialize(target);

  subject_symbol    = NODE_PSYMBOL("subject");
  issuer_symbol     = NODE_PSYMBOL("issuer");
  valid_from_symbol = NODE_PSYMBOL("valid_from");
  valid_to_symbol   = NODE_PSYMBOL("valid_to");
  fingerprint_symbol   = NODE_PSYMBOL("fingerprint");
  name_symbol       = NODE_PSYMBOL("name");
  version_symbol    = NODE_PSYMBOL("version");
}

}  // namespace node

NODE_MODULE(node_crypto, node::InitCrypto);

