package com.genymobile.scrcpy.wrappers;

import android.os.IInterface;
import com.genymobile.scrcpy.Ln;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/* JADX INFO: loaded from: classes.dex */
public class StatusBarManager {
    private Method collapsePanelsMethod;
    private Method expandNotificationsPanelMethod;
    private Method expandSettingsPanelMethod;
    private boolean expandSettingsPanelMethodNewVersion = true;
    private final IInterface manager;

    public StatusBarManager(IInterface iInterface) {
        this.manager = iInterface;
    }

    private Method getExpandNotificationsPanelMethod() throws NoSuchMethodException {
        if (this.expandNotificationsPanelMethod == null) {
            this.expandNotificationsPanelMethod = this.manager.getClass().getMethod("expandNotificationsPanel", new Class[0]);
        }
        return this.expandNotificationsPanelMethod;
    }

    private Method getExpandSettingsPanel() throws NoSuchMethodException {
        if (this.expandSettingsPanelMethod == null) {
            try {
                this.expandSettingsPanelMethod = this.manager.getClass().getMethod("expandSettingsPanel", String.class);
            } catch (NoSuchMethodException unused) {
                this.expandSettingsPanelMethod = this.manager.getClass().getMethod("expandSettingsPanel", new Class[0]);
                this.expandSettingsPanelMethodNewVersion = false;
            }
        }
        return this.expandSettingsPanelMethod;
    }

    private Method getCollapsePanelsMethod() throws NoSuchMethodException {
        if (this.collapsePanelsMethod == null) {
            this.collapsePanelsMethod = this.manager.getClass().getMethod("collapsePanels", new Class[0]);
        }
        return this.collapsePanelsMethod;
    }

    public void expandNotificationsPanel() {
        try {
            getExpandNotificationsPanelMethod().invoke(this.manager, new Object[0]);
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
        }
    }

    public void expandSettingsPanel() {
        try {
            Method expandSettingsPanel = getExpandSettingsPanel();
            if (this.expandSettingsPanelMethodNewVersion) {
                expandSettingsPanel.invoke(this.manager, null);
            } else {
                expandSettingsPanel.invoke(this.manager, new Object[0]);
            }
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
        }
    }

    public void collapsePanels() {
        try {
            getCollapsePanelsMethod().invoke(this.manager, new Object[0]);
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
        }
    }
}
