# Monhelper

The media batch importer and the standalone-compatible WeChat notification
listener are built into one APK:

```text
server-go\mediaimport\bin\Monhelper.apk
```

The package and provider authority stay unchanged so existing media-import
installs can be upgraded in place:

```text
package:   com.monviewphone.mediaimport
provider:  content://com.monviewphone.mediaimport
listener:  com.monviewphone.mediaimport/com.monviewphone.mediaimport.WechatNotificationListener
```

`..\Build APK\Monhelper\build-helper.ps1` builds and signs the APK into the
runtime path above. The Go
backend installs/upgrades it in user 0 and uses `install-existing` for the
secondary users that contain WeChat.

## WeChat events

The listener filters `com.tencent.mm` and writes parser-compatible lines to
logcat tag `MonWechatNotify`:

```text
HELPER_V5 WECHAT_POSTED eventId=<stable-id> user=10 key=<key> title=<title> text=<text>
HELPER_V5 WECHAT_ACTIVE eventId=<stable-id> user=10 key=<key> title=<title> text=<text>
HELPER_V5 WECHAT_REMOVED user=10 key=<key>
```

MonViewPhone opens one SSE connection to
`/api/goog/wechat-notify/events`. The backend keeps one persistent filtered
`adb logcat` process per requested online device, upgrades Monhelper if needed,
then enables its listener in every Android user that contains `com.tencent.mm`.
The parser accepts only the `HELPER_V5` marker, so an older Nova listener using
the same tag cannot create duplicate alerts. This replaces the old browser-side
`logcat -d` polling loop.

```powershell
adb -s <udid> shell cmd notification allow_listener com.monviewphone.mediaimport/com.monviewphone.mediaimport.WechatNotificationListener <userId>
```

## MonViewPhone behavior

- WeChat alerts run independently of the Visual Alert toggle.
- A new helper event plays the existing alert sound once. A replay with the
  same stable ID is ignored.
- Each tile keeps one pending item per Android profile. Multiple profiles are
  shown together using profile names, for example `WeChat (Owner)`,
  `WeChat1 (Space 1)`, and `WeChatWork`.
- Each profile label is clickable. MonViewPhone opens `com.tencent.mm` for that
  exact `userId` and clears only that item after the open command succeeds.
- Clicking a stream title clears an item only when that exact WeChat profile is
  the foreground activity. Opening the matching profile manually also clears it
  when Android removes that profile's notification; other profiles stay pending.

## Migration from Nova

The old `com.mon.wechatnotify` APK no longer exists on the current fleet. Its
listener was folded into Nova as:

```text
com.teslacoilsw.launcher/mon.space.WechatNotificationListener
```

Do not enable both WeChat listeners fleet-wide. After the Monhelper path is
verified, disable only the Nova `mon.space` listener. Never disable Nova's own
`com.teslacoilsw.launcher.notificationlistener.NotificationListener`, which is
used for notification dots.
