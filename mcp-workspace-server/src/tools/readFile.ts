import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { resolveSafePath } from '../utils/paths.js';

interface ReadFileInput {
  path: string;
  startLine?: number;
  endLine?: number;
}

interface ReadFileOutput {
  path: string;
  language: string;
  content: string;
  lineStart: number;
  lineEnd: number;
  totalLines: number;
  truncated: boolean;
}

function isBinaryFile(filePath: string): boolean {
  const buffer = Buffer.alloc(512);
  let fd: number;
  try {
    fd = fs.openSync(filePath, 'r');
  } catch (_) {
    return false;
  }
  
  try {
    const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
    for (let i = 0; i < bytesRead; i++) {
      const charCode = buffer[i];
      // 0 is NULL, 1-8, 11-12, 14-31 are control characters
      if (charCode === 0 || (charCode < 9 && charCode !== 0) || (charCode > 13 && charCode < 32)) {
        return true;
      }
    }
    return false;
  } catch (_) {
    return false;
  } finally {
    try {
      fs.closeSync(fd);
    } catch (_) {}
  }
}

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mapping: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.json': 'json',
    '.md': 'markdown',
    '.css': 'css',
    '.html': 'html',
    '.py': 'python',
    '.go': 'go',
    '.sh': 'shellscript',
    '.bat': 'bat',
    '.ps1': 'powershell',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.toml': 'toml',
    '.xml': 'xml',
  };
  return mapping[ext] || 'plaintext';
}

export async function readFile(input: ReadFileInput): Promise<ReadFileOutput> {
  const targetFile = resolveSafePath(input.path);

  if (!fs.existsSync(targetFile)) {
    throw new Error(`File not found: ${input.path}`);
  }

  const stat = fs.statSync(targetFile);
  if (!stat.isFile()) {
    throw new Error(`Path is not a file: ${input.path}`);
  }

  // Detect binary
  if (isBinaryFile(targetFile)) {
    throw new Error(`Cannot read binary file: ${input.path}`);
  }

  // Check file size vs config.MAX_FILE_BYTES
  const isLargeFile = stat.size > config.MAX_FILE_BYTES;

  // Read file lines
  const fileContent = fs.readFileSync(targetFile, 'utf-8');
  const lines = fileContent.split(/\r?\n/);
  const totalLines = lines.length;

  let startLine = input.startLine !== undefined ? Math.max(1, input.startLine) : 1;
  let endLine = input.endLine !== undefined ? Math.min(totalLines, input.endLine) : totalLines;

  if (startLine > totalLines) {
    startLine = totalLines;
  }
  if (endLine < startLine) {
    endLine = startLine;
  }

  // If large file and no specific range was requested, enforce truncation
  let truncated = false;
  let finalLines = lines.slice(startLine - 1, endLine);
  let finalContent = finalLines.join('\n');

  if (isLargeFile && input.startLine === undefined && input.endLine === undefined) {
    // Truncate to first 500 lines
    const safeMaxLines = 500;
    if (totalLines > safeMaxLines) {
      endLine = safeMaxLines;
      finalLines = lines.slice(0, safeMaxLines);
      finalContent = finalLines.join('\n');
      truncated = true;
    }
  }

  // Also enforce byte limit on returned content
  if (Buffer.byteLength(finalContent, 'utf-8') > config.MAX_FILE_BYTES) {
    finalContent = finalContent.substring(0, config.MAX_FILE_BYTES) + '\n... [TRUNCATED DUE TO SIZE LIMIT]';
    truncated = true;
  }

  // Relative path for output
  const relativePath = path.relative(config.WORKSPACE_ROOT, targetFile).replace(/\\/g, '/');

  return {
    path: relativePath,
    language: detectLanguage(targetFile),
    content: finalContent,
    lineStart: startLine,
    lineEnd: endLine,
    totalLines,
    truncated,
  };
}
