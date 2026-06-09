package com.genymobile.scrcpy;

import android.os.Build;
import android.os.SystemClock;
import android.view.KeyCharacterMap;
import android.view.KeyEvent;
import android.view.MotionEvent;
import java.io.IOException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/* JADX INFO: loaded from: classes.dex */
public class Controller {
    private static final int DEFAULT_DEVICE_ID = 0;
    private static final ScheduledExecutorService EXECUTOR = Executors.newSingleThreadScheduledExecutor();
    private final Connection connection;
    private final Device device;
    private boolean keepPowerModeOff;
    private long lastTouchDown;
    private final DeviceMessageSender sender;
    private final KeyCharacterMap charMap = KeyCharacterMap.load(-1);
    private final PointersState pointersState = new PointersState();
    private final MotionEvent.PointerProperties[] pointerProperties = new MotionEvent.PointerProperties[10];
    private final MotionEvent.PointerCoords[] pointerCoords = new MotionEvent.PointerCoords[10];

    public Controller(Device device, Connection connection) {
        this.device = device;
        this.connection = connection;
        initPointers();
        this.sender = new DeviceMessageSender(connection);
    }

    private void initPointers() {
        for (int i = 0; i < 10; i++) {
            MotionEvent.PointerProperties pointerProperties = new MotionEvent.PointerProperties();
            pointerProperties.toolType = 1;
            MotionEvent.PointerCoords pointerCoords = new MotionEvent.PointerCoords();
            pointerCoords.orientation = 0.0f;
            pointerCoords.size = 0.0f;
            this.pointerProperties[i] = pointerProperties;
            this.pointerCoords[i] = pointerCoords;
        }
    }

    public DeviceMessageSender getSender() {
        return this.sender;
    }

    public void handleEvent(ControlMessage controlMessage) {
        switch (controlMessage.getType()) {
            case 0:
                if (this.device.supportsInputEvents()) {
                    injectKeycode(controlMessage.getAction(), controlMessage.getKeycode(), controlMessage.getRepeat(), controlMessage.getMetaState());
                }
                break;
            case 1:
                if (this.device.supportsInputEvents()) {
                    injectText(controlMessage.getText());
                }
                break;
            case 2:
                if (this.device.supportsInputEvents()) {
                    injectTouch(controlMessage.getAction(), controlMessage.getPointerId(), controlMessage.getPosition(), controlMessage.getPressure(), controlMessage.getButtons());
                }
                break;
            case 3:
                if (this.device.supportsInputEvents()) {
                    injectScroll(controlMessage.getPosition(), controlMessage.getHScroll(), controlMessage.getVScroll());
                }
                break;
            case 4:
                if (this.device.supportsInputEvents()) {
                    pressBackOrTurnScreenOn(controlMessage.getAction());
                }
                break;
            case ControlMessage.TYPE_EXPAND_NOTIFICATION_PANEL /* 5 */:
                Device.expandNotificationPanel();
                break;
            case ControlMessage.TYPE_EXPAND_SETTINGS_PANEL /* 6 */:
                Device.expandSettingsPanel();
                break;
            case ControlMessage.TYPE_COLLAPSE_PANELS /* 7 */:
                Device.collapsePanels();
                break;
            case 8:
                String clipboardText = Device.getClipboardText();
                if (clipboardText != null) {
                    try {
                        this.connection.sendDeviceMessage(DeviceMessage.createClipboard(clipboardText));
                    } catch (IOException unused) {
                        Ln.w("");
                        return;
                    }
                }
                break;
            case ControlMessage.TYPE_SET_CLIPBOARD /* 9 */:
                setClipboard(controlMessage.getText(), controlMessage.getPaste());
                break;
            case 10:
                if (this.device.supportsInputEvents()) {
                    int action = controlMessage.getAction();
                    if (Device.setScreenPowerMode(action)) {
                        this.keepPowerModeOff = action == 0;
                        StringBuilder sb = new StringBuilder();
                        sb.append("Device screen turned ");
                        sb.append(action == 0 ? "off" : "on");
                        Ln.i(sb.toString());
                    }
                }
                break;
            case ControlMessage.TYPE_ROTATE_DEVICE /* 11 */:
                Device.rotateDevice();
                break;
        }
    }

    private boolean injectKeycode(int i, int i2, int i3, int i4) {
        if (this.keepPowerModeOff && i == 1 && (i2 == 26 || i2 == 224)) {
            schedulePowerModeOff();
        }
        return this.device.injectKeyEvent(i, i2, i3, i4);
    }

    private boolean injectChar(char c) {
        String strDecompose = KeyComposition.decompose(c);
        KeyEvent[] events = this.charMap.getEvents(strDecompose != null ? strDecompose.toCharArray() : new char[]{c});
        if (events == null) {
            return false;
        }
        for (KeyEvent keyEvent : events) {
            if (!this.device.injectEvent(keyEvent)) {
                return false;
            }
        }
        return true;
    }

    private int injectText(String str) {
        int i = 0;
        for (char c : str.toCharArray()) {
            if (injectChar(c)) {
                i++;
            } else {
                Ln.w("Could not inject char u+" + String.format("%04x", Integer.valueOf(c)));
            }
        }
        return i;
    }

    private boolean injectTouch(int i, long j, Position position, float f, int i2) {
        int i3 = i;
        long jUptimeMillis = SystemClock.uptimeMillis();
        Point physicalPoint = this.device.getPhysicalPoint(position);
        if (physicalPoint == null) {
            Ln.w("Ignore touch event, it was generated for a different device size");
            return false;
        }
        int pointerIndex = this.pointersState.getPointerIndex(j);
        if (pointerIndex == -1) {
            Ln.w("Too many pointers for touch event");
            return false;
        }
        Pointer pointer = this.pointersState.get(pointerIndex);
        pointer.setPoint(physicalPoint);
        pointer.setPressure(f);
        pointer.setUp(i3 == 1);
        int iUpdate = this.pointersState.update(this.pointerProperties, this.pointerCoords);
        if (iUpdate == 1) {
            if (i3 == 0) {
                this.lastTouchDown = jUptimeMillis;
            }
        } else if (i3 == 1) {
            i3 = (pointerIndex << 8) | 6;
        } else if (i3 == 0) {
            i3 = (pointerIndex << 8) | 5;
        }
        int i4 = i3;
        int i5 = (i2 & (-2)) != 0 ? 8194 : 4098;
        return this.device.injectEvent(MotionEvent.obtain(this.lastTouchDown, jUptimeMillis, i4, iUpdate, this.pointerProperties, this.pointerCoords, 0, i5 != 8194 ? 0 : i2, 1.0f, 1.0f, 0, 0, i5, 0));
    }

    private boolean injectScroll(Position position, int i, int i2) {
        long jUptimeMillis = SystemClock.uptimeMillis();
        Point physicalPoint = this.device.getPhysicalPoint(position);
        if (physicalPoint == null) {
            return false;
        }
        this.pointerProperties[0].id = 0;
        MotionEvent.PointerCoords pointerCoords = this.pointerCoords[0];
        pointerCoords.x = physicalPoint.getX();
        pointerCoords.y = physicalPoint.getY();
        pointerCoords.setAxisValue(10, i);
        pointerCoords.setAxisValue(9, i2);
        return this.device.injectEvent(MotionEvent.obtain(this.lastTouchDown, jUptimeMillis, 8, 1, this.pointerProperties, this.pointerCoords, 0, 0, 1.0f, 1.0f, 0, 0, 8194, 0));
    }

    private static void schedulePowerModeOff() {
        EXECUTOR.schedule(new Runnable() { // from class: com.genymobile.scrcpy.Controller.1
            @Override // java.lang.Runnable
            public void run() {
                Ln.i("Forcing screen off");
                Device.setScreenPowerMode(0);
            }
        }, 200L, TimeUnit.MILLISECONDS);
    }

    private boolean pressBackOrTurnScreenOn(int i) {
        if (Device.isScreenOn()) {
            return this.device.injectKeyEvent(i, 4, 0, 0);
        }
        if (i != 0) {
            return true;
        }
        if (this.keepPowerModeOff) {
            schedulePowerModeOff();
        }
        return this.device.pressReleaseKeycode(26);
    }

    private boolean setClipboard(String str, boolean z) {
        boolean clipboardText = this.device.setClipboardText(str);
        if (clipboardText) {
            Ln.i("Device clipboard set");
        }
        if (z && Build.VERSION.SDK_INT >= 24 && this.device.supportsInputEvents()) {
            this.device.pressReleaseKeycode(279);
        }
        return clipboardText;
    }

    public void turnScreenOn() {
        this.device.pressReleaseKeycode(26);
    }
}
