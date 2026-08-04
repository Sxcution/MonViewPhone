import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { getRenderWatchdogAction } = await vite.ssrLoadModule('/src/components/tile/useTileStream.ts');

  assert.equal(getRenderWatchdogAction(30_000, 0, 0, 18_000, 12_000), null);
  assert.equal(getRenderWatchdogAction(18_999, 1_000, 0, 18_000, 12_000), null);
  assert.equal(getRenderWatchdogAction(19_000, 1_000, 0, 18_000, 12_000), 'restart-decoder');
  assert.equal(getRenderWatchdogAction(20_000, 1_000, 10_000, 18_000, 12_000), null);
  assert.equal(getRenderWatchdogAction(22_000, 0, 10_000, 18_000, 12_000), 'reconnect');

  console.log('Stream render watchdog self-check passed');
} finally {
  await vite.close();
}
