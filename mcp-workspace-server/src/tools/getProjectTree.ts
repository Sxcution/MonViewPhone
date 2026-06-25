import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { isDenylisted } from '../utils/paths.js';

interface ProjectTreeInput {
  maxDepth?: number;
  includeHidden?: boolean;
}

interface ProjectTreeOutput {
  root: string;
  tree: string;
  truncated: boolean;
}

export async function getProjectTree(input: ProjectTreeInput): Promise<ProjectTreeOutput> {
  const maxDepth = input.maxDepth !== undefined ? input.maxDepth : 3;
  const includeHidden = !!input.includeHidden;
  const rootDir = config.WORKSPACE_ROOT;

  let totalNodes = 0;
  let truncated = false;
  const maxNodes = 2000; // Safe limit to prevent memory/CPU exhaustion

  function buildTree(dirPath: string, currentDepth: number): string {
    if (currentDepth > maxDepth) return '';
    if (totalNodes > maxNodes) {
      truncated = true;
      return '';
    }

    let result = '';
    let files: string[] = [];

    try {
      files = fs.readdirSync(dirPath);
    } catch (err) {
      return `[Error reading directory: ${path.basename(dirPath)}]\n`;
    }

    // Sort files: directories first, then files alphabetically
    const sortedFiles = files
      .map((name) => {
        const fullPath = path.join(dirPath, name);
        let isDir = false;
        try {
          isDir = fs.statSync(fullPath).isDirectory();
        } catch (_) {}
        return { name, fullPath, isDir };
      })
      .sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });

    for (const file of sortedFiles) {
      const { name, fullPath, isDir } = file;

      // Skip denylisted paths
      if (isDenylisted(fullPath)) {
        continue;
      }

      // Handle hidden files
      if (!includeHidden && name.startsWith('.')) {
        continue;
      }

      totalNodes++;
      if (totalNodes > maxNodes) {
        truncated = true;
        break;
      }

      const indent = '  '.repeat(currentDepth);
      if (isDir) {
        result += `${indent}📁 ${name}/\n`;
        result += buildTree(fullPath, currentDepth + 1);
      } else {
        result += `${indent}📄 ${name}\n`;
      }
    }

    return result;
  }

  const treeText = buildTree(rootDir, 0);

  return {
    root: rootDir,
    tree: treeText || '[Empty or restricted directory]',
    truncated,
  };
}
