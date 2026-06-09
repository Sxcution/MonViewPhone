package com.genymobile.scrcpy;

import android.app.Application;
import android.app.Instrumentation;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.os.Looper;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;

/* JADX INFO: loaded from: classes.dex */
public final class Workarounds {
    private static boolean looperPrepared = false;

    private Workarounds() {
    }

    public static void prepareMainLooper() {
        if (looperPrepared) {
            return;
        }
        looperPrepared = true;
        Looper.prepareMainLooper();
    }

    public static void fillAppInfo() {
        try {
            Class<?> cls = Class.forName("android.app.ActivityThread");
            Constructor<?> declaredConstructor = cls.getDeclaredConstructor(new Class[0]);
            declaredConstructor.setAccessible(true);
            Object objNewInstance = declaredConstructor.newInstance(new Object[0]);
            Field declaredField = cls.getDeclaredField("sCurrentActivityThread");
            declaredField.setAccessible(true);
            declaredField.set(null, objNewInstance);
            Class<?> cls2 = Class.forName("android.app.ActivityThread$AppBindData");
            Constructor<?> declaredConstructor2 = cls2.getDeclaredConstructor(new Class[0]);
            declaredConstructor2.setAccessible(true);
            Object objNewInstance2 = declaredConstructor2.newInstance(new Object[0]);
            ApplicationInfo applicationInfo = new ApplicationInfo();
            applicationInfo.packageName = BuildConfig.APPLICATION_ID;
            Field declaredField2 = cls2.getDeclaredField("appInfo");
            declaredField2.setAccessible(true);
            declaredField2.set(objNewInstance2, applicationInfo);
            Field declaredField3 = cls.getDeclaredField("mBoundApplication");
            declaredField3.setAccessible(true);
            declaredField3.set(objNewInstance, objNewInstance2);
            Application applicationNewApplication = Instrumentation.newApplication(Application.class, (Context) cls.getDeclaredMethod("getSystemContext", new Class[0]).invoke(objNewInstance, new Object[0]));
            Field declaredField4 = cls.getDeclaredField("mInitialApplication");
            declaredField4.setAccessible(true);
            declaredField4.set(objNewInstance, applicationNewApplication);
        } catch (Throwable th) {
            Ln.d("Could not fill app info: " + th.getMessage());
        }
    }
}
