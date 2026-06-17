import * as p from '@clack/prompts';

import { scaffold } from './cli.js';
import { runPrompts } from './prompts.js';
import { killActiveChild } from './runner.js';

// @clack/prompts' spinner registers a SIGINT/SIGTERM handler that only stops
// the spinner — it never exits. Because attaching any SIGINT listener disables
// Node's default "terminate on Ctrl+C", the process would otherwise keep running
// through the whole scaffold. Register our own handler so Ctrl+C actually aborts.
let aborting = false;
function onAbort(signal: NodeJS.Signals): void {
  if (aborting) return;
  aborting = true;
  killActiveChild();
  // Restore the cursor (the spinner hides it) and leave a clear message.
  process.stdout.write('\x1b[?25h');
  p.cancel('Cancelled — aborting scaffold.');
  // 128 + signal number (SIGINT = 2 → 130) is the conventional exit code.
  process.exit(signal === 'SIGTERM' ? 143 : 130);
}
process.on('SIGINT', () => onAbort('SIGINT'));
process.on('SIGTERM', () => onAbort('SIGTERM'));

const nameArg = process.argv[2];

try {
  const config = await runPrompts(nameArg);
  await scaffold(config);
} catch (err) {
  p.cancel('Scaffold failed.');
  if (err instanceof Error) {
    console.error(err.message);
  }
  process.exit(1);
}
