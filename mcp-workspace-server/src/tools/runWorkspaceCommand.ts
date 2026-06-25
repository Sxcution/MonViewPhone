import { spawn } from 'child_process';
import { config } from '../config.js';
import { isValidCommandKey, getCommand } from '../utils/commandAllowlist.js';
import { logger } from '../utils/logger.js';

interface RunCommandInput {
  command: string;
}

interface RunCommandOutput {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

function truncateOutput(str: string, maxBytes: number): string {
  const bytes = Buffer.byteLength(str, 'utf-8');
  if (bytes <= maxBytes) return str;
  
  // Keep first 20% and last 70% of character length
  const ratio = maxBytes / bytes;
  const targetLen = Math.floor(str.length * ratio);
  const headLen = Math.floor(targetLen * 0.2);
  const tailLen = Math.floor(targetLen * 0.7);
  
  return (
    str.substring(0, headLen) +
    '\n\n... [OUTPUT TRUNCATED FOR MCP SIZE LIMITS] ...\n\n' +
    str.substring(str.length - tailLen)
  );
}

export async function runWorkspaceCommand(input: RunCommandInput): Promise<RunCommandOutput> {
  const commandKey = input.command;

  if (!isValidCommandKey(commandKey)) {
    throw new Error(`Command '${commandKey}' is not allowed or invalid.`);
  }

  const allowedCmd = getCommand(commandKey);
  const cwd = config.WORKSPACE_ROOT;
  const timeoutMs = config.MAX_COMMAND_TIMEOUT_MS;
  const maxOutputBytes = config.MAX_FILE_BYTES;

  const fullCommandStr = `${allowedCmd.command} ${allowedCmd.args.join(' ')}`;
  logger.info(`Executing workspace command: ${fullCommandStr} (timeout: ${timeoutMs}ms)`);

  const startTime = Date.now();

  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';
    let timedOut = false;

    // Use shell on Windows for cmd/bat binaries like npm/pnpm/yarn
    const isWindows = process.platform === 'win32';
    const child = spawn(allowedCmd.command, allowedCmd.args, {
      cwd,
      shell: isWindows,
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      // If still running after SIGTERM, force kill
      setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch (_) {}
      }, 2000);
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      const durationMs = Date.now() - startTime;
      logger.error(`Command spawn error: ${fullCommandStr}`, err);
      resolve({
        command: fullCommandStr,
        exitCode: -1,
        stdout: truncateOutput(stdoutData, maxOutputBytes),
        stderr: truncateOutput(stderrData + `\nSpawn error: ${err.message}`, maxOutputBytes),
        durationMs,
        timedOut: false,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      const durationMs = Date.now() - startTime;

      resolve({
        command: fullCommandStr,
        exitCode: code,
        stdout: truncateOutput(stdoutData, maxOutputBytes),
        stderr: truncateOutput(stderrData, maxOutputBytes),
        durationMs,
        timedOut,
      });
    });
  });
}
