#include "node.h"
#include "platform.h"

#include <sys/param.h> // for MAXPATHLEN
#include <unistd.h> // getpagesize

/* SetProcessTitle */
#include <sys/prctl.h>
#include <linux/prctl.h>
#include <stdlib.h> // free
#include <string.h> // strdup


namespace node {

static char buf[MAXPATHLEN + 1];
static char *process_title;


char** OS::SetupArgs(int argc, char *argv[]) {
  process_title = strdup(argv[0]);
  return argv;
}


void OS::SetProcessTitle(char *title) {
  if (process_title) free(process_title);
  process_title = strdup(title);
  prctl(PR_SET_NAME, process_title);
}


const char* OS::GetProcessTitle(int *len) {
  if (process_title) {
    *len = strlen(process_title);
    return process_title;
  }
  *len = 0;
  return NULL;
}


int OS::GetMemory(size_t *rss, size_t *vsize) {
  FILE *f = fopen("/proc/self/stat", "r");
  if (!f) return -1;

  int itmp;
  char ctmp;
  size_t page_size = getpagesize();
  char *cbuf;
  bool foundExeEnd;

  /* PID */
  if (fscanf(f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* Exec file */
  cbuf = buf;
  foundExeEnd = false;
  if (fscanf (f, "%c", cbuf++) == 0) goto error; // (
  while (1) {
    if (fscanf(f, "%c", cbuf) == 0) goto error;
    if (*cbuf == ')') {
      foundExeEnd = true;
    } else if (foundExeEnd && *cbuf == ' ') {
      *cbuf = 0;
      break;
    }

    cbuf++;
  }
  /* State */
  if (fscanf (f, "%c ", &ctmp) == 0) goto error; /* coverity[secure_coding] */
  /* Parent process */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* Process group */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* Session id */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* TTY */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* TTY owner process group */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* Flags */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* Minor faults (no memory page) */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* Minor faults, children */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* Major faults (memory page faults) */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* Major faults, children */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* utime */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* stime */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* utime, children */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* stime, children */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* jiffies remaining in current time slice */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* 'nice' value */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* jiffies until next timeout */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* jiffies until next SIGALRM */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* start time (jiffies since system boot) */
  if (fscanf (f, "%d ", &itmp) == 0) goto error; /* coverity[secure_coding] */

  /* Virtual memory size */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  *vsize = (size_t) itmp;

  /* Resident set size */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  *rss = (size_t) itmp * page_size;

  /* rlim */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* Start of text */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* End of text */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */
  /* Start of stack */
  if (fscanf (f, "%u ", &itmp) == 0) goto error; /* coverity[secure_coding] */

  fclose (f);

  return 0;

error:
  fclose (f);
  return -1;
}


int OS::GetExecutablePath(char* buffer, size_t* size) {
  *size = readlink("/proc/self/exe", buffer, *size - 1);
  if (*size <= 0) return -1;
  buffer[*size] = '\0';
  return 0;
}

}  // namespace node
