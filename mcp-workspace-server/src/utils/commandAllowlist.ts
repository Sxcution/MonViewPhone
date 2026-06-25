export interface AllowedCommand {
  command: string;
  args: string[];
}

export const COMMAND_ALLOWLIST: Record<string, AllowedCommand> = {
  npm_test: { command: 'npm', args: ['run', 'test'] },
  npm_lint: { command: 'npm', args: ['run', 'lint'] },
  npm_build: { command: 'npm', args: ['run', 'build'] },
  pnpm_test: { command: 'pnpm', args: ['run', 'test'] },
  pnpm_lint: { command: 'pnpm', args: ['run', 'lint'] },
  pnpm_build: { command: 'pnpm', args: ['run', 'build'] },
  yarn_test: { command: 'yarn', args: ['run', 'test'] },
  yarn_lint: { command: 'yarn', args: ['run', 'lint'] },
  yarn_build: { command: 'yarn', args: ['run', 'build'] },
  bun_test: { command: 'bun', args: ['run', 'test'] },
  git_status: { command: 'git', args: ['status'] },
  git_diff: { command: 'git', args: ['diff'] },
};

export type AllowedCommandKey = keyof typeof COMMAND_ALLOWLIST;

export function isValidCommandKey(key: string): key is AllowedCommandKey {
  return key in COMMAND_ALLOWLIST;
}

export function getCommand(key: AllowedCommandKey): AllowedCommand {
  return COMMAND_ALLOWLIST[key];
}
