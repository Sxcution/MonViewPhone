package com.genymobile.scrcpy;

import android.os.Parcel;
import android.os.Parcelable;
import android.util.Base64;
import com.genymobile.scrcpy.wrappers.ContentProvider;
import com.genymobile.scrcpy.wrappers.ServiceManager;
import java.io.File;
import java.io.IOException;

/* JADX INFO: loaded from: classes.dex */
public final class CleanUp {
    public static final String SERVER_PATH = "/data/local/tmp/scrcpy-server.jar";

    public static class Config implements Parcelable {
        public static final Parcelable.Creator<Config> CREATOR = new Parcelable.Creator<Config>() { // from class: com.genymobile.scrcpy.CleanUp.Config.1
            /* JADX WARN: Can't rename method to resolve collision */
            @Override // android.os.Parcelable.Creator
            public Config createFromParcel(Parcel parcel) {
                return new Config(parcel);
            }

            /* JADX WARN: Can't rename method to resolve collision */
            @Override // android.os.Parcelable.Creator
            public Config[] newArray(int i) {
                return new Config[i];
            }
        };
        private static final int FLAG_DISABLE_SHOW_TOUCHES = 1;
        private static final int FLAG_POWER_OFF_SCREEN = 4;
        private static final int FLAG_RESTORE_NORMAL_POWER_MODE = 2;
        private boolean disableShowTouches;
        private int displayId;
        private boolean powerOffScreen;
        private boolean restoreNormalPowerMode;
        private int restoreStayOn;

        @Override // android.os.Parcelable
        public int describeContents() {
            return 0;
        }

        public Config() {
            this.restoreStayOn = -1;
        }

        protected Config(Parcel parcel) {
            this.restoreStayOn = -1;
            this.displayId = parcel.readInt();
            this.restoreStayOn = parcel.readInt();
            byte b = parcel.readByte();
            this.disableShowTouches = (b & 1) != 0;
            this.restoreNormalPowerMode = (b & 2) != 0;
            this.powerOffScreen = (b & 4) != 0;
        }

        @Override // android.os.Parcelable
        public void writeToParcel(Parcel parcel, int i) {
            parcel.writeInt(this.displayId);
            parcel.writeInt(this.restoreStayOn);
            byte b = this.disableShowTouches ? (byte) 1 : (byte) 0;
            if (this.restoreNormalPowerMode) {
                b = (byte) (b | 2);
            }
            if (this.powerOffScreen) {
                b = (byte) (b | 4);
            }
            parcel.writeByte(b);
        }

        /* JADX INFO: Access modifiers changed from: private */
        public boolean hasWork() {
            return this.disableShowTouches || this.restoreStayOn != -1 || this.restoreNormalPowerMode || this.powerOffScreen;
        }

        byte[] serialize() {
            Parcel parcelObtain = Parcel.obtain();
            writeToParcel(parcelObtain, 0);
            byte[] bArrMarshall = parcelObtain.marshall();
            parcelObtain.recycle();
            return bArrMarshall;
        }

        static Config deserialize(byte[] bArr) {
            Parcel parcelObtain = Parcel.obtain();
            parcelObtain.unmarshall(bArr, 0, bArr.length);
            parcelObtain.setDataPosition(0);
            return CREATOR.createFromParcel(parcelObtain);
        }

        static Config fromBase64(String str) {
            return deserialize(Base64.decode(str, 2));
        }

        String toBase64() {
            return Base64.encodeToString(serialize(), 2);
        }
    }

    private CleanUp() {
    }

    public static void configure(int i, int i2, boolean z, boolean z2, boolean z3) throws IOException {
        Config config = new Config();
        config.displayId = i;
        config.disableShowTouches = z;
        config.restoreStayOn = i2;
        config.restoreNormalPowerMode = z2;
        config.powerOffScreen = z3;
        if (config.hasWork()) {
            startProcess(config);
        } else {
            unlinkSelf();
        }
    }

    private static void startProcess(Config config) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder("app_process", "/", CleanUp.class.getName(), config.toBase64());
        processBuilder.environment().put("CLASSPATH", SERVER_PATH);
        processBuilder.start();
    }

    private static void unlinkSelf() {
        try {
            new File(SERVER_PATH).delete();
        } catch (Exception e) {
            Ln.e("Could not unlink server", e);
        }
    }

    public static void main(String... strArr) {
        unlinkSelf();
        try {
            System.in.read();
        } catch (IOException unused) {
        }
        Ln.i("Cleaning up");
        Config configFromBase64 = Config.fromBase64(strArr[0]);
        if (configFromBase64.disableShowTouches || configFromBase64.restoreStayOn != -1) {
            ContentProvider contentProviderCreateSettingsProvider = new ServiceManager().getActivityManager().createSettingsProvider();
            try {
                if (configFromBase64.disableShowTouches) {
                    Ln.i("Disabling \"show touches\"");
                    contentProviderCreateSettingsProvider.putValue(ContentProvider.TABLE_SYSTEM, "show_touches", "0");
                }
                if (configFromBase64.restoreStayOn != -1) {
                    Ln.i("Restoring \"stay awake\"");
                    contentProviderCreateSettingsProvider.putValue(ContentProvider.TABLE_GLOBAL, "stay_on_while_plugged_in", String.valueOf(configFromBase64.restoreStayOn));
                }
                if (contentProviderCreateSettingsProvider != null) {
                    contentProviderCreateSettingsProvider.close();
                }
            } catch (Throwable th) {
                try {
                    throw th;
                } catch (Throwable th2) {
                    if (contentProviderCreateSettingsProvider != null) {
                        try {
                            contentProviderCreateSettingsProvider.close();
                        } catch (Throwable th3) {
                            th.addSuppressed(th3);
                        }
                    }
                    throw th2;
                }
            }
        }
        if (Device.isScreenOn()) {
            if (!configFromBase64.powerOffScreen) {
                if (configFromBase64.restoreNormalPowerMode) {
                    Ln.i("Restoring normal power mode");
                    Device.setScreenPowerMode(2);
                    return;
                }
                return;
            }
            Ln.i("Power off screen");
            Device.powerOffScreen(configFromBase64.displayId);
        }
    }
}
