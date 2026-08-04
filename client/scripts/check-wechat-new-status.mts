import assert from 'node:assert/strict';
import { createServer } from 'vite';

const now = Date.UTC(2026, 7, 2);
const day = 24 * 60 * 60 * 1000;
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

try {
  const { getNextWechatNewStatusChangeAt, getWechatNewStatus } = await vite.ssrLoadModule('/src/lib/deviceAccountVault.ts');
  const account = (ageMs: number | null, isNew = false) => ageMs === null
    ? { isNew }
    : { createdAt: now - ageMs, isNew };

  assert.equal(getWechatNewStatus(account(30 * day - 1), now), 'New');
  assert.equal(getWechatNewStatus(account(30 * day), now), 'New 1');
  assert.equal(getWechatNewStatus(account(60 * day - 1), now), 'New 1');
  assert.equal(getWechatNewStatus(account(60 * day), now), 'New 2');
  assert.equal(getWechatNewStatus(account(90 * day - 1), now), 'New 2');
  assert.equal(getWechatNewStatus(account(90 * day), now), null);
  assert.equal(getWechatNewStatus(account(120 * day, true), now), null);
  assert.equal(getWechatNewStatus(account(null, true), now), 'New');
  assert.equal(getNextWechatNewStatusChangeAt(account(29 * day), now), now + day);
  assert.equal(getNextWechatNewStatusChangeAt(account(90 * day), now), null);
  console.log('WeChat New status self-check passed');
} finally {
  await vite.close();
}
