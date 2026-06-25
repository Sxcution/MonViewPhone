import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { isDenylisted } from '../utils/paths.js';

interface SearchTextInput {
  query: string;
  includeExtensions?: string[];
  maxResults?: number;
}

interface SearchMatch {
  path: string;
  line: number;
  preview: string;
}

interface SearchTextOutput {
  matches: SearchMatch[];
  truncated: boolean;
}

export async function searchText(input: SearchTextInput): Promise<SearchTextOutput> {
  const query = input.query;
  if (!query) {
    throw new Error('Search query cannot be empty');
  }

  const includeExtensions = input.includeExtensions?.map(ext => ext.toLowerCase());
  const maxResults = input.maxResults !== undefined ? input.maxResults : 50;

  const matches: SearchMatch[] = [];
  let truncated = false;
  
  // Recursively search workspace
  function searchDir(currentDir: string) {
    if (matches.length >= maxResults) {
      truncated = true;
      return;
    }

    let items: string[] = [];
    try {
      items = fs.readdirSync(currentDir);
    } catch (_) {
      return;
    }

    for (const item of items) {
      if (matches.length >= maxResults) {
        truncated = true;
        break;
      }

      const fullPath = path.join(currentDir, item);

      // Skip denylisted path
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
        searchDir(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath).toLowerCase();
        
        // Filter by extension if provided
        if (includeExtensions && includeExtensions.length > 0) {
          if (!includeExtensions.includes(ext)) {
            continue;
          }
        }

        // Limit search to files under a reasonable size (e.g., 2MB)
        if (stat.size > 2 * 1024 * 1024) {
          continue;
        }

        searchFile(fullPath);
      }
    }
  }

  function searchFile(filePath: string) {
    let content = '';
    try {
      // Check for binary before reading
      const buffer = Buffer.alloc(512);
      const fd = fs.openSync(filePath, 'r');
      try {
        const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
        for (let i = 0; i < bytesRead; i++) {
          const charCode = buffer[i];
          if (charCode === 0) {
            return; // Skip binary
          }
        }
      } finally {
        fs.closeSync(fd);
      }

      content = fs.readFileSync(filePath, 'utf-8');
    } catch (_) {
      return;
    }

    const lines = content.split(/\r?\n/);
    const relativePath = path.relative(config.WORKSPACE_ROOT, filePath).replace(/\\/g, '/');

    for (let i = 0; i < lines.length; i++) {
      if (matches.length >= maxResults) {
        truncated = true;
        break;
      }

      const lineContent = lines[i];
      if (lineContent.includes(query)) {
        matches.push({
          path: relativePath,
          line: i + 1,
          preview: lineContent.trim(),
        });
      }
    }
  }

  searchDir(config.WORKSPACE_ROOT);

  return {
    matches,
    truncated,
  };
}
