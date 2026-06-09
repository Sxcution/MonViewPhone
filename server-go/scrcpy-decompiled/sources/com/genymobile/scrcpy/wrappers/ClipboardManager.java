package com.genymobile.scrcpy.wrappers;

import android.content.ClipData;
import android.content.Context;
import android.content.IOnPrimaryClipChangedListener;
import android.os.IInterface;
import android.os.Looper;
import com.genymobile.scrcpy.Ln;
import java.lang.reflect.Method;

public class ClipboardManager {
    private final IInterface manager;
    private static Context fakeContext;

    public ClipboardManager(IInterface iInterface) {
        this.manager = iInterface;
    }

    private static Context getFakeContext() {
        if (fakeContext == null) {
            try {
                if (Looper.myLooper() == null) {
                    Looper.prepare();
                }
                Class<?> activityThreadClass = Class.forName("android.app.ActivityThread");
                Object activityThread = activityThreadClass.getDeclaredMethod("systemMain").invoke(null);
                fakeContext = (Context) activityThreadClass.getDeclaredMethod("getSystemContext").invoke(activityThread);
            } catch (Throwable t) {
                Ln.e("Failed to create FakeContext", t);
            }
        }
        return fakeContext;
    }

    private ClipData getPrimaryClip() {
        Method[] methods = this.manager.getClass().getMethods();
        
        for (Method m : methods) {
            if ("getPrimaryClip".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                try {
                    if (params.length == 4 && params[0] == String.class && params[1] == String.class && isInt(params[2]) && isInt(params[3])) {
                        return (ClipData) m.invoke(this.manager, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID, 0);
                    } else if (params.length == 3 && params[0] == String.class && params[1] == String.class && isInt(params[2])) {
                        return (ClipData) m.invoke(this.manager, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID);
                    } else if (params.length == 2 && params[0] == String.class && isInt(params[1])) {
                        return (ClipData) m.invoke(this.manager, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID);
                    } else if (params.length == 1 && params[0] == String.class) {
                        return (ClipData) m.invoke(this.manager, ServiceManager.PACKAGE_NAME);
                    } else if (params.length == 3 && params[0] == String.class && isInt(params[1]) && isInt(params[2])) {
                        // Custom Samsung/Xiaomi signature?
                        return (ClipData) m.invoke(this.manager, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID, 0);
                    }
                } catch (Throwable t) {
                    Ln.e("Failed invoking getPrimaryClip(" + params.length + " args)", t);
                }
            }
        }
        
        try {
            Context ctx = getFakeContext();
            if (ctx != null) {
                android.content.ClipboardManager cb = (android.content.ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
                if (cb != null) {
                    return cb.getPrimaryClip();
                }
            }
        } catch (Throwable t) {
            Ln.e("Failed invoking getPrimaryClip via FakeContext", t);
        }
        
        Ln.e("No matching getPrimaryClip method found");
        return null;
    }

    private boolean setPrimaryClip(ClipData clipData) {
        Method[] methods = this.manager.getClass().getMethods();
        
        for (Method m : methods) {
            if ("setPrimaryClip".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                try {
                    if (params.length == 5 && params[0] == ClipData.class && params[1] == String.class && params[2] == String.class && isInt(params[3]) && isInt(params[4])) {
                        m.invoke(this.manager, clipData, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID, 0);
                        return true;
                    } else if (params.length == 4 && params[0] == ClipData.class && params[1] == String.class && params[2] == String.class && isInt(params[3])) {
                        m.invoke(this.manager, clipData, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID);
                        return true;
                    } else if (params.length == 3 && params[0] == ClipData.class && params[1] == String.class && isInt(params[2])) {
                        m.invoke(this.manager, clipData, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID);
                        return true;
                    } else if (params.length == 2 && params[0] == ClipData.class && params[1] == String.class) {
                        m.invoke(this.manager, clipData, ServiceManager.PACKAGE_NAME);
                        return true;
                    } else if (params.length == 4 && params[0] == ClipData.class && params[1] == String.class && isInt(params[2]) && isInt(params[3])) {
                        // Custom Samsung/Xiaomi signature?
                        m.invoke(this.manager, clipData, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID, 0);
                        return true;
                    }
                } catch (Throwable t) {
                    Ln.e("Failed invoking setPrimaryClip(" + params.length + " args)", t);
                }
            }
        }

        try {
            Context ctx = getFakeContext();
            if (ctx != null) {
                android.content.ClipboardManager cb = (android.content.ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
                if (cb != null) {
                    cb.setPrimaryClip(clipData);
                    return true;
                }
            }
        } catch (Throwable t) {
            Ln.e("Failed invoking setPrimaryClip via FakeContext", t);
        }
        
        Ln.e("No matching setPrimaryClip method found");
        return false;
    }

    public CharSequence getText() {
        ClipData primaryClip = getPrimaryClip();
        if (primaryClip != null && primaryClip.getItemCount() > 0) {
            return primaryClip.getItemAt(0).getText();
        }
        return null;
    }

    public boolean setText(CharSequence charSequence) {
        return setPrimaryClip(ClipData.newPlainText(null, charSequence));
    }

    public boolean addPrimaryClipChangedListener(IOnPrimaryClipChangedListener listener) {
        Method[] methods = this.manager.getClass().getMethods();
        
        for (Method m : methods) {
            if ("addPrimaryClipChangedListener".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                try {
                    if (params.length == 5 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && params[2] == String.class && isInt(params[3]) && isInt(params[4])) {
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID, 0);
                        return true;
                    } else if (params.length == 4 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && params[2] == String.class && isInt(params[3])) {
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID);
                        return true;
                    } else if (params.length == 3 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && isInt(params[2])) {
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID);
                        return true;
                    } else if (params.length == 2 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class) {
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME);
                        return true;
                    } else if (params.length == 4 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && isInt(params[2]) && isInt(params[3])) {
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID, 0);
                        return true;
                    }
                } catch (Throwable t) {
                    Ln.e("Failed invoking addPrimaryClipChangedListener(" + params.length + " args)", t);
                }
            }
        }
        
        Ln.e("No matching addPrimaryClipChangedListener method found");
        return false;
    }

    public boolean removePrimaryClipChangedListener(IOnPrimaryClipChangedListener listener) {
        Method[] methods = this.manager.getClass().getMethods();
        
        for (Method m : methods) {
            if ("removePrimaryClipChangedListener".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                try {
                    if (params.length == 5 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && params[2] == String.class && isInt(params[3]) && isInt(params[4])) {
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID, 0);
                        return true;
                    } else if (params.length == 4 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && params[2] == String.class && isInt(params[3])) {
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID);
                        return true;
                    } else if (params.length == 3 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && isInt(params[2])) {
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID);
                        return true;
                    } else if (params.length == 2 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class) {
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME);
                        return true;
                    } else if (params.length == 4 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && isInt(params[2]) && isInt(params[3])) {
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID, 0);
                        return true;
                    }
                } catch (Throwable t) {
                    Ln.e("Failed invoking removePrimaryClipChangedListener(" + params.length + " args)", t);
                }
            }
        }
        
        return false;
    }

    private boolean isInt(Class<?> type) {
        return type == int.class || type == Integer.TYPE;
    }
}
