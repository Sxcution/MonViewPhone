import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { resolveSafePath, isDenylisted } from '../utils/paths.js';

interface ListFilesInput {
  dir?: string;
  recursive?: boolean;
  extensions?: string[];
  maxFiles?: number;
}

interface FileEntry {
  path: string;
  sizeBytes: number;
  modifiedAt: string;
}

interface ListFilesOutput {
  files: FileEntry[];
  truncated: boolean;
}

export async function listWorkspaceFiles(input: ListFilesInput): Promise<ListFilesOutput> {
  const inputDir = input.dir || '.';
  const recursive = input.recursive !== undefined ? input.recursive : true;
  const extensions = input.extensions?.map(ext => ext.toLowerCase());
  const maxFilesLimit = input.maxFiles !== undefined ? input.maxFiles : config.MAX_LIST_FILES;

  // Resolve safe directory path
  const targetDir = resolveSafePath(inputDir);

  const fileEntries: FileEntry[] = [];
  let truncated = false;

  function walk(currentDir: string) {
    if (fileEntries.length >= maxFilesLimit) {
      truncated = true;
      return;
    }

    let items: string[] = [];
    try {
      items = fs.readdirSync(currentDir);
    } catch (err) {
      // Ignore directory read errors
      return;
    }

    for (const item of items) {
      if (fileEntries.length >= maxFilesLimit) {
        truncated = true;
        break;
      }

      const fullPath = path.join(currentDir, item);

      // Skip denylisted
      if (isDenylisted(fullPath)) {
        continue;
      }

      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch (_) {
        continue;
      }

      if (stat.isDirectory()) {
        if (recursive) {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath).toLowerCase();
        if (extensions && extensions.length > 0 && !extensions.includes(ext)) {
          continue;
        }

        // Relative path to WORKSPACE_ROOT
        const relativePath = path.relative(config.WORKSPACE_ROOT, fullPath);

        fileEntries.push({
          path: relativePath.replace(/\\/g, '/'), // Force forward slashes
          sizeBytes: stat.size,
          modifiedAt: stat.mtime.toISOString(),
        });
      }
    }
  }

  walk(targetDir);

  return {
    files: fileEntries,
    truncated,
  };
}
