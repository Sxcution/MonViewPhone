export type WeChatNotifyEventType = 'WECHAT_POSTED' | 'WECHAT_ACTIVE'

export type WeChatNotifyEvent = {
  type: WeChatNotifyEventType
  userId: number
  key: string
  title: string
  text: string
  id: string
  timestampMs?: number
}

const EVENT_RE =
  /\b(WECHAT_POSTED|WECHAT_ACTIVE)\s+user=(\d+)\s+key=(\S+)\s+title=(.*?)\s+text=(.*)$/
const LOGCAT_TIME_RE = /^(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s+/

export function parseWeChatNotifyLog(output: string, nowMs = Date.now()): WeChatNotifyEvent[] {
  if (!output.trim()) return []

  const events: WeChatNotifyEvent[] = []
  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('---------')) continue

    const match = EVENT_RE.exec(line)
    if (!match) continue

    const type = match[1] as WeChatNotifyEventType
    const userId = Number.parseInt(match[2], 10)
    const key = cleanLogText(match[3])
    const title = cleanLogText(match[4])
    const text = cleanLogText(match[5])
    const timestampMs = parseLogcatTimestamp(line, nowMs)

    events.push({
      type,
      userId,
      key,
      title,
      text,
      timestampMs,
      id: `${timestampMs || 'no-time'}|${type}|${key}|${title}|${text}`
    })
  }

  return events
}

export function formatWeChatNotifyLabel(event: WeChatNotifyEvent): string {
  const sender = event.title || 'WeChat'
  const message = event.text ? `: ${event.text}` : ''
  return trimLabel(`Message: User ${event.userId} | ${sender}${message}`, 82)
}

export function isRecentWeChatNotifyEvent(
  event: WeChatNotifyEvent,
  nowMs = Date.now(),
  maxAgeMs = 10 * 60 * 1000
): boolean {
  if (!event.timestampMs) return true
  return Math.abs(nowMs - event.timestampMs) <= maxAgeMs
}

function cleanLogText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function trimLabel(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

function parseLogcatTimestamp(line: string, nowMs: number): number | undefined {
  const match = LOGCAT_TIME_RE.exec(line)
  if (!match) return undefined

  const now = new Date(nowMs)
  const year = now.getFullYear()
  const month = Number.parseInt(match[1], 10) - 1
  const day = Number.parseInt(match[2], 10)
  const hour = Number.parseInt(match[3], 10)
  const minute = Number.parseInt(match[4], 10)
  const second = Number.parseInt(match[5], 10)
  const ms = Number.parseInt(match[6], 10)
  const parsed = new Date(year, month, day, hour, minute, second, ms).getTime()

  // Handle a year boundary if the phone log buffer crosses New Year.
  if (parsed - nowMs > 30 * 24 * 60 * 60 * 1000) {
    return new Date(year - 1, month, day, hour, minute, second, ms).getTime()
  }
  return parsed
}
