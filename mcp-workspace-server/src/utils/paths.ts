import path from 'path';
import { config } from '../config.js';

// Convert all paths to lowercase for Windows path comparison
const isWindows = process.platform === 'win32';

/**
 * Normalizes a path by resolving it relative to the workspace root.
 * Ensures the resolved path is strictly within the workspace root.
 * Throws an error if path traversal is detected or if path is outside workspace.
 */
export function resolveSafePath(inputPath: string): string {
  // 1. Resolve the path relative to the WORKSPACE_ROOT
  const absolutePath = path.resolve(config.WORKSPACE_ROOT, inputPath);

  // 2. Perform path traversal check
  const rootDir = config.WORKSPACE_ROOT;
  
  const rootCompare = isWindows ? rootDir.toLowerCase() : rootDir;
  const pathCompare = isWindows ? absolutePath.toLowerCase() : absolutePath;

  // Check if the resolved path starts with the workspace root directory
  // Also handle cases where rootDir is 'C:\project' and absolutePath is 'C:\project-other'
  const isInside = pathCompare === rootCompare || pathCompare.startsWith(rootCompare + path.sep);
  
  if (!isInside) {
    throw new Error('Access denied: Path is outside the workspace root.');
  }

  // 3. Denylist checks
  if (isDenylisted(absolutePath)) {
    throw new Error('Access denied: Path contains restricted files or directories.');
  }

  return absolutePath;
}

/**
 * Checks if the resolved absolute path targets any denylisted directories or files.
 */
export function isDenylisted(resolvedPath: string): boolean {
  const rootDir = config.WORKSPACE_ROOT;
  const relativePath = path.relative(rootDir, resolvedPath);
  
  // Split relative path into segments
  const segments = relativePath.split(/[/\\]/);

  // 1. Check directories/segments
  const blockedSegments = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
  ];

  for (const segment of segments) {
    const s = segment.toLowerCase();
    if (blockedSegments.includes(s)) {
      return true;
    }
  }

  // 2. Check individual filename
  const filename = path.basename(resolvedPath).toLowerCase();

  // Block .env files (.env, .env.local, .env.production, etc.)
  if (filename === '.env' || filename.startsWith('.env.')) {
    return true;
  }

  // Block SSH keys
  if (filename === 'id_rsa' || filename === 'id_ed25519') {
    return true;
  }

  // Block certificate/key extensions
  if (
    filename.endsWith('.pem') ||
    filename.endsWith('.key') ||
    filename.endsWith('.p12')
  ) {
    return true;
  }

  return false;
}
