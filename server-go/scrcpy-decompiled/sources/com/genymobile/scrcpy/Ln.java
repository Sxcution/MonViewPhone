package com.genymobile.scrcpy;

import android.util.Log;

/* JADX INFO: loaded from: classes.dex */
public final class Ln {
    private static final String PREFIX = "[server] ";
    private static final String TAG = "scrcpy";
    private static Level threshold = Level.INFO;

    enum Level {
        VERBOSE,
        DEBUG,
        INFO,
        WARN,
        ERROR
    }

    private Ln() {
    }

    public static void initLogLevel(Level level) {
        threshold = level;
    }

    public static boolean isEnabled(Level level) {
        return level.ordinal() >= threshold.ordinal();
    }

    public static void v(String str) {
        if (isEnabled(Level.VERBOSE)) {
            Log.v(TAG, str);
            System.out.println("[server] VERBOSE: " + str);
        }
    }

    public static void d(String str) {
        if (isEnabled(Level.DEBUG)) {
            Log.d(TAG, str);
            System.out.println("[server] DEBUG: " + str);
        }
    }

    public static void i(String str) {
        if (isEnabled(Level.INFO)) {
            Log.i(TAG, str);
            System.out.println("[server] INFO: " + str);
        }
    }

    public static void w(String str) {
        if (isEnabled(Level.WARN)) {
            Log.w(TAG, str);
            System.out.println("[server] WARN: " + str);
        }
    }

    public static void e(String str, Throwable th) {
        if (isEnabled(Level.ERROR)) {
            Log.e(TAG, str, th);
            System.out.println("[server] ERROR: " + str);
            if (th != null) {
                th.printStackTrace();
            }
        }
    }

    public static void e(String str) {
        e(str, null);
    }
}
