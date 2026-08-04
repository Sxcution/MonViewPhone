package com.monviewphone.appmanagement;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Looper;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import java.util.List;

public class AppManagerHelper {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: AppManagerHelper <userId>");
            System.exit(1);
        }
        
        int userId = 0;
        try {
            userId = Integer.parseInt(args[0]);
        } catch (NumberFormatException e) {
            System.err.println("Invalid userId: " + args[0]);
            System.exit(1);
        }

        try {
            // Safely initialize Looper if needed
            try {
                if (Looper.getMainLooper() == null) {
                    Looper.prepareMainLooper();
                }
            } catch (Throwable ignored) {}

            // Get Context and PackageManager using reflection
            Class<?> activityThreadClass = Class.forName("android.app.ActivityThread");
            Object activityThread = activityThreadClass.getMethod("systemMain").invoke(null);
            Context context = (Context) activityThreadClass.getMethod("getSystemContext").invoke(activityThread);
            PackageManager pm = context.getPackageManager();

            // Get installed packages for user ID
            List<PackageInfo> packages = null;
            try {
                java.lang.reflect.Method getInstalledPackagesAsUser = pm.getClass().getMethod("getInstalledPackagesAsUser", int.class, int.class);
                packages = (List<PackageInfo>) getInstalledPackagesAsUser.invoke(pm, 0, userId);
            } catch (Throwable t) {
                // Fallback: try IPackageManager directly
                try {
                    Class<?> serviceManager = Class.forName("android.os.ServiceManager");
                    android.os.IBinder binder = (android.os.IBinder) serviceManager.getMethod("getService", String.class).invoke(null, "package");
                    Class<?> iPackageManagerStub = Class.forName("android.content.pm.IPackageManager$Stub");
                    Object ipm = iPackageManagerStub.getMethod("asInterface", android.os.IBinder.class).invoke(null, binder);
                    
                    // On newer Android versions, getInstalledPackages returns a ParceledListSlice
                    Object parceledList = ipm.getClass().getMethod("getInstalledPackages", int.class, int.class).invoke(ipm, 0, userId);
                    if (parceledList != null) {
                        packages = (List<PackageInfo>) parceledList.getClass().getMethod("getList").invoke(parceledList);
                    }
                } catch (Throwable t2) {
                    // Fallback to default getInstalledPackages (user 0)
                    packages = pm.getInstalledPackages(0);
                }
            }

            if (packages == null) {
                System.out.println("[]");
                System.exit(0);
            }

            StringBuilder json = new StringBuilder();
            json.append("[");
            boolean first = true;

            for (PackageInfo pkg : packages) {
                ApplicationInfo appInfo = pkg.applicationInfo;
                if (appInfo == null) continue;

                String packageName = pkg.packageName;
                String displayName = "";
                try {
                    displayName = appInfo.loadLabel(pm).toString();
                } catch (Throwable e) {
                    displayName = packageName;
                }
                
                if (displayName == null || displayName.trim().isEmpty()) {
                    displayName = packageName;
                }

                String baseApkPath = appInfo.sourceDir;
                String[] splitApkPaths = appInfo.splitSourceDirs;

                boolean isSystem = (appInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                boolean enabled = appInfo.enabled;

                // Load and encode icon to base64 PNG
                String base64Icon = "";
                try {
                    // Bypass vendor live icons: Samsung's calendar icon renders text and can
                    // abort a standalone app_process before its default Typeface is initialized.
                    Drawable drawable = appInfo.icon == 0
                            ? null
                            : pm.getResourcesForApplication(appInfo).getDrawable(appInfo.icon, null);
                    if (drawable != null) {
                        Bitmap bitmap;
                        if (drawable instanceof BitmapDrawable) {
                            bitmap = ((BitmapDrawable) drawable).getBitmap();
                        } else {
                            int width = drawable.getIntrinsicWidth();
                            int height = drawable.getIntrinsicHeight();
                            if (width <= 0) width = 64;
                            if (height <= 0) height = 64;
                            bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                            Canvas canvas = new Canvas(bitmap);
                            drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                            drawable.draw(canvas);
                        }
                        
                        // Resize bitmap to keep it tiny (48x48 is perfect for listing icons)
                        Bitmap resized = Bitmap.createScaledBitmap(bitmap, 48, 48, true);
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        resized.compress(Bitmap.CompressFormat.PNG, 90, baos);
                        byte[] bytes = baos.toByteArray();
                        base64Icon = Base64.encodeToString(bytes, Base64.NO_WRAP);
                    }
                } catch (Throwable t) {
                    // Fallback to empty string, frontend will use default icon
                }

                if (!first) {
                    json.append(",");
                }
                first = false;

                json.append("{");
                json.append("\"packageName\":\"").append(escapeJson(packageName)).append("\",");
                json.append("\"displayName\":\"").append(escapeJson(displayName)).append("\",");
                json.append("\"userId\":").append(userId).append(",");
                json.append("\"baseApkPath\":\"").append(escapeJson(baseApkPath)).append("\",");
                
                json.append("\"splitApkPaths\":[");
                if (splitApkPaths != null) {
                    for (int i = 0; i < splitApkPaths.length; i++) {
                        if (i > 0) json.append(",");
                        json.append("\"").append(escapeJson(splitApkPaths[i])).append("\"");
                    }
                }
                json.append("],");
                
                json.append("\"isSystem\":").append(isSystem).append(",");
                json.append("\"enabled\":").append(enabled).append(",");
                json.append("\"icon\":\"").append(base64Icon).append("\"");
                json.append("}");
            }

            json.append("]");
            System.out.println(json.toString());
            System.exit(0);
        } catch (Throwable t) {
            t.printStackTrace(System.err);
            System.exit(1);
        }
    }

    private static String escapeJson(String str) {
        if (str == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < str.length(); i++) {
            char ch = str.charAt(i);
            switch (ch) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (ch < 0x20) {
                        String ss = Integer.toHexString(ch);
                        sb.append("\\u");
                        for (int k = 0; k < 4 - ss.length(); k++) {
                            sb.append('0');
                        }
                        sb.append(ss.toUpperCase());
                    } else {
                        sb.append(ch);
                    }
            }
        }
        return sb.toString();
    }
}
