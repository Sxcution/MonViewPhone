package com.monviewphone.displaypower;

import android.os.IBinder;
import java.lang.reflect.Method;

public final class DisplayPower {
    private static final int POWER_MODE_OFF = 0;
    private static final int POWER_MODE_NORMAL = 2;

    public static void main(String[] args) {
        try {
            String action = args.length > 0 ? args[0].trim().toLowerCase() : "";
            if (!"off".equals(action) && !"on".equals(action)) {
                System.err.println("Usage: DisplayPower <off|on> [displayIndex]");
                System.exit(2);
                return;
            }

            int mode = "off".equals(action) ? POWER_MODE_OFF : POWER_MODE_NORMAL;
            int displayIndex = 0;
            if (args.length > 1) {
                try {
                    displayIndex = Math.max(0, Integer.parseInt(args[1]));
                } catch (Throwable ignored) {
                    displayIndex = 0;
                }
            }

            IBinder token = getDisplayToken(displayIndex);
            if (token == null) {
                throw new IllegalStateException("Cannot get display token");
            }

            Class<?> surfaceControl = Class.forName("android.view.SurfaceControl");
            Method setDisplayPowerMode = surfaceControl.getDeclaredMethod(
                "setDisplayPowerMode",
                IBinder.class,
                int.class
            );
            setDisplayPowerMode.setAccessible(true);
            setDisplayPowerMode.invoke(null, token, mode);

            System.out.println("OK display power " + action);
        } catch (Throwable t) {
            t.printStackTrace(System.err);
            System.exit(1);
        }
    }

    private static IBinder getDisplayToken(int displayIndex) throws Exception {
        Class<?> surfaceControl = Class.forName("android.view.SurfaceControl");

        try {
            Method getPhysicalDisplayIds = surfaceControl.getDeclaredMethod("getPhysicalDisplayIds");
            getPhysicalDisplayIds.setAccessible(true);
            long[] ids = (long[]) getPhysicalDisplayIds.invoke(null);
            if (ids != null && ids.length > 0) {
                int idx = Math.min(displayIndex, ids.length - 1);
                Method getPhysicalDisplayToken = surfaceControl.getDeclaredMethod(
                    "getPhysicalDisplayToken",
                    long.class
                );
                getPhysicalDisplayToken.setAccessible(true);
                return (IBinder) getPhysicalDisplayToken.invoke(null, ids[idx]);
            }
        } catch (Throwable ignored) {
            // fallback below
        }

        try {
            Method getBuiltInDisplay = surfaceControl.getDeclaredMethod("getBuiltInDisplay", int.class);
            getBuiltInDisplay.setAccessible(true);
            return (IBinder) getBuiltInDisplay.invoke(null, 0);
        } catch (Throwable ignored) {
            // no fallback
        }

        return null;
    }
}
