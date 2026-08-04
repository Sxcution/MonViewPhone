export type QuickAudioAction = 'mute' | 'soundOn'

const QUICK_AUDIO_SHELL = String.raw`
probe_volume() {
  stream="$1"
  VOLUME_OUT="$(cmd media_session volume --stream "$stream" --get 2>&1)"
  VOLUME_CTRL=cmd
  case "$VOLUME_OUT" in
    *"range ["*) ;;
    *)
      VOLUME_OUT="$(media volume --stream "$stream" --get 2>&1)"
      VOLUME_CTRL=legacy
      ;;
  esac
  VOLUME_PARSED="$(printf '%s\n' "$VOLUME_OUT" | sed -n 's/.*volume is \([0-9-]*\) in range \[\([0-9-]*\)\.\.\([0-9-]*\)\].*/\1 \2 \3/p' | tail -n 1)"
  [ -n "$VOLUME_PARSED" ] || return 1
  set -- $VOLUME_PARSED
  VOLUME_CURRENT="$1"
  VOLUME_MIN="$2"
  VOLUME_MAX="$3"
}

set_volume_checked() {
  stream="$1"
  target="$2"
  allow_below="$3"
  probe_volume "$stream" || return 1
  if [ "$VOLUME_CTRL" = cmd ]; then
    cmd media_session volume --stream "$stream" --set "$target" >/dev/null 2>&1
  else
    media volume --stream "$stream" --set "$target" >/dev/null 2>&1
  fi
  probe_volume "$stream" || return 1
  if [ "$VOLUME_CURRENT" != "$target" ]; then
    if [ "$allow_below" = 1 ]; then
      [ "$VOLUME_CURRENT" -le "$target" ] ||
        [ "$(settings get global zen_mode 2>/dev/null)" = 2 ]
      return
    fi
    if [ "$(getprop ro.build.version.sdk)" != 34 ]; then
      return 1
    fi
    service call audio 12 i32 "$stream" i32 "$target" i32 0 s16 com.android.shell >/dev/null 2>&1
    probe_volume "$stream" || return 1
  fi
  [ "$VOLUME_CURRENT" = "$target" ] || {
    [ "$allow_below" = 1 ] && [ "$VOLUME_CURRENT" -le "$target" ]
  }
}

set_dnd_checked() {
  target="$1"
  if [ "$target" = 0 ]; then
    cmd notification set_dnd off >/dev/null 2>&1 || true
  else
    cmd notification set_dnd none >/dev/null 2>&1 || true
  fi
  sleep 1
  if [ "$(settings get global zen_mode 2>/dev/null)" != "$target" ] &&
     [ "$(getprop ro.build.version.sdk)" = 29 ]; then
    service call notification 96 i32 "$target" i32 0 s16 monviewphone >/dev/null 2>&1
    sleep 1
  fi
  [ "$(settings get global zen_mode 2>/dev/null)" = "$target" ]
}

AUDIO_MODE=__AUDIO_MODE__
if [ "$AUDIO_MODE" = mute ]; then
  DND_TARGET=2
  ALLOW_BELOW=1
else
  DND_TARGET=0
  ALLOW_BELOW=0
fi

set_dnd_checked "$DND_TARGET" || {
  echo "DND failed: target=$DND_TARGET current=$(settings get global zen_mode 2>/dev/null)"
  exit 31
}

AUDIO_RESULT=""
for stream in 1 2 3 4 5; do
  probe_volume "$stream" || {
    echo "Volume probe failed: stream=$stream"
    exit 32
  }
  if [ "$AUDIO_MODE" = mute ]; then
    target="$VOLUME_MIN"
  else
    target="$VOLUME_MAX"
  fi
  set_volume_checked "$stream" "$target" "$ALLOW_BELOW" || {
    echo "Volume set failed: stream=$stream target=$target current=$VOLUME_CURRENT"
    exit 33
  }
  AUDIO_RESULT="$AUDIO_RESULT stream$stream=$VOLUME_CURRENT/$target"
done

echo "OK mode=$AUDIO_MODE zen=$(settings get global zen_mode 2>/dev/null)$AUDIO_RESULT"
`

export function buildQuickAudioShell(action: QuickAudioAction): string {
  return QUICK_AUDIO_SHELL.replace('__AUDIO_MODE__', action)
}
