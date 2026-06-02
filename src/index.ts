import * as p from '@clack/prompts';

import { scaffold } from './cli.js';
import { runPrompts } from './prompts.js';

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
