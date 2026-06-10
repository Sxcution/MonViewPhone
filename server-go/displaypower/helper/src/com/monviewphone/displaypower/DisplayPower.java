package com.monviewphone.displaypower;

import android.os.IBinder;
import android.system.Os;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

public final class DisplayPower {
    private static final int POWER_MODE_OFF = 0;
    private static final int POWER_MODE_NORMAL = 2;

    public static void main(String[] args) {
        try {
            String action = args.length > 0 ? args[0].trim().toLowerCase() : "";
            if (!"off".equals(action) && !"on".equals(action)) {
                System.err.println("Usage: DisplayPower <off|on>");
                System.exit(2);
                return;
            }

            int mode = "off".equals(action) ? POWER_MODE_OFF : POWER_MODE_NORMAL;

            IBinder[] tokens = getDisplayTokens();
            if (tokens == null || tokens.length == 0) {
                throw new IllegalStateException("Cannot get display token");
            }

            Class<?> surfaceControl = Class.forName("android.view.SurfaceControl");
            Method setDisplayPowerMode = surfaceControl.getDeclaredMethod(
                "setDisplayPowerMode",
                IBinder.class,
                int.class
            );
            setDisplayPowerMode.setAccessible(true);
            
            for (IBinder token : tokens) {
                if (token != null) {
                    setDisplayPowerMode.invoke(null, token, mode);
                }
            }

            System.out.println("OK display power " + action);
            Runtime.getRuntime().halt(0);
        } catch (Throwable t) {
            t.printStackTrace(System.err);
            Runtime.getRuntime().halt(1);
        }
    }

    private static IBinder[] getDisplayTokens() throws Exception {
        Class<?> surfaceControl = Class.forName("android.view.SurfaceControl");
        List<IBinder> tokenList = new ArrayList<>();

        // Try pre-Android 14 first
        try {
            Method getPhysicalDisplayIds = surfaceControl.getDeclaredMethod("getPhysicalDisplayIds");
            getPhysicalDisplayIds.setAccessible(true);
            long[] ids = (long[]) getPhysicalDisplayIds.invoke(null);
            if (ids != null && ids.length > 0) {
                Method getPhysicalDisplayToken = surfaceControl.getDeclaredMethod(
                    "getPhysicalDisplayToken",
                    long.class
                );
                getPhysicalDisplayToken.setAccessible(true);
                for (long id : ids) {
                    IBinder token = (IBinder) getPhysicalDisplayToken.invoke(null, id);
                    if (token != null) tokenList.add(token);
                }
                if (!tokenList.isEmpty()) {
                    return tokenList.toArray(new IBinder[0]);
                }
            }
        } catch (Throwable e) {
        }

        try {
            Method getInternalDisplayToken = surfaceControl.getDeclaredMethod("getInternalDisplayToken");
            getInternalDisplayToken.setAccessible(true);
            IBinder token = (IBinder) getInternalDisplayToken.invoke(null);
            if (token != null) return new IBinder[]{token};
        } catch (Throwable e) {
        }

        try {
            Method getBuiltInDisplay = surfaceControl.getDeclaredMethod("getBuiltInDisplay", int.class);
            getBuiltInDisplay.setAccessible(true);
            IBinder token = (IBinder) getBuiltInDisplay.invoke(null, 0);
            if (token != null) return new IBinder[]{token};
        } catch (Throwable e) {
        }

        // Android 14+ via com.android.server.display.DisplayControl
        try {
            Class<?> classLoaderFactoryClass = Class.forName("com.android.internal.os.ClassLoaderFactory");
            Method createClassLoaderMethod = classLoaderFactoryClass.getDeclaredMethod("createClassLoader", String.class, String.class, String.class,
                    ClassLoader.class, int.class, boolean.class, String.class);

            String systemServerClasspath = Os.getenv("SYSTEMSERVERCLASSPATH");
            ClassLoader classLoader = (ClassLoader) createClassLoaderMethod.invoke(null, systemServerClasspath, null, null,
                    ClassLoader.getSystemClassLoader(), 0, true, null);

            Class<?> displayControlClass = classLoader.loadClass("com.android.server.display.DisplayControl");

            Method loadMethod = Runtime.class.getDeclaredMethod("loadLibrary0", Class.class, String.class);
            loadMethod.setAccessible(true);
            loadMethod.invoke(Runtime.getRuntime(), displayControlClass, "android_servers");

            Method getPhysicalDisplayIdsMethod = displayControlClass.getMethod("getPhysicalDisplayIds");
            long[] ids = (long[]) getPhysicalDisplayIdsMethod.invoke(null);

            if (ids != null && ids.length > 0) {
                Method getPhysicalDisplayTokenMethod = displayControlClass.getMethod("getPhysicalDisplayToken", long.class);
                for (long id : ids) {
                    IBinder token = (IBinder) getPhysicalDisplayTokenMethod.invoke(null, id);
                    if (token != null) tokenList.add(token);
                }
                if (!tokenList.isEmpty()) {
                    return tokenList.toArray(new IBinder[0]);
                }
            }
        } catch (Throwable e) {
            e.printStackTrace(System.err);
        }

        return null;
    }
}
