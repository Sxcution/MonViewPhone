package com.genymobile.scrcpy.wrappers;

import android.hardware.display.VirtualDisplay;
import android.os.IInterface;
import android.view.Surface;
import com.genymobile.scrcpy.DisplayInfo;
import com.genymobile.scrcpy.Ln;
import com.genymobile.scrcpy.Size;
import java.lang.reflect.Method;

/* JADX INFO: loaded from: classes.dex */
public final class DisplayManager {
    private Method createVirtualDisplayMethod;
    private final IInterface manager;

    public DisplayManager(IInterface iInterface) {
        this.manager = iInterface;
    }

    public DisplayInfo getDisplayInfo(int i) {
        try {
            Object objInvoke = this.manager.getClass().getMethod("getDisplayInfo", Integer.TYPE).invoke(this.manager, Integer.valueOf(i));
            if (objInvoke == null) {
                return null;
            }
            Class<?> cls = objInvoke.getClass();
            return new DisplayInfo(i, new Size(cls.getDeclaredField("logicalWidth").getInt(objInvoke), cls.getDeclaredField("logicalHeight").getInt(objInvoke)), cls.getDeclaredField("rotation").getInt(objInvoke), cls.getDeclaredField("layerStack").getInt(objInvoke), cls.getDeclaredField("flags").getInt(objInvoke));
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    public int[] getDisplayIds() {
        try {
            return (int[]) this.manager.getClass().getMethod("getDisplayIds", new Class[0]).invoke(this.manager, new Object[0]);
        } catch (NoSuchMethodException unused) {
            Ln.e("FIXME: Returning only default display.");
            Ln.e("See https://github.com/NetrisTV/ws-scrcpy/issues/217");
            return new int[]{0};
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    private Method getCreateVirtualDisplayMethod() throws NoSuchMethodException {
        if (this.createVirtualDisplayMethod == null) {
            this.createVirtualDisplayMethod = android.hardware.display.DisplayManager.class.getMethod("createVirtualDisplay", String.class, Integer.TYPE, Integer.TYPE, Integer.TYPE, Surface.class);
        }
        return this.createVirtualDisplayMethod;
    }

    public VirtualDisplay createVirtualDisplay(String str, int i, int i2, int i3, Surface surface) throws Exception {
        return (VirtualDisplay) getCreateVirtualDisplayMethod().invoke(null, str, Integer.valueOf(i), Integer.valueOf(i2), Integer.valueOf(i3), surface);
    }
}
