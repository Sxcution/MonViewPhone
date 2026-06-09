package com.monviewphone.helper;

import android.app.WallpaperManager;
import android.content.Context;
import java.io.FileInputStream;
import java.lang.reflect.Method;

public class SetWallpaper {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: SetWallpaper <image_path>");
            System.exit(1);
        }
        String imagePath = args[0];
        try {
            System.out.println("Starting wallpaper change...");
            Class<?> activityThreadClass = Class.forName("android.app.ActivityThread");
            Method systemMainMethod = activityThreadClass.getMethod("systemMain");
            Object activityThread = systemMainMethod.invoke(null);
            Method getSystemContextMethod = activityThreadClass.getMethod("getSystemContext");
            Context context = (Context) getSystemContextMethod.invoke(activityThread);

            if (context == null) {
                System.err.println("Failed to obtain System Context");
                System.exit(1);
            }

            WallpaperManager wm = WallpaperManager.getInstance(context);
            if (wm == null) {
                System.err.println("Failed to get WallpaperManager instance");
                System.exit(1);
            }

            try (FileInputStream fis = new FileInputStream(imagePath)) {
                // Set both system and lock screen wallpapers
                int FLAG_SYSTEM = 1;
                int FLAG_LOCK = 2;
                try {
                    Method setStreamMethod = wm.getClass().getMethod("setStream", 
                        java.io.InputStream.class, 
                        android.graphics.Rect.class, 
                        boolean.class, 
                        int.class
                    );
                    setStreamMethod.invoke(wm, fis, null, true, FLAG_SYSTEM | FLAG_LOCK);
                    System.out.println("Wallpaper set for System and Lock screen.");
                } catch (NoSuchMethodException e) {
                    // Fallback for older Android versions
                    wm.setStream(fis);
                    System.out.println("Wallpaper set via fallback setStream.");
                }
            }
            System.out.println("SUCCESS");
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
