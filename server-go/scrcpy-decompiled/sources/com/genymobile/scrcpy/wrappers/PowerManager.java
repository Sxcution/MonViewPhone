package com.genymobile.scrcpy.wrappers;

import android.os.Build;
import android.os.IInterface;
import com.genymobile.scrcpy.Ln;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/* JADX INFO: loaded from: classes.dex */
public final class PowerManager {
    private Method isScreenOnMethod;
    private final IInterface manager;

    public PowerManager(IInterface iInterface) {
        this.manager = iInterface;
    }

    private Method getIsScreenOnMethod() throws NoSuchMethodException {
        if (this.isScreenOnMethod == null) {
            this.isScreenOnMethod = this.manager.getClass().getMethod(Build.VERSION.SDK_INT >= 20 ? "isInteractive" : "isScreenOn", new Class[0]);
        }
        return this.isScreenOnMethod;
    }

    public boolean isScreenOn() {
        try {
            return ((Boolean) getIsScreenOnMethod().invoke(this.manager, new Object[0])).booleanValue();
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
            return false;
        }
    }
}
