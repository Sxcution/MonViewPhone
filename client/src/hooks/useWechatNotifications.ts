import { useCallback, useEffect, useRef, useState } from 'react'
import { playAlertSound, requestNotificationPermission } from '@/lib/visualAlertEngine'
import { connectMonhelperWechatEvents, openApp, runAdbCommandApi } from '@/lib/serverApi'
import {
  parseFocusedWeChatUserId,
  removeWeChatProfileAlert,
  upsertWeChatProfileAlert,
  type MonhelperWechatEvent,
  type WeChatProfileAlert,
} from '@/lib/wechatNotifyLog'

type WeChatAlertsByUdid = Record<string, WeChatProfileAlert[]>

type UseWechatNotificationsOpts = {
  wsServer: string
  registeredUdids: string[]
  orderMap: Map<string, number>
}

export function useWechatNotifications({
  wsServer,
  registeredUdids,
  orderMap,
}: UseWechatNotificationsOpts) {
  const [alertsByUdid, setAlertsByUdid] = useState<WeChatAlertsByUdid>({})
  const seenEventIdsRef = useRef(new Set<string>())
  const alertsByUdidRef = useRef(alertsByUdid)
  const orderMapRef = useRef(orderMap)
  alertsByUdidRef.current = alertsByUdid
  orderMapRef.current = orderMap

  const clearWechatAlert = useCallback((udid: string, userId: number, notificationKey?: string) => {
    setAlertsByUdid(previous => {
      const remaining = removeWeChatProfileAlert(previous[udid] ?? [], userId, notificationKey)
      if (remaining.length) return { ...previous, [udid]: remaining }
      const next = { ...previous }
      delete next[udid]
      return next
    })
  }, [])

  const openWechatAlert = useCallback(async (udid: string, userId: number) => {
    try {
      await openApp(wsServer, udid, userId, 'com.tencent.mm')
    } catch (error) {
      console.warn(`Failed to open WeChat user ${userId} on ${udid}:`, error)
      return
    }
    clearWechatAlert(udid, userId)
  }, [clearWechatAlert, wsServer])

  const acknowledgeFocusedWechatAlert = useCallback(async (udid: string) => {
    if (!alertsByUdidRef.current[udid]?.length) return

    const result = await runAdbCommandApi(
      wsServer,
      udid,
      "dumpsys activity activities | grep -m 1 -E 'topResumedActivity|mResumedActivity|ResumedActivity'",
      'shell',
    ).catch(() => null)
    if (!result?.success) return

    const userId = parseFocusedWeChatUserId(result.output)
    if (userId === null || !alertsByUdidRef.current[udid]?.some(alert => alert.userId === userId)) return
    clearWechatAlert(udid, userId)
  }, [clearWechatAlert, wsServer])

  const handleEvent = useCallback((event: MonhelperWechatEvent) => {
    if (event.type === 'WECHAT_REMOVED') {
      clearWechatAlert(event.udid, event.userId, event.key)
      return
    }

    const seenKey = `${event.udid}|${event.userId}|${event.id}`
    const seen = seenEventIdsRef.current
    if (seen.has(seenKey)) return
    seen.add(seenKey)
    if (seen.size > 1000) {
      const oldest = seen.values().next().value
      if (oldest) seen.delete(oldest)
    }

    setAlertsByUdid(previous => ({
      ...previous,
      [event.udid]: upsertWeChatProfileAlert(previous[event.udid] ?? [], event),
    }))
    playAlertSound()

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const deviceNumber = orderMapRef.current.get(event.udid) ?? 0
      const sender = event.title || 'WeChat'
      const message = event.text ? `: ${event.text}` : ''
      try {
        const notification = new Notification('WeChat notification', {
          body: `Máy ${String(deviceNumber).padStart(2, '0')} · ${event.profileName} · ${sender}${message}`,
          icon: '/favicon.ico',
          tag: `wechat-${event.udid}-${event.userId}`,
        })
        notification.onclick = () => {
          window.focus()
          void openWechatAlert(event.udid, event.userId)
          notification.close()
        }
      } catch {
        // The in-stream badge remains the primary alert UI.
      }
    }
  }, [clearWechatAlert, openWechatAlert])

  const monitoredKey = Array.from(new Set(registeredUdids)).sort().join('\n')
  useEffect(() => {
    requestNotificationPermission()
    const monitoredUdids = monitoredKey ? monitoredKey.split('\n') : []
    if (!monitoredUdids.length) return

    const source = connectMonhelperWechatEvents(wsServer, monitoredUdids, handleEvent)
    return () => source.close()
  }, [handleEvent, monitoredKey, wsServer])

  return { alertsByUdid, acknowledgeFocusedWechatAlert, openWechatAlert }
}
