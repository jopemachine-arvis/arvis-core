const execa = require(process.argv[1]);

let executionTimer;

// Debounce for a liitle longer than child process spawning will normally uses (around 15ms).
const executionDelay = 25;

const requests = new Map();

const addRequest = (id, proc) => {
  requests.set(id, proc);
};

const cancelProc = (id) => {
  if (requests.has(id)) {
    requests.get(id).cancel();
  }
};

const clearExecutionTimer = () => {
  if (executionTimer) {
    clearTimeout(executionTimer);
  }
};

const handleExecute = (id, scriptStr, executorOptions) => {
  let payload;

  // Clear previous script execution timer.
  clearExecutionTimer();

  const handler = () => {
    clearExecutionTimer();

    const proc = execa.command(scriptStr, executorOptions);
    addRequest(id, proc);

    return proc.then((result) => {
      payload = result;
      return result;
    }).catch((err) => {
      payload = err;
    }).finally(() => {
      requests.delete(id);
      process.send({ id, payload: JSON.stringify(payload) });
    });
  };

  executionTimer = setTimeout(handler, executionDelay);
};

process.on('message', async ({ id, event, scriptStr, executorOptions }) => {
  switch (event) {
    case 'execute':
      handleExecute(id, scriptStr, JSON.parse(executorOptions));
      break;

    case 'cancel':
      cancelProc(id);
      break;

    default:
      console.error('Unsupported event type ' + event);
      break;
  }
});