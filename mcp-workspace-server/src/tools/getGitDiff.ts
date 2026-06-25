import { execSync } from 'child_process';
import { config } from '../config.js';
import { resolveSafePath } from '../utils/paths.js';
import { logger } from '../utils/logger.js';

interface GitDiffInput {
  path?: string;
  staged?: boolean;
  maxBytes?: number;
}

interface GitDiffOutput {
  diff: string;
  truncated: boolean;
}

export async function getGitDiff(input: GitDiffInput): Promise<GitDiffOutput> {
  const staged = !!input.staged;
  const maxBytes = input.maxBytes !== undefined ? input.maxBytes : 100000;
  const cwd = config.WORKSPACE_ROOT;

  let fileArgs: string[] = [];
  if (input.path) {
    // Ensure safe resolved path
    const resolvedPath = resolveSafePath(input.path);
    // Use relative path for git command
    fileArgs.push(resolvedPath);
  }

  try {
    const cmdArgs = ['diff'];
    if (staged) {
      cmdArgs.push('--staged');
    }
    if (fileArgs.length > 0) {
      cmdArgs.push('--');
      cmdArgs.push(...fileArgs);
    }

    // Prepare execution args. Use double quotes for paths on Windows
    const escapePath = (p: string) => `"${p.replace(/"/g, '\\"')}"`;
    const formattedArgs = cmdArgs.map((arg, idx) => {
      // Escape paths which are after '--'
      const separatorIdx = cmdArgs.indexOf('--');
      if (separatorIdx !== -1 && idx > separatorIdx) {
        return escapePath(arg);
      }
      return arg;
    });

    const command = `git ${formattedArgs.join(' ')}`;
    logger.info(`Running git diff: ${command}`);

    let diffOutput = execSync(command, { 
      cwd, 
      encoding: 'utf-8',
      maxBuffer: maxBytes + 1024 * 1024 // give extra buffer space for Node execution
    });

    let truncated = false;
    if (Buffer.byteLength(diffOutput, 'utf-8') > maxBytes) {
      diffOutput = diffOutput.substring(0, maxBytes) + '\n... [DIFF TRUNCATED DUE TO SIZE LIMIT]';
      truncated = true;
    }

    return {
      diff: diffOutput || '[No differences]',
      truncated,
    };
  } catch (err: any) {
    logger.error('Error running git diff', err);
    throw new Error(`Git diff operation failed: ${err.message}`);
  }
}
