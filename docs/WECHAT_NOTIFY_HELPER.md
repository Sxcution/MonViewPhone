# Mon WeChat Notify Helper Integration

This MonViewPhone feature depends on a separate Android helper APK:

```text
C:\Users\Mon\Desktop\Protect\MonWechatNotifyHelper\build\MonWechatNotifyHelper.apk
```

A copy for the APK build archive is also kept at:

```text
C:\Users\Mon\Desktop\Protect\Build APK\MonWechatNotifyHelper\MonWechatNotifyHelper.apk
```

## What It Does

`MonWechatNotifyHelper.apk` runs on the phone as package:

```text
com.mon.wechatnotify
```

It uses Android `NotificationListenerService` to detect WeChat notifications
from:

```text
com.tencent.mm
```

The helper writes detection lines to logcat with tag:

```text
MonWechatNotify
```

MonViewPhone reads those logcat lines and shows a tile badge similar to Visual
Alert. The badge text is formatted like:

```text
Message: User 10 | Sender: message text
```

When the badge is clicked, MonViewPhone opens WeChat on the phone using the
detected Android user:

```text
am start --user <userId> -n com.tencent.mm/com.tencent.mm.ui.LauncherUI
```

## Phone Requirement

The phone must have `MonWechatNotifyHelper.apk` installed and its notification
listener enabled. The current intended setup is:

- Install helper in user 0.
- Enable notification listener for user 0.
- Do not install helper into clone users unless specifically testing; user 0
  can see clone-user WeChat notifications on the tested A13 ROM.

Example enable command:

```powershell
adb -s <udid> shell cmd notification allow_listener com.mon.wechatnotify/com.mon.wechatnotify.WechatNotificationListener 0
```

## MonViewPhone Code Names

Use these names to find the integration quickly:

- Constants: `MON_WECHAT_NOTIFY_HELPER_*`
- Poll function: `pollMonWechatNotifyHelperLogs`
- Badge click function: `handleMonWechatNotifyBadgeClick`
- Log parser file: `client/src/lib/wechatNotifyLog.ts`
- Tile badge props:
  - `visualAlertSource="wechat"`
  - `visualAlertTargetUserId=<userId>`

## Important Behavior

- This is notification-based. If WeChat does not create an Android
  notification, the helper will not see that message.
- Visual Alert badges still behave normally. Only badges with
  `source: "wechat"` open WeChat on click.
- MonViewPhone polls helper logs in small batches to avoid overloading ADB on a
  large device fleet.
