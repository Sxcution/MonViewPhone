export type WeChatNotifyEventType = 'WECHAT_POSTED' | 'WECHAT_ACTIVE' | 'WECHAT_REMOVED'

export type WeChatNotifyEvent = {
  type: WeChatNotifyEventType
  userId: number
  key: string
  title: string
  text: string
  id: string
  timestampMs?: number
}

export type MonhelperWechatEvent = WeChatNotifyEvent & {
  udid: string
  profileName: string
  timestampMs: number
}

export type WeChatProfileAlert = {
  userId: number
  profileName: string
  label: string
  event: MonhelperWechatEvent
}

const EVENT_RE =
  /\b(WECHAT_POSTED|WECHAT_ACTIVE)(?:\s+eventId=(\S+))?\s+user=(\d+)\s+key=(\S+)\s+title=(.*?)\s+text=(.*)$/
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
    const eventId = cleanLogText(match[2] || '')
    const userId = Number.parseInt(match[3], 10)
    const key = cleanLogText(match[4])
    const title = cleanLogText(match[5])
    const text = cleanLogText(match[6])
    const timestampMs = parseLogcatTimestamp(line, nowMs)

    events.push({
      type,
      userId,
      key,
      title,
      text,
      timestampMs,
      id: eventId || `${timestampMs || 'no-time'}|${type}|${key}|${title}|${text}`
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

export function formatWeChatProfileLabel(profileName: string, userId: number): string {
  const name = profileName.trim() || `User ${userId}`
  const space = /^space\s*(\d+)$/i.exec(name)
  if (space) return `WeChat Space ${space[1]}`
  if (/work/i.test(name)) return 'WeChatWork'
  return `WeChat (${name})`
}

export function upsertWeChatProfileAlert(
  alerts: WeChatProfileAlert[],
  event: MonhelperWechatEvent,
): WeChatProfileAlert[] {
  const next = alerts.filter(alert => alert.userId !== event.userId)
  next.push({
    userId: event.userId,
    profileName: event.profileName,
    label: formatWeChatProfileLabel(event.profileName, event.userId),
    event,
  })
  return next.sort((a, b) => a.userId - b.userId)
}

export function removeWeChatProfileAlert(
  alerts: WeChatProfileAlert[],
  userId: number,
  notificationKey?: string,
): WeChatProfileAlert[] {
  return alerts.filter(alert =>
    alert.userId !== userId ||
    (notificationKey !== undefined && alert.event.key !== notificationKey)
  )
}

export function parseFocusedWeChatUserId(output: string): number | null {
  const focusedLine = output
    .split(/\r?\n/)
    .find(line => /\b(?:topResumedActivity|mResumedActivity|ResumedActivity)\b/.test(line))
  if (!focusedLine) return null

  const match = /\bu(\d+)\s+com\.tencent\.mm(?:\/|\s|$)/.exec(focusedLine)
  return match ? Number.parseInt(match[1], 10) : null
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
