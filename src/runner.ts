import { execa } from 'execa';

export async function run(
  command: string,
  args: string[],
  cwd: string,
  silent = false,
): Promise<void> {
  await execa(command, args, {
    cwd,
    stdio: silent ? 'pipe' : 'inherit',
  });
}

export async function runCapture(
  command: string,
  args: string[],
  cwd: string,
): Promise<string> {
  const { stdout } = await execa(command, args, { cwd });
  return stdout.trim();
}

export function getPmRunner(pm: string): string {
  const runners: Record<string, string> = {
    pnpm: 'pnpm',
    npm: 'npx',
    yarn: 'yarn',
    bun: 'bunx',
  };
  return runners[pm] ?? 'npx';
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
