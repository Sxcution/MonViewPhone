import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { resolveSafePath, isDenylisted } from '../src/utils/paths.js';
import { config } from '../src/config.js';

describe('Paths Utility Security Tests', () => {
  it('should resolve a valid relative path within workspace', () => {
    const resolved = resolveSafePath('src/index.ts');
    expect(resolved).toContain(path.join('src', 'index.ts'));
  });

  it('should block path traversal outside workspace', () => {
    expect(() => {
      resolveSafePath('../outside-file.txt');
    }).toThrow('Access denied: Path is outside the workspace root.');

    expect(() => {
      resolveSafePath('../../Windows/System32');
    }).toThrow('Access denied: Path is outside the workspace root.');
  });

  it('should block paths targeting sensitive folders in denylist', () => {
    expect(() => {
      resolveSafePath('node_modules/express/index.js');
    }).toThrow('Access denied: Path contains restricted files or directories.');

    expect(() => {
      resolveSafePath('.git/config');
    }).toThrow('Access denied: Path contains restricted files or directories.');

    expect(() => {
      resolveSafePath('dist/index.js');
    }).toThrow('Access denied: Path contains restricted files or directories.');
  });

  it('should detect denylisted files properly', () => {
    // Check .env files
    const envFile = path.resolve(config.WORKSPACE_ROOT, '.env');
    const envDevFile = path.resolve(config.WORKSPACE_ROOT, '.env.development');
    expect(isDenylisted(envFile)).toBe(true);
    expect(isDenylisted(envDevFile)).toBe(true);

    // Check SSH keys
    const rsaKey = path.resolve(config.WORKSPACE_ROOT, 'id_rsa');
    expect(isDenylisted(rsaKey)).toBe(true);

    // Check certificate extensions
    const pemCert = path.resolve(config.WORKSPACE_ROOT, 'cert.pem');
    const keyFile = path.resolve(config.WORKSPACE_ROOT, 'ssl.key');
    expect(isDenylisted(pemCert)).toBe(true);
    expect(isDenylisted(keyFile)).toBe(true);

    // Check safe files
    const readme = path.resolve(config.WORKSPACE_ROOT, 'README.md');
    expect(isDenylisted(readme)).toBe(false);
  });
});
