import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { buildQuickAudioShell } = await vite.ssrLoadModule('/src/lib/quickAudio.ts')
  const mute = buildQuickAudioShell('mute')
  const soundOn = buildQuickAudioShell('soundOn')

  assert.match(mute, /AUDIO_MODE=mute/)
  assert.match(soundOn, /AUDIO_MODE=soundOn/)
  assert.match(mute, /VOLUME_MIN/)
  assert.match(soundOn, /VOLUME_MAX/)
  assert.match(mute, /service call notification 96/)
  assert.match(soundOn, /getprop ro\.build\.version\.sdk\)" != 34/)
  assert.match(soundOn, /service call audio 12/)
  assert.doesNotMatch(mute, /__AUDIO_MODE__/)
  assert.doesNotMatch(soundOn, /--set (7|15)(?:\s|$)/)

  console.log('Quick audio command self-check passed')
} finally {
  await vite.close()
}
