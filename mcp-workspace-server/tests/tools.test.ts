import { describe, it, expect } from 'vitest';
import path from 'path';
import { readFile } from '../src/tools/readFile.js';
import { listWorkspaceFiles } from '../src/tools/listWorkspaceFiles.js';
import { runWorkspaceCommand } from '../src/tools/runWorkspaceCommand.js';

describe('MCP Tools Implementation Tests', () => {
  describe('readFile Tool', () => {
    it('should read a valid text file inside workspace', async () => {
      const result = await readFile({
        path: 'mcp-workspace-server/package.json',
        startLine: 1,
        endLine: 5,
      });

      expect(result.path).toBe('mcp-workspace-server/package.json');
      expect(result.language).toBe('json');
      expect(result.lineStart).toBe(1);
      expect(result.lineEnd).toBe(5);
      expect(result.content).toContain('mcp-workspace-server');
    });

    it('should throw error when reading a blocked file like .env', async () => {
      await expect(
        readFile({ path: 'mcp-workspace-server/.env' })
      ).rejects.toThrow('Access denied: Path contains restricted files or directories.');
    });
  });

  describe('listWorkspaceFiles Tool', () => {
    it('should list files recursively and exclude denylisted items like node_modules', async () => {
      const result = await listWorkspaceFiles({
        dir: 'mcp-workspace-server/src',
        recursive: false,
      });

      expect(result.files.length).toBeGreaterThan(0);
      
      // Ensure none of the files contain node_modules or .git in path
      result.files.forEach((file) => {
        expect(file.path.toLowerCase()).not.toContain('node_modules');
        expect(file.path.toLowerCase()).not.toContain('.git');
      });
    });
  });

  describe('runWorkspaceCommand Tool', () => {
    it('should block execution of arbitrary non-whitelisted commands', async () => {
      await expect(
        runWorkspaceCommand({ command: 'rm -rf /' })
      ).rejects.toThrow("Command 'rm -rf /' is not allowed or invalid.");
    });

    it('should successfully execute a whitelisted command like git_status', async () => {
      const result = await runWorkspaceCommand({ command: 'git_status' });
      expect(result.command).toBe('git status');
      expect(result.exitCode).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(result.timedOut).toBe(false);
    });
  });
});
