import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const start = source.indexOf('const ensureStayAwakeForDevice')
const end = source.indexOf('// callback_runPhysicalScreenOffWithStayAwake', start)
const flow = source.slice(start, end)

assert.notEqual(start, -1)
assert.notEqual(end, -1)
assert.match(flow, /getprop sys\.boot_completed/)
assert.match(flow, /svc power stayon true/)
assert.match(flow, /settings put global stay_on_while_plugged_in 7/)
assert.match(flow, /settings put system screen_off_timeout 2147483647/)
assert.match(flow, /dumpsys power \| grep -q mWakefulness=Awake/)
assert.match(flow, /input keyevent 224/)
assert.match(flow, /if \(!result\.success\)/)
assert.match(flow, /result\.output\.trim\(\) !== 'stay=7 timeout=2147483647'/)
assert.doesNotMatch(source, /stayAwakePreparedRef/)
assert.match(source, /physicalScreenOn:/)
assert.match(source, /setDeviceDisplayPower\(wsServer, udid, 'on'\)/)
assert.match(source, /screenOff:/)
assert.match(source, /KeyEventAction\.DOWN, 26/)
assert.match(source, /androidDeviceMap\[endpoint\]\?\.state === 'device'/)
assert.match(source, /runPhysicalScreenOffWithStayAwake\(\[endpoint\]\)/)

console.log('Stay Awake reboot self-check passed')
