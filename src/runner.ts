import { execa, type ResultPromise } from 'execa';

// Track the currently running child so an abort (Ctrl+C) can kill it
// immediately instead of waiting for it to finish or for execa's cleanup.
let active: ResultPromise | undefined;

export function killActiveChild(): void {
  active?.kill('SIGTERM');
}

export async function run(
  command: string,
  args: string[],
  cwd: string,
  silent = false,
): Promise<void> {
  const child = execa(command, args, {
    cwd,
    stdio: silent ? 'pipe' : 'inherit',
    // If the child ignores SIGTERM, escalate to SIGKILL after 2s.
    forceKillAfterDelay: 2000,
  });
  active = child;
  try {
    await child;
  } finally {
    if (active === child) active = undefined;
  }
}

export async function runCapture(
  command: string,
  args: string[],
  cwd: string,
): Promise<string> {
  const { stdout } = await execa(command, args, { cwd });
  return stdout.trim();
}

export function getPmRunner(pm: string): [string, string[]] {
  const runners: Record<string, [string, string[]]> = {
    pnpm: ['pnpm', ['dlx']],
    npm: ['npx', []],
    yarn: ['yarn', ['dlx']],
    bun: ['bunx', []],
  };
  return runners[pm] ?? ['npx', []];
}

export function getInstallCmd(pm: string): [string, string[]] {
  const cmds: Record<string, [string, string[]]> = {
    pnpm: ['pnpm', ['install']],
    npm: ['npm', ['install']],
    yarn: ['yarn', ['install']],
    bun: ['bun', ['install']],
  };
  return cmds[pm] ?? ['npm', ['install']];
}
