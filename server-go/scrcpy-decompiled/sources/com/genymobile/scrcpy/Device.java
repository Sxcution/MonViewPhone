package com.genymobile.scrcpy;

import android.content.IOnPrimaryClipChangedListener;
import android.graphics.Rect;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import android.view.IRotationWatcher;
import android.view.InputEvent;
import android.view.KeyEvent;
import com.genymobile.scrcpy.wrappers.ClipboardManager;
import com.genymobile.scrcpy.wrappers.ContentProvider;
import com.genymobile.scrcpy.wrappers.InputManager;
import com.genymobile.scrcpy.wrappers.ServiceManager;
import com.genymobile.scrcpy.wrappers.SurfaceControl;
import com.genymobile.scrcpy.wrappers.WindowManager;
import java.util.concurrent.atomic.AtomicBoolean;

/* JADX INFO: loaded from: classes.dex */
public final class Device {
    public static final int LOCK_VIDEO_ORIENTATION_INITIAL = -2;
    public static final int LOCK_VIDEO_ORIENTATION_UNLOCKED = -1;
    public static final int POWER_MODE_NORMAL = 2;
    public static final int POWER_MODE_OFF = 0;
    private static final ServiceManager SERVICE_MANAGER = new ServiceManager();
    private IOnPrimaryClipChangedListener clipChangedListener;
    private ClipboardListener clipboardListener;
    private final int displayId;
    private final AtomicBoolean isSettingClipboard = new AtomicBoolean();
    private final int layerStack;
    private RotationListener rotationListener;
    private IRotationWatcher rotationWatcher;
    private ScreenInfo screenInfo;
    private final boolean supportsInputEvents;

    public interface ClipboardListener {
        void onClipboardTextChanged(String str);
    }

    public interface RotationListener {
        void onRotationChanged(int i);
    }

    public Device(Options options, final VideoSettings videoSettings) {
        int displayId = videoSettings.getDisplayId();
        this.displayId = displayId;
        DisplayInfo displayInfo = getDisplayInfo(displayId);
        if (displayInfo == null) {
            throw new InvalidDisplayIdException(this.displayId, getDisplayIds());
        }
        int flags = displayInfo.getFlags();
        this.screenInfo = ScreenInfo.computeScreenInfo(displayInfo, videoSettings);
        this.layerStack = displayInfo.getLayerStack();
        this.rotationWatcher = new IRotationWatcher.Stub() { // from class: com.genymobile.scrcpy.Device.1
            @Override // android.view.IRotationWatcher
            public void onRotationChanged(int i) {
                synchronized (Device.this) {
                    Device.this.applyNewVideoSetting(videoSettings);
                    if (Device.this.rotationListener != null) {
                        Device.this.rotationListener.onRotationChanged(i);
                    }
                }
            }
        };
        SERVICE_MANAGER.getWindowManager().registerRotationWatcher(this.rotationWatcher, this.displayId);
        if (options.getControl()) {
            ClipboardManager clipboardManager = SERVICE_MANAGER.getClipboardManager();
            IOnPrimaryClipChangedListener.Stub stub = new IOnPrimaryClipChangedListener.Stub() { // from class: com.genymobile.scrcpy.Device.2
                @Override // android.content.IOnPrimaryClipChangedListener
                public void dispatchPrimaryClipChanged() {
                    String clipboardText;
                    if (Device.this.isSettingClipboard.get()) {
                        return;
                    }
                    synchronized (Device.this) {
                        if (Device.this.clipboardListener != null && (clipboardText = Device.getClipboardText()) != null) {
                            Device.this.clipboardListener.onClipboardTextChanged(clipboardText);
                        }
                    }
                }
            };
            this.clipChangedListener = stub;
            if (clipboardManager != null) {
                clipboardManager.addPrimaryClipChangedListener(stub);
            } else {
                Ln.w("No clipboard manager, copy-paste between device and computer will not work");
            }
        }
        boolean z = true;
        if ((flags & 1) == 0) {
            Ln.w("Display doesn't have FLAG_SUPPORTS_PROTECTED_BUFFERS flag, mirroring can be restricted");
        }
        if (this.displayId != 0 && Build.VERSION.SDK_INT < 29) {
            z = false;
        }
        this.supportsInputEvents = z;
        if (z) {
            return;
        }
        Ln.w("Input events are not supported for secondary displays before Android 10");
    }

    public int getDisplayId() {
        return this.displayId;
    }

    public synchronized ScreenInfo getScreenInfo() {
        return this.screenInfo;
    }

    public int getLayerStack() {
        return this.layerStack;
    }

    public void applyNewVideoSetting(VideoSettings videoSettings) {
        setScreenInfo(ScreenInfo.computeScreenInfo(getDisplayInfo(this.displayId), videoSettings));
    }

    public synchronized void setScreenInfo(ScreenInfo screenInfo) {
        this.screenInfo = screenInfo;
    }

    public Point getPhysicalPoint(Position position) {
        ScreenInfo screenInfo = getScreenInfo();
        Size unlockedVideoSize = screenInfo.getUnlockedVideoSize();
        Position positionRotate = position.rotate(screenInfo.getReverseVideoRotation());
        if (!unlockedVideoSize.equals(positionRotate.getScreenSize())) {
            return null;
        }
        Rect contentRect = screenInfo.getContentRect();
        Point point = positionRotate.getPoint();
        return new Point(contentRect.left + ((point.getX() * contentRect.width()) / unlockedVideoSize.getWidth()), contentRect.top + ((point.getY() * contentRect.height()) / unlockedVideoSize.getHeight()));
    }

    public static String getDeviceName() {
        return Build.MODEL;
    }

    public static boolean supportsInputEvents(int i) {
        return i == 0 || Build.VERSION.SDK_INT >= 29;
    }

    public boolean supportsInputEvents() {
        return this.supportsInputEvents;
    }

    public static boolean injectEvent(InputEvent inputEvent, int i) {
        if (!supportsInputEvents(i)) {
            throw new AssertionError("Could not inject input event if !supportsInputEvents()");
        }
        if (i == 0 || InputManager.setDisplayId(inputEvent, i)) {
            return SERVICE_MANAGER.getInputManager().injectInputEvent(inputEvent, 0);
        }
        return false;
    }

    public boolean injectEvent(InputEvent inputEvent) {
        return injectEvent(inputEvent, this.displayId);
    }

    public static boolean injectKeyEvent(int i, int i2, int i3, int i4, int i5) {
        long jUptimeMillis = SystemClock.uptimeMillis();
        return injectEvent(new KeyEvent(jUptimeMillis, jUptimeMillis, i, i2, i3, i4, -1, 0, 0, 257), i5);
    }

    public boolean injectKeyEvent(int i, int i2, int i3, int i4) {
        return injectKeyEvent(i, i2, i3, i4, this.displayId);
    }

    public static boolean pressReleaseKeycode(int i, int i2) {
        return injectKeyEvent(0, i, 0, 0, i2) && injectKeyEvent(1, i, 0, 0, i2);
    }

    public boolean pressReleaseKeycode(int i) {
        return pressReleaseKeycode(i, this.displayId);
    }

    public static boolean isScreenOn() {
        return SERVICE_MANAGER.getPowerManager().isScreenOn();
    }

    public synchronized void setRotationListener(RotationListener rotationListener) {
        this.rotationListener = rotationListener;
    }

    public synchronized void setClipboardListener(ClipboardListener clipboardListener) {
        this.clipboardListener = clipboardListener;
    }

    public static void expandNotificationPanel() {
        SERVICE_MANAGER.getStatusBarManager().expandNotificationsPanel();
    }

    public static void expandSettingsPanel() {
        SERVICE_MANAGER.getStatusBarManager().expandSettingsPanel();
    }

    public static void collapsePanels() {
        SERVICE_MANAGER.getStatusBarManager().collapsePanels();
    }

    public static String getClipboardText() {
        CharSequence text;
        ClipboardManager clipboardManager = SERVICE_MANAGER.getClipboardManager();
        if (clipboardManager == null || (text = clipboardManager.getText()) == null) {
            return null;
        }
        return text.toString();
    }

    public boolean setClipboardText(String str) {
        ClipboardManager clipboardManager = SERVICE_MANAGER.getClipboardManager();
        if (clipboardManager == null) {
            return false;
        }
        String clipboardText = getClipboardText();
        if (clipboardText != null && clipboardText.equals(str)) {
            return false;
        }
        this.isSettingClipboard.set(true);
        boolean text = clipboardManager.setText(str);
        this.isSettingClipboard.set(false);
        return text;
    }

    public void release() {
        if (this.clipChangedListener != null) {
            ClipboardManager clipboardManager = SERVICE_MANAGER.getClipboardManager();
            if (clipboardManager != null) {
                clipboardManager.removePrimaryClipChangedListener(this.clipChangedListener);
            }
            this.clipboardListener = null;
        }
        if (this.rotationWatcher != null) {
            SERVICE_MANAGER.getWindowManager().unregisterRotationWatcher(this.rotationWatcher);
            this.rotationWatcher = null;
        }
        this.rotationListener = null;
        this.clipboardListener = null;
    }

    public static boolean setScreenPowerMode(int i) {
        IBinder builtInDisplay = SurfaceControl.getBuiltInDisplay();
        if (builtInDisplay == null) {
            Ln.e("Could not get built-in display");
            return false;
        }
        return SurfaceControl.setDisplayPowerMode(builtInDisplay, i);
    }

    public static boolean powerOffScreen(int i) {
        if (isScreenOn()) {
            return pressReleaseKeycode(26, i);
        }
        return true;
    }

    public static void rotateDevice() {
        WindowManager windowManager = SERVICE_MANAGER.getWindowManager();
        boolean z = !windowManager.isRotationFrozen();
        int rotation = (windowManager.getRotation() & 1) ^ 1;
        Ln.i("Device rotation requested: " + (rotation == 0 ? "portrait" : "landscape"));
        windowManager.freezeRotation(rotation);
        if (z) {
            windowManager.thawRotation();
        }
    }

    public static ContentProvider createSettingsProvider() {
        return SERVICE_MANAGER.getActivityManager().createSettingsProvider();
    }

    public static int[] getDisplayIds() {
        return SERVICE_MANAGER.getDisplayManager().getDisplayIds();
    }

    public static DisplayInfo getDisplayInfo(int i) {
        return SERVICE_MANAGER.getDisplayManager().getDisplayInfo(i);
    }
}
