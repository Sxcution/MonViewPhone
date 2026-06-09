package com.genymobile.scrcpy.wrappers;

import android.os.IInterface;
import android.view.IRotationWatcher;
import com.genymobile.scrcpy.Ln;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/* JADX INFO: loaded from: classes.dex */
public final class WindowManager {
    private Method freezeRotationMethod;
    private Method getRotationMethod;
    private Method isRotationFrozenMethod;
    private final IInterface manager;
    private Method removeRotationWatcherMethod;
    private Method thawRotationMethod;

    public WindowManager(IInterface iInterface) {
        this.manager = iInterface;
    }

    private Method getGetRotationMethod() throws NoSuchMethodException {
        if (this.getRotationMethod == null) {
            Class<?> cls = this.manager.getClass();
            try {
                this.getRotationMethod = cls.getMethod("getDefaultDisplayRotation", new Class[0]);
            } catch (NoSuchMethodException unused) {
                this.getRotationMethod = cls.getMethod("getRotation", new Class[0]);
            }
        }
        return this.getRotationMethod;
    }

    private Method getFreezeRotationMethod() throws NoSuchMethodException {
        if (this.freezeRotationMethod == null) {
            this.freezeRotationMethod = this.manager.getClass().getMethod("freezeRotation", Integer.TYPE);
        }
        return this.freezeRotationMethod;
    }

    private Method getIsRotationFrozenMethod() throws NoSuchMethodException {
        if (this.isRotationFrozenMethod == null) {
            this.isRotationFrozenMethod = this.manager.getClass().getMethod("isRotationFrozen", new Class[0]);
        }
        return this.isRotationFrozenMethod;
    }

    private Method getThawRotationMethod() throws NoSuchMethodException {
        if (this.thawRotationMethod == null) {
            this.thawRotationMethod = this.manager.getClass().getMethod("thawRotation", new Class[0]);
        }
        return this.thawRotationMethod;
    }

    private Method getRemoveRotationWatcherMethod() throws NoSuchMethodException {
        if (this.removeRotationWatcherMethod == null) {
            this.removeRotationWatcherMethod = this.manager.getClass().getMethod("removeRotationWatcher", new Class[0]);
        }
        return this.removeRotationWatcherMethod;
    }

    public int getRotation() {
        try {
            return ((Integer) getGetRotationMethod().invoke(this.manager, new Object[0])).intValue();
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
            return 0;
        }
    }

    public void freezeRotation(int i) {
        try {
            getFreezeRotationMethod().invoke(this.manager, Integer.valueOf(i));
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
        }
    }

    public boolean isRotationFrozen() {
        try {
            return ((Boolean) getIsRotationFrozenMethod().invoke(this.manager, new Object[0])).booleanValue();
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
            return false;
        }
    }

    public void thawRotation() {
        try {
            getThawRotationMethod().invoke(this.manager, new Object[0]);
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
        }
    }

    public void registerRotationWatcher(IRotationWatcher iRotationWatcher, int i) {
        try {
            Class<?> cls = this.manager.getClass();
            try {
                cls.getMethod("watchRotation", IRotationWatcher.class, Integer.TYPE).invoke(this.manager, iRotationWatcher, Integer.valueOf(i));
            } catch (NoSuchMethodException unused) {
                cls.getMethod("watchRotation", IRotationWatcher.class).invoke(this.manager, iRotationWatcher);
            }
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    public void unregisterRotationWatcher(IRotationWatcher iRotationWatcher) {
        try {
            getRemoveRotationWatcherMethod().invoke(this.manager, iRotationWatcher);
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
        }
    }
}
