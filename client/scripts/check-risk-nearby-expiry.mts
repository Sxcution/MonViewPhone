import assert from 'node:assert/strict';
import { createServer } from 'vite';

const now = Date.UTC(2026, 6, 30);
const day = 24 * 60 * 60 * 1000;
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

try {
  const { expireDueRiskAccounts } = await vite.ssrLoadModule('/src/lib/deviceAccountVault.ts');
  const vault = {
    version: 1,
    devices: {
      due: {
        udid: 'due',
        updatedAt: 0,
        platforms: {
          wechat: [
            {
              id: 'due-account',
              status: 'Risk',
              notice: { title: 'Account Risk', content: '', dueDate: now },
              history: [],
            },
          ],
        },
      },
      future: {
        udid: 'future',
        updatedAt: 0,
        platforms: {
          wechat: [
            {
              id: 'future-account',
              status: 'Risk',
              notice: { title: 'Account Risk', content: '', dueDate: now + day },
              history: [],
            },
          ],
        },
      },
      dueNearby: {
        udid: 'dueNearby',
        updatedAt: 0,
        platforms: {
          wechat: [
            {
              id: 'due-nearby-account',
              status: 'Risk',
              notice: {
                title: 'Dưỡng Hiện',
                content: 'Dưỡng Hiện',
                days: 31,
                startDate: now - 31 * day,
                dueDate: now,
              },
              history: [{ id: 'risk', action: 'Risk Nearby', timestamp: now - 31 * day }],
            },
          ],
        },
      },
    },
  };

  const result = expireDueRiskAccounts(vault, now);
  assert.deepEqual(result.changedUdids, ['due', 'dueNearby']);
  assert.equal(result.nextDueDate, now + day);
  for (const udid of result.changedUdids) {
    const account = vault.devices[udid].platforms.wechat[0];
    assert.equal(account.status, 'Live');
    assert.ok(account.notice);
    assert.equal(account.history.at(-1)?.action, 'Live');
  }
  assert.equal(vault.devices.future.platforms.wechat[0].status, 'Risk');
  console.log('Risk Nearby expiry self-check passed');
} finally {
  await vite.close();
}
