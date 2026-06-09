package com.genymobile.scrcpy.wrappers;

import android.os.IBinder;
import android.os.IInterface;
import java.lang.reflect.Method;

/* JADX INFO: loaded from: classes.dex */
public final class ServiceManager {
    public static final String PACKAGE_NAME = "com.android.shell";
    public static final int USER_ID = 0;
    private ActivityManager activityManager;
    private ClipboardManager clipboardManager;
    private DisplayManager displayManager;
    private final Method getServiceMethod;
    private InputManager inputManager;
    private PowerManager powerManager;
    private StatusBarManager statusBarManager;
    private WindowManager windowManager;

    public ServiceManager() {
        try {
            this.getServiceMethod = Class.forName("android.os.ServiceManager").getDeclaredMethod("getService", String.class);
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    private IInterface getService(String str, String str2) {
        try {
            return (IInterface) Class.forName(str2 + "$Stub").getMethod("asInterface", IBinder.class).invoke(null, (IBinder) this.getServiceMethod.invoke(null, str));
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    public WindowManager getWindowManager() {
        if (this.windowManager == null) {
            this.windowManager = new WindowManager(getService("window", "android.view.IWindowManager"));
        }
        return this.windowManager;
    }

    public DisplayManager getDisplayManager() {
        if (this.displayManager == null) {
            this.displayManager = new DisplayManager(getService("display", "android.hardware.display.IDisplayManager"));
        }
        return this.displayManager;
    }

    public InputManager getInputManager() {
        if (this.inputManager == null) {
            this.inputManager = new InputManager(getService("input", "android.hardware.input.IInputManager"));
        }
        return this.inputManager;
    }

    public PowerManager getPowerManager() {
        if (this.powerManager == null) {
            this.powerManager = new PowerManager(getService("power", "android.os.IPowerManager"));
        }
        return this.powerManager;
    }

    public StatusBarManager getStatusBarManager() {
        if (this.statusBarManager == null) {
            this.statusBarManager = new StatusBarManager(getService("statusbar", "com.android.internal.statusbar.IStatusBarService"));
        }
        return this.statusBarManager;
    }

    public ClipboardManager getClipboardManager() {
        if (this.clipboardManager == null) {
            IInterface service = getService("clipboard", "android.content.IClipboard");
            if (service == null) {
                return null;
            }
            this.clipboardManager = new ClipboardManager(service);
        }
        return this.clipboardManager;
    }

    public ActivityManager getActivityManager() {
        if (this.activityManager == null) {
            try {
                this.activityManager = new ActivityManager((IInterface) Class.forName("android.app.ActivityManagerNative").getDeclaredMethod("getDefault", new Class[0]).invoke(null, new Object[0]));
            } catch (Exception e) {
                throw new AssertionError(e);
            }
        }
        return this.activityManager;
    }
}
