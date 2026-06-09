package com.genymobile.scrcpy.wrappers;

import android.os.Bundle;
import android.os.IBinder;
import com.genymobile.scrcpy.Ln;
import java.io.Closeable;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/* JADX INFO: loaded from: classes.dex */
public class ContentProvider implements Closeable {
    private static final String CALL_METHOD_GET_GLOBAL = "GET_global";
    private static final String CALL_METHOD_GET_SECURE = "GET_secure";
    private static final String CALL_METHOD_GET_SYSTEM = "GET_system";
    private static final String CALL_METHOD_PUT_GLOBAL = "PUT_global";
    private static final String CALL_METHOD_PUT_SECURE = "PUT_secure";
    private static final String CALL_METHOD_PUT_SYSTEM = "PUT_system";
    private static final String CALL_METHOD_USER_KEY = "_user";
    private static final String NAME_VALUE_TABLE_VALUE = "value";
    public static final String TABLE_GLOBAL = "global";
    public static final String TABLE_SECURE = "secure";
    public static final String TABLE_SYSTEM = "system";
    private Object attributionSource;
    private Method callMethod;
    private int callMethodVersion;
    private final ActivityManager manager;
    private final String name;
    private final Object provider;
    private final IBinder token;

    ContentProvider(ActivityManager activityManager, Object obj, String str, IBinder iBinder) {
        this.manager = activityManager;
        this.provider = obj;
        this.name = str;
        this.token = iBinder;
    }

    private Method getCallMethod() throws NoSuchMethodException {
        if (this.callMethod == null) {
            try {
                try {
                    try {
                        this.callMethod = this.provider.getClass().getMethod("call", Class.forName("android.content.AttributionSource"), String.class, String.class, String.class, Bundle.class);
                        this.callMethodVersion = 0;
                    } catch (NoSuchMethodException unused) {
                        this.callMethod = this.provider.getClass().getMethod("call", String.class, String.class, String.class, String.class, Bundle.class);
                        this.callMethodVersion = 2;
                    }
                } catch (ClassNotFoundException | NoSuchMethodException unused2) {
                    this.callMethod = this.provider.getClass().getMethod("call", String.class, String.class, String.class, String.class, String.class, Bundle.class);
                    this.callMethodVersion = 1;
                }
            } catch (NoSuchMethodException unused3) {
                this.callMethod = this.provider.getClass().getMethod("call", String.class, String.class, String.class, Bundle.class);
                this.callMethodVersion = 3;
            }
        }
        return this.callMethod;
    }

    private Object getAttributionSource() throws IllegalAccessException, NoSuchMethodException, InstantiationException, ClassNotFoundException, InvocationTargetException {
        if (this.attributionSource == null) {
            Class<?> cls = Class.forName("android.content.AttributionSource$Builder");
            Object objNewInstance = cls.getConstructor(Integer.TYPE).newInstance(0);
            cls.getDeclaredMethod("setPackageName", String.class).invoke(objNewInstance, ServiceManager.PACKAGE_NAME);
            this.attributionSource = cls.getDeclaredMethod("build", new Class[0]).invoke(objNewInstance, new Object[0]);
        }
        return this.attributionSource;
    }

    private Bundle call(String str, String str2, Bundle bundle) {
        try {
            Method callMethod = getCallMethod();
            int i = this.callMethodVersion;
            return (Bundle) callMethod.invoke(this.provider, i != 0 ? i != 1 ? i != 2 ? new Object[]{ServiceManager.PACKAGE_NAME, str, str2, bundle} : new Object[]{ServiceManager.PACKAGE_NAME, "settings", str, str2, bundle} : new Object[]{ServiceManager.PACKAGE_NAME, null, "settings", str, str2, bundle} : new Object[]{getAttributionSource(), "settings", str, str2, bundle});
        } catch (ClassNotFoundException | IllegalAccessException | InstantiationException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
            return null;
        }
    }

    @Override // java.io.Closeable, java.lang.AutoCloseable
    public void close() {
        this.manager.removeContentProviderExternal(this.name, this.token);
    }

    /* JADX WARN: Removed duplicated region for block: B:18:0x0034  */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    private static java.lang.String getGetMethod(java.lang.String r4) {
        /*
            int r0 = r4.hashCode()
            r1 = -1243020381(0xffffffffb5e903a3, float:-1.7360911E-6)
            r2 = 2
            r3 = 1
            if (r0 == r1) goto L2a
            r1 = -906273929(0xffffffffc9fb5b77, float:-2059118.9)
            if (r0 == r1) goto L20
            r1 = -887328209(0xffffffffcb1c722f, float:-1.0252847E7)
            if (r0 == r1) goto L16
            goto L34
        L16:
            java.lang.String r0 = "system"
            boolean r0 = r4.equals(r0)
            if (r0 == 0) goto L34
            r0 = 1
            goto L35
        L20:
            java.lang.String r0 = "secure"
            boolean r0 = r4.equals(r0)
            if (r0 == 0) goto L34
            r0 = 0
            goto L35
        L2a:
            java.lang.String r0 = "global"
            boolean r0 = r4.equals(r0)
            if (r0 == 0) goto L34
            r0 = 2
            goto L35
        L34:
            r0 = -1
        L35:
            if (r0 == 0) goto L58
            if (r0 == r3) goto L55
            if (r0 != r2) goto L3e
            java.lang.String r4 = "GET_global"
            return r4
        L3e:
            java.lang.IllegalArgumentException r0 = new java.lang.IllegalArgumentException
            java.lang.StringBuilder r1 = new java.lang.StringBuilder
            r1.<init>()
            java.lang.String r2 = "Invalid table: "
            r1.append(r2)
            r1.append(r4)
            java.lang.String r4 = r1.toString()
            r0.<init>(r4)
            throw r0
        L55:
            java.lang.String r4 = "GET_system"
            return r4
        L58:
            java.lang.String r4 = "GET_secure"
            return r4
        */
        throw new UnsupportedOperationException("Method not decompiled: com.genymobile.scrcpy.wrappers.ContentProvider.getGetMethod(java.lang.String):java.lang.String");
    }

    /* JADX WARN: Removed duplicated region for block: B:18:0x0034  */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    private static java.lang.String getPutMethod(java.lang.String r4) {
        /*
            int r0 = r4.hashCode()
            r1 = -1243020381(0xffffffffb5e903a3, float:-1.7360911E-6)
            r2 = 2
            r3 = 1
            if (r0 == r1) goto L2a
            r1 = -906273929(0xffffffffc9fb5b77, float:-2059118.9)
            if (r0 == r1) goto L20
            r1 = -887328209(0xffffffffcb1c722f, float:-1.0252847E7)
            if (r0 == r1) goto L16
            goto L34
        L16:
            java.lang.String r0 = "system"
            boolean r0 = r4.equals(r0)
            if (r0 == 0) goto L34
            r0 = 1
            goto L35
        L20:
            java.lang.String r0 = "secure"
            boolean r0 = r4.equals(r0)
            if (r0 == 0) goto L34
            r0 = 0
            goto L35
        L2a:
            java.lang.String r0 = "global"
            boolean r0 = r4.equals(r0)
            if (r0 == 0) goto L34
            r0 = 2
            goto L35
        L34:
            r0 = -1
        L35:
            if (r0 == 0) goto L58
            if (r0 == r3) goto L55
            if (r0 != r2) goto L3e
            java.lang.String r4 = "PUT_global"
            return r4
        L3e:
            java.lang.IllegalArgumentException r0 = new java.lang.IllegalArgumentException
            java.lang.StringBuilder r1 = new java.lang.StringBuilder
            r1.<init>()
            java.lang.String r2 = "Invalid table: "
            r1.append(r2)
            r1.append(r4)
            java.lang.String r4 = r1.toString()
            r0.<init>(r4)
            throw r0
        L55:
            java.lang.String r4 = "PUT_system"
            return r4
        L58:
            java.lang.String r4 = "PUT_secure"
            return r4
        */
        throw new UnsupportedOperationException("Method not decompiled: com.genymobile.scrcpy.wrappers.ContentProvider.getPutMethod(java.lang.String):java.lang.String");
    }

    public String getValue(String str, String str2) {
        String getMethod = getGetMethod(str);
        Bundle bundle = new Bundle();
        bundle.putInt(CALL_METHOD_USER_KEY, 0);
        Bundle bundleCall = call(getMethod, str2, bundle);
        if (bundleCall == null) {
            return null;
        }
        return bundleCall.getString(NAME_VALUE_TABLE_VALUE);
    }

    public void putValue(String str, String str2, String str3) {
        String putMethod = getPutMethod(str);
        Bundle bundle = new Bundle();
        bundle.putInt(CALL_METHOD_USER_KEY, 0);
        bundle.putString(NAME_VALUE_TABLE_VALUE, str3);
        call(putMethod, str2, bundle);
    }

    public String getAndPutValue(String str, String str2, String str3) {
        String value = getValue(str, str2);
        if (!str3.equals(value)) {
            putValue(str, str2, str3);
        }
        return value;
    }
}
