const NOVA_PACKAGE = 'com.teslacoilsw.launcher'
const STATUS_URI = `content://${NOVA_PACKAGE}.wechatstatus/status`

export type NovaWechatStatusEntry = {
  userId: number
  packageName: string
  status: string
  nearby: boolean
  priority: number
}

type SyncRequest = { entries: NovaWechatStatusEntry[]; fingerprint: string; force: boolean }
type SyncedState = Omit<SyncRequest, 'force'>
type Send = (
  udid: string,
  entries: NovaWechatStatusEntry[],
  previous: NovaWechatStatusEntry[] | undefined,
  force: boolean,
) => Promise<boolean>

const key = (entry: NovaWechatStatusEntry) => `${entry.userId}:${entry.packageName}`
const quote = (value: string) => `'${String(value).replace(/'/g, `'\\''`)}'`
const fingerprint = (entries: NovaWechatStatusEntry[]) => JSON.stringify(
  entries.map(({ userId, packageName, status, nearby }) => ({ userId, packageName, status, nearby }))
)

function insertCommand(entry: NovaWechatStatusEntry): string {
  return [
    `content insert --uri ${quote(STATUS_URI)}`,
    `--bind userId:i:${entry.userId}`,
    `--bind packageName:s:${quote(entry.packageName)}`,
    `--bind status:s:${quote(entry.status)}`,
    `--bind nearby:b:${entry.nearby ? 'true' : 'false'}`,
  ].join(' ')
}

export function buildNovaWechatSyncCommand(
  entries: NovaWechatStatusEntry[],
  previous?: NovaWechatStatusEntry[],
  force = false,
): string | null {
  const full = force || previous === undefined
  const nextKeys = new Set(entries.map(key))
  const previousByKey = new Map((previous || []).map(entry => [key(entry), entry]))
  const writes = full ? entries : [
    ...entries.filter(entry => {
      const old = previousByKey.get(key(entry))
      return !old || old.status !== entry.status || old.nearby !== entry.nearby
    }),
    ...(previous || [])
      .filter(entry => !nextKeys.has(key(entry)))
      .map(entry => ({ ...entry, status: '', nearby: false, priority: 0 })),
  ]
  if (!full && !writes.length) return null

  return [
    `if ! cmd package path ${NOVA_PACKAGE} >/dev/null 2>&1; then echo NOVA_MISSING; exit 0; fi`,
    ...(full ? [`content delete --uri ${quote(STATUS_URI)}`] : []),
    ...writes.map(insertCommand),
    `am broadcast -a ${NOVA_PACKAGE}.REFRESH_WECHAT_STATUS -n ${NOVA_PACKAGE}/mon.space.WechatStatusReceiver >/dev/null 2>&1`,
  ].join('\n')
}

export function createNovaWechatSyncQueue(send: Send) {
  const synced = new Map<string, SyncedState>()
  const queued = new Map<string, SyncRequest>()
  const running = new Map<string, Promise<void>>()
  const dirty = new Set<string>()

  return function enqueue(udid: string, entries: NovaWechatStatusEntry[], force = false): Promise<void> {
    const nextFingerprint = fingerprint(entries)
    const waiting = queued.get(udid)
    const active = running.get(udid)
    if (!force && !waiting && !active && !dirty.has(udid) && synced.get(udid)?.fingerprint === nextFingerprint) {
      return Promise.resolve()
    }
    queued.set(udid, { entries, fingerprint: nextFingerprint, force: force || !!waiting?.force })

    if (active) return active

    const task = (async () => {
      while (queued.has(udid)) {
        const request = queued.get(udid)!
        queued.delete(udid)
        const previous = synced.get(udid)
        const full = request.force || dirty.has(udid) || !previous
        if (!full && previous.fingerprint === request.fingerprint) continue

        let ok = false
        try {
          ok = await send(udid, request.entries, previous?.entries, full)
        } catch {}
        if (ok) {
          synced.set(udid, { entries: request.entries, fingerprint: request.fingerprint })
          dirty.delete(udid)
        } else {
          dirty.add(udid)
        }
      }
    })()
    running.set(udid, task)
    void task.finally(() => {
      if (running.get(udid) === task) running.delete(udid)
    })
    return task
  }
}
