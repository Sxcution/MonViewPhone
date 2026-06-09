package com.genymobile.scrcpy.wrappers;

import android.os.Binder;
import android.os.IBinder;
import android.os.IInterface;
import com.genymobile.scrcpy.Ln;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/* JADX INFO: loaded from: classes.dex */
public class ActivityManager {
    private Method getContentProviderExternalMethod;
    private boolean getContentProviderExternalMethodNewVersion = true;
    private final IInterface manager;
    private Method removeContentProviderExternalMethod;

    public ActivityManager(IInterface iInterface) {
        this.manager = iInterface;
    }

    private Method getGetContentProviderExternalMethod() throws NoSuchMethodException {
        if (this.getContentProviderExternalMethod == null) {
            try {
                this.getContentProviderExternalMethod = this.manager.getClass().getMethod("getContentProviderExternal", String.class, Integer.TYPE, IBinder.class, String.class);
            } catch (NoSuchMethodException unused) {
                this.getContentProviderExternalMethod = this.manager.getClass().getMethod("getContentProviderExternal", String.class, Integer.TYPE, IBinder.class);
                this.getContentProviderExternalMethodNewVersion = false;
            }
        }
        return this.getContentProviderExternalMethod;
    }

    private Method getRemoveContentProviderExternalMethod() throws NoSuchMethodException {
        if (this.removeContentProviderExternalMethod == null) {
            this.removeContentProviderExternalMethod = this.manager.getClass().getMethod("removeContentProviderExternal", String.class, IBinder.class);
        }
        return this.removeContentProviderExternalMethod;
    }

    private ContentProvider getContentProviderExternal(String str, IBinder iBinder) {
        try {
            Object objInvoke = getGetContentProviderExternalMethod().invoke(this.manager, this.getContentProviderExternalMethodNewVersion ? new Object[]{str, 0, iBinder, null} : new Object[]{str, 0, iBinder});
            if (objInvoke == null) {
                return null;
            }
            Field declaredField = objInvoke.getClass().getDeclaredField("provider");
            declaredField.setAccessible(true);
            Object obj = declaredField.get(objInvoke);
            if (obj == null) {
                return null;
            }
            return new ContentProvider(this, obj, str, iBinder);
        } catch (IllegalAccessException | NoSuchFieldException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
            return null;
        }
    }

    void removeContentProviderExternal(String str, IBinder iBinder) {
        try {
            getRemoveContentProviderExternalMethod().invoke(this.manager, str, iBinder);
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
        }
    }

    public ContentProvider createSettingsProvider() {
        return getContentProviderExternal("settings", new Binder());
    }
}
