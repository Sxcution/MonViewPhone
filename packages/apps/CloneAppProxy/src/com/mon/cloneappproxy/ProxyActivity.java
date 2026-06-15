package com.mon.cloneappproxy;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.IActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.UserInfo;
import android.os.Bundle;
import android.os.RemoteException;
import android.os.UserHandle;
import android.os.UserManager;
import android.util.Log;
import android.widget.Toast;

import java.util.List;

public class ProxyActivity extends Activity {

    private static final String TAG = "CloneAppProxy";
    private static final String WECHAT_PKG = "com.tencent.mm";
    private static final String WECHAT_ACTIVITY = "com.tencent.mm.ui.LauncherUI";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            launchWeChatClone();
        } catch (Exception e) {
            Log.e(TAG, "Error in ProxyActivity", e);
            showToast("Error: " + e.getMessage());
        } finally {
            finish();
        }
    }

    private void launchWeChatClone() {
        UserManager userManager = (UserManager) getSystemService(Context.USER_SERVICE);
        if (userManager == null) {
            showToast("UserManager is null");
            return;
        }

        List<UserInfo> profiles = userManager.getProfiles(UserHandle.USER_SYSTEM);
        UserInfo cloneProfile = null;

        if (profiles != null) {
            for (UserInfo info : profiles) {
                if (info != null && info.id != UserHandle.USER_SYSTEM) {
                    // Check userType string (android.os.usertype.profile.CLONE) or by name
                    if ("android.os.usertype.profile.CLONE".equals(info.userType) || "Clone".equalsIgnoreCase(info.name)) {
                        cloneProfile = info;
                        break;
                    }
                }
            }
        }

        if (cloneProfile == null) {
            Log.e(TAG, "Clone profile not found");
            showToast("Clone profile or WeChat clone not found");
            return;
        }

        Log.d(TAG, "Found clone profile: " + cloneProfile.id);

        UserHandle cloneUserHandle = UserHandle.of(cloneProfile.id);

        // Check if WeChat is installed for cloneUserHandle
        Intent intent = new Intent(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        intent.setClassName(WECHAT_PKG, WECHAT_ACTIVITY);
        
        PackageManager pm = getPackageManager();
        List<ResolveInfo> activities = pm.queryIntentActivitiesAsUser(intent, 0, cloneProfile.id);
        if (activities == null || activities.isEmpty()) {
            Log.e(TAG, "WeChat clone not found for user " + cloneProfile.id);
            showToast("Clone profile or WeChat clone not found");
            return;
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);

        try {
            // Explicitly try to start the user in background in case it's stopped
            IActivityManager am = ActivityManager.getService();
            if (am != null) {
                am.startUserInBackground(cloneProfile.id);
            }
        } catch (RemoteException | SecurityException | NoSuchMethodError e) {
            Log.w(TAG, "Could not explicitly start user in background, continuing...", e);
        }

        try {
            startActivityAsUser(intent, cloneUserHandle);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start activity", e);
            showToast("Failed to launch WeChat in clone profile");
        }
    }

    private void showToast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
}
