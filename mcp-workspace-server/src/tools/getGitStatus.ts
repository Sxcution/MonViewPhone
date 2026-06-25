import { execSync } from 'child_process';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

interface GitStatusOutput {
  branch: string;
  status: string;
  dirty: boolean;
}

export async function getGitStatus(): Promise<GitStatusOutput> {
  const cwd = config.WORKSPACE_ROOT;

  try {
    // 1. Get current branch
    let branch = 'unknown';
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
    } catch (err) {
      logger.warn('Failed to retrieve git branch, repo may not be initialized', err);
    }

    // 2. Get status details
    let statusOutput = '';
    let dirty = false;
    try {
      statusOutput = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
      dirty = statusOutput.length > 0;
      
      // If we want a nice detailed status, run normal git status
      statusOutput = execSync('git status', { cwd, encoding: 'utf-8' }).trim();
    } catch (err) {
      logger.warn('Failed to run git status', err);
      statusOutput = 'git status failed or not a git repository';
    }

    return {
      branch,
      status: statusOutput,
      dirty,
    };
  } catch (err: any) {
    logger.error('Error running git commands', err);
    throw new Error(`Git status operation failed: ${err.message}`);
  }
}
