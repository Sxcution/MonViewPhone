import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })

try {
  const {
    formatWeChatProfileLabel,
    parseFocusedWeChatUserId,
    removeWeChatProfileAlert,
    upsertWeChatProfileAlert,
  } = await vite.ssrLoadModule('/src/lib/wechatNotifyLog.ts')

  assert.equal(formatWeChatProfileLabel('Owner', 0), 'WeChat (Owner)')
  assert.equal(formatWeChatProfileLabel('Space 1', 12), 'WeChat Space 1')
  assert.equal(formatWeChatProfileLabel('Work profile', 10), 'WeChatWork')

  const owner = { udid: 'device', userId: 0, profileName: 'Owner', id: '1', type: 'WECHAT_POSTED', key: 'a', title: 'A', text: 'Hi', timestampMs: 1 }
  const space = { udid: 'device', userId: 12, profileName: 'Space 1', id: '2', type: 'WECHAT_POSTED', key: 'b', title: 'B', text: 'Yo', timestampMs: 2 }
  let alerts = upsertWeChatProfileAlert([], space)
  alerts = upsertWeChatProfileAlert(alerts, owner)
  assert.deepEqual(alerts.map((alert: any) => alert.label), ['WeChat (Owner)', 'WeChat Space 1'])
  assert.deepEqual(removeWeChatProfileAlert(alerts, 12, 'wrong-key'), alerts)
  assert.deepEqual(removeWeChatProfileAlert(alerts, 12, 'b').map((alert: any) => alert.userId), [0])
  alerts = removeWeChatProfileAlert(alerts, 0)
  assert.deepEqual(alerts.map((alert: any) => alert.userId), [12])
  assert.equal(parseFocusedWeChatUserId('mResumedActivity: ActivityRecord{abc u12 com.tencent.mm/.ui.LauncherUI t7}'), 12)
  assert.equal(parseFocusedWeChatUserId('topResumedActivity=ActivityRecord{abc u0 com.tencent.mm/.ui.LauncherUI t8}'), 0)
  assert.equal(parseFocusedWeChatUserId('mResumedActivity: ActivityRecord{abc u12 com.android.settings/.Settings t9}'), null)
  assert.equal(parseFocusedWeChatUserId('ActivityRecord{abc u12 com.tencent.mm/.ui.LauncherUI t7}'), null)
  assert.equal(parseFocusedWeChatUserId('mResumedActivity: ActivityRecord{abc u0 com.android.settings/.Settings t9}\nmResumedActivity: ActivityRecord{abc u12 com.tencent.mm/.ui.LauncherUI t7}'), null)
  console.log('WeChat multi-profile alert self-check passed')
} finally {
  await vite.close()
}
