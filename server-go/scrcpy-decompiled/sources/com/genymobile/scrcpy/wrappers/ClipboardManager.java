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
                if (Looper.getMainLooper() == null) {
                    Looper.prepareMainLooper();
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
        
        // 1. getPrimaryClip(String, String, int)
        for (Method m : methods) {
            if ("getPrimaryClip".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 3 && params[0] == String.class && params[1] == String.class && (params[2] == int.class || params[2] == Integer.TYPE)) {
                    try {
                        Ln.i("Clipboard getPrimaryClip signature: package+attribution+user");
                        return (ClipData) m.invoke(this.manager, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID);
                    } catch (Throwable t) {
                        Ln.e("Failed invoking getPrimaryClip(3)", t);
                    }
                }
            }
        }
        
        // 2. getPrimaryClip(String, int)
        for (Method m : methods) {
            if ("getPrimaryClip".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 2 && params[0] == String.class && (params[1] == int.class || params[1] == Integer.TYPE)) {
                    try {
                        Ln.i("Clipboard fallback signature: package+user");
                        return (ClipData) m.invoke(this.manager, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID);
                    } catch (Throwable t) {
                        Ln.e("Failed invoking getPrimaryClip(2)", t);
                    }
                }
            }
        }
        
        // 3. getPrimaryClip(String)
        for (Method m : methods) {
            if ("getPrimaryClip".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 1 && params[0] == String.class) {
                    try {
                        Ln.i("Clipboard fallback signature: package only");
                        return (ClipData) m.invoke(this.manager, ServiceManager.PACKAGE_NAME);
                    } catch (Throwable t) {
                        Ln.e("Failed invoking getPrimaryClip(1)", t);
                    }
                }
            }
        }
        
        // 4. android.content.ClipboardManager via FakeContext
        try {
            Context ctx = getFakeContext();
            if (ctx != null) {
                android.content.ClipboardManager cb = (android.content.ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
                if (cb != null) {
                    Ln.i("Clipboard fallback signature: Context.CLIPBOARD_SERVICE");
                    return cb.getPrimaryClip();
                }
            }
        } catch (Throwable t) {
            Ln.e("Failed invoking ClipboardManager via FakeContext", t);
        }
        
        Ln.e("No matching getPrimaryClip method found");
        return null;
    }

    private boolean setPrimaryClip(ClipData clipData) {
        Method[] methods = this.manager.getClass().getMethods();
        
        // 1. setPrimaryClip(ClipData, String, String, int)
        for (Method m : methods) {
            if ("setPrimaryClip".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 4 && params[0] == ClipData.class && params[1] == String.class && params[2] == String.class && (params[3] == int.class || params[3] == Integer.TYPE)) {
                    try {
                        Ln.i("Clipboard setPrimaryClip signature: clip+package+attribution+user");
                        m.invoke(this.manager, clipData, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID);
                        Ln.i("Device clipboard set");
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking setPrimaryClip(4)", t);
                    }
                }
            }
        }
        
        // 2. setPrimaryClip(ClipData, String, int)
        for (Method m : methods) {
            if ("setPrimaryClip".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 3 && params[0] == ClipData.class && params[1] == String.class && (params[2] == int.class || params[2] == Integer.TYPE)) {
                    try {
                        Ln.i("Clipboard fallback signature: clip+package+user");
                        m.invoke(this.manager, clipData, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID);
                        Ln.i("Device clipboard set");
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking setPrimaryClip(3)", t);
                    }
                }
            }
        }
        
        // 3. setPrimaryClip(ClipData, String)
        for (Method m : methods) {
            if ("setPrimaryClip".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 2 && params[0] == ClipData.class && params[1] == String.class) {
                    try {
                        Ln.i("Clipboard fallback signature: clip+package only");
                        m.invoke(this.manager, clipData, ServiceManager.PACKAGE_NAME);
                        Ln.i("Device clipboard set");
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking setPrimaryClip(2)", t);
                    }
                }
            }
        }

        // 4. android.content.ClipboardManager via FakeContext
        try {
            Context ctx = getFakeContext();
            if (ctx != null) {
                android.content.ClipboardManager cb = (android.content.ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
                if (cb != null) {
                    Ln.i("Clipboard fallback signature: Context.CLIPBOARD_SERVICE set");
                    cb.setPrimaryClip(clipData);
                    Ln.i("Device clipboard set");
                    return true;
                }
            }
        } catch (Throwable t) {
            Ln.e("Failed invoking ClipboardManager.setPrimaryClip via FakeContext", t);
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
        
        // 1. addPrimaryClipChangedListener(IOnPrimaryClipChangedListener, String, String, int, int)
        for (Method m : methods) {
            if ("addPrimaryClipChangedListener".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 5 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && params[2] == String.class && (params[3] == int.class || params[3] == Integer.TYPE) && (params[4] == int.class || params[4] == Integer.TYPE)) {
                    try {
                        Ln.i("Clipboard addPrimaryClipChangedListener signature: listener+package+attribution+user+device");
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID, 0);
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking addPrimaryClipChangedListener(5)", t);
                    }
                }
            }
        }
        
        // 2. addPrimaryClipChangedListener(IOnPrimaryClipChangedListener, String, String, int)
        for (Method m : methods) {
            if ("addPrimaryClipChangedListener".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 4 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && params[2] == String.class && (params[3] == int.class || params[3] == Integer.TYPE)) {
                    try {
                        Ln.i("Clipboard addPrimaryClipChangedListener signature: listener+package+attribution+user");
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID);
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking addPrimaryClipChangedListener(4)", t);
                    }
                }
            }
        }
        
        // 3. addPrimaryClipChangedListener(IOnPrimaryClipChangedListener, String, int)
        for (Method m : methods) {
            if ("addPrimaryClipChangedListener".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 3 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && (params[2] == int.class || params[2] == Integer.TYPE)) {
                    try {
                        Ln.i("Clipboard addPrimaryClipChangedListener signature: listener+package+user");
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID);
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking addPrimaryClipChangedListener(3)", t);
                    }
                }
            }
        }
        
        // 4. addPrimaryClipChangedListener(IOnPrimaryClipChangedListener, String)
        for (Method m : methods) {
            if ("addPrimaryClipChangedListener".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 2 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class) {
                    try {
                        Ln.i("Clipboard addPrimaryClipChangedListener signature: listener+package");
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME);
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking addPrimaryClipChangedListener(2)", t);
                    }
                }
            }
        }
        
        Ln.e("No matching addPrimaryClipChangedListener method found");
        return false;
    }

    public boolean removePrimaryClipChangedListener(IOnPrimaryClipChangedListener listener) {
        Method[] methods = this.manager.getClass().getMethods();
        
        // 1. removePrimaryClipChangedListener(IOnPrimaryClipChangedListener, String, String, int, int)
        for (Method m : methods) {
            if ("removePrimaryClipChangedListener".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 5 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && params[2] == String.class && (params[3] == int.class || params[3] == Integer.TYPE) && (params[4] == int.class || params[4] == Integer.TYPE)) {
                    try {
                        Ln.i("Clipboard removePrimaryClipChangedListener signature: listener+package+attribution+user+device");
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID, 0);
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking removePrimaryClipChangedListener(5)", t);
                    }
                }
            }
        }
        
        // 2. removePrimaryClipChangedListener(IOnPrimaryClipChangedListener, String, String, int)
        for (Method m : methods) {
            if ("removePrimaryClipChangedListener".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 4 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && params[2] == String.class && (params[3] == int.class || params[3] == Integer.TYPE)) {
                    try {
                        Ln.i("Clipboard removePrimaryClipChangedListener signature: listener+package+attribution+user");
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, null, ServiceManager.USER_ID);
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking removePrimaryClipChangedListener(4)", t);
                    }
                }
            }
        }
        
        // 3. removePrimaryClipChangedListener(IOnPrimaryClipChangedListener, String, int)
        for (Method m : methods) {
            if ("removePrimaryClipChangedListener".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 3 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class && (params[2] == int.class || params[2] == Integer.TYPE)) {
                    try {
                        Ln.i("Clipboard removePrimaryClipChangedListener signature: listener+package+user");
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME, ServiceManager.USER_ID);
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking removePrimaryClipChangedListener(3)", t);
                    }
                }
            }
        }
        
        // 4. removePrimaryClipChangedListener(IOnPrimaryClipChangedListener, String)
        for (Method m : methods) {
            if ("removePrimaryClipChangedListener".equals(m.getName())) {
                Class<?>[] params = m.getParameterTypes();
                if (params.length == 2 && params[0] == IOnPrimaryClipChangedListener.class && params[1] == String.class) {
                    try {
                        Ln.i("Clipboard removePrimaryClipChangedListener signature: listener+package");
                        m.invoke(this.manager, listener, ServiceManager.PACKAGE_NAME);
                        return true;
                    } catch (Throwable t) {
                        Ln.e("Failed invoking removePrimaryClipChangedListener(2)", t);
                    }
                }
            }
        }
        
        Ln.e("No matching removePrimaryClipChangedListener method found");
        return false;
    }
}
