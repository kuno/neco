#include "node.h"
#include "platform.h"


namespace node {


char** OS::SetupArgs(int argc, char *argv[]) {
  return argv;
}


void OS::SetProcessTitle(char *title) {
  ;
}


const char* OS::GetProcessTitle(int *len) {
  *len = 0;
  return NULL;
}


int OS::GetMemory(size_t *rss, size_t *vsize) {
  // Not implemented
  *rss = 0;
  *vsize = 0;
  return 0;
}

int OS::GetExecutablePath(char *buffer, size_t* size) {
  *size = 0;
  return -1;
}

}  // namespace node
