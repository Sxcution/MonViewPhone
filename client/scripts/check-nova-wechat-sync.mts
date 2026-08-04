import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

try {
  const { buildNovaWechatSyncCommand, createNovaWechatSyncQueue } = await vite.ssrLoadModule('/src/lib/novaWechatSync.ts');
  const entry = (userId: number, status = 'Live', nearby = false) => ({
    userId,
    packageName: 'com.tencent.mm',
    status,
    nearby,
    priority: 0,
  });
  const occurrences = (text: string, value: string) => text.split(value).length - 1;

  const first = buildNovaWechatSyncCommand([entry(0), entry(10, 'Risk')]);
  assert.equal(occurrences(first, 'content delete'), 1);
  assert.equal(occurrences(first, 'content insert'), 2);
  assert.equal(occurrences(first, 'REFRESH_WECHAT_STATUS'), 1);

  const firstEmpty = buildNovaWechatSyncCommand([]);
  assert.equal(occurrences(firstEmpty, 'content delete'), 1);
  assert.equal(occurrences(firstEmpty, 'content insert'), 0);

  const previous = [entry(0), entry(10, 'Risk')];
  const delta = buildNovaWechatSyncCommand([entry(0, 'Risk'), entry(11)], previous);
  assert.equal(occurrences(delta, 'content delete'), 0);
  assert.equal(occurrences(delta, 'content insert'), 3);
  assert.match(delta, /userId:i:10.*status:s:''.*nearby:b:false/);
  assert.equal(buildNovaWechatSyncCommand(previous, previous), null);

  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const sent: Array<{ status: string; force: boolean }> = [];
  let active = 0;
  let maxActive = 0;
  const queue = createNovaWechatSyncQueue(async (_udid: string, entries: any[], _previous: any, force: boolean) => {
    active++;
    maxActive = Math.max(maxActive, active);
    sent.push({ status: entries[0].status, force });
    if (sent.length === 1) await gate;
    active--;
    return true;
  });

  const initial = queue('A', [entry(0)]);
  await Promise.resolve();
  const skipped = queue('A', [entry(0, 'Risk')], true);
  const latest = queue('A', [entry(0, 'New')]);
  release();
  await Promise.all([initial, skipped, latest]);
  assert.deepEqual(sent, [
    { status: 'Live', force: true },
    { status: 'New', force: true },
  ]);
  assert.equal(maxActive, 1);
  await queue('A', [entry(0, 'New')]);
  assert.equal(sent.length, 2);

  let resume!: () => void;
  const inFlight = new Promise<void>(resolve => { resume = resolve; });
  const reverted: string[] = [];
  const revertQueue = createNovaWechatSyncQueue(async (_udid: string, entries: any[]) => {
    reverted.push(entries[0].status);
    if (reverted.length === 2) await inFlight;
    return true;
  });
  await revertQueue('R', [entry(0)]);
  const changing = revertQueue('R', [entry(0, 'Risk')]);
  await Promise.resolve();
  revertQueue('R', [entry(0)]);
  resume();
  await changing;
  assert.deepEqual(reverted, ['Live', 'Risk', 'Live']);

  let unblock!: () => void;
  const blocked = new Promise<void>(resolve => { unblock = resolve; });
  const attempts: boolean[] = [];
  const retryQueue = createNovaWechatSyncQueue(async (_udid: string, _entries: any[], _previous: any, force: boolean) => {
    attempts.push(force);
    if (attempts.length === 1) {
      await blocked;
      return false;
    }
    return true;
  });
  const failed = retryQueue('B', [entry(0)]);
  await Promise.resolve();
  retryQueue('B', [entry(0, 'Risk')]);
  unblock();
  await failed;
  assert.deepEqual(attempts, [true, true]);

  console.log('Nova WeChat delta/latest-wins self-check passed');
} finally {
  await vite.close();
}
