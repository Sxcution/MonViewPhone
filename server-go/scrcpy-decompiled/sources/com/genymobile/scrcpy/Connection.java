package com.genymobile.scrcpy;

import android.os.Build;
import com.genymobile.scrcpy.Device;
import com.genymobile.scrcpy.wrappers.ContentProvider;
import java.io.IOException;
import java.nio.ByteBuffer;

/* JADX INFO: loaded from: classes.dex */
public abstract class Connection implements Device.RotationListener, Device.ClipboardListener {
    protected static final int DEVICE_NAME_FIELD_LENGTH = 64;
    protected Controller controller;
    protected Device device;
    protected final Options options;
    protected final ControlMessageReader reader = new ControlMessageReader();
    protected ScreenEncoder screenEncoder;
    protected StreamInvalidateListener streamInvalidateListener;
    protected final VideoSettings videoSettings;

    public interface StreamInvalidateListener {
        void onStreamInvalidate();
    }

    abstract void close() throws Exception;

    abstract boolean hasConnections();

    abstract void send(ByteBuffer byteBuffer);

    abstract void sendDeviceMessage(DeviceMessage deviceMessage) throws IOException;

    public Connection(Options options, VideoSettings videoSettings) {
        Ln.i("Device: " + Build.MANUFACTURER + " " + Build.MODEL + " (Android " + Build.VERSION.RELEASE + ")");
        this.videoSettings = videoSettings;
        this.options = options;
        Device device = new Device(options, videoSettings);
        this.device = device;
        device.setRotationListener(this);
        Controller controller = new Controller(this.device, this);
        this.controller = controller;
        startDeviceMessageSender(controller.getSender());
        this.device.setClipboardListener(this);
        int i = -1;
        boolean z = false;
        if (options.getShowTouches() || options.getStayAwake()) {
            ContentProvider contentProviderCreateSettingsProvider = Device.createSettingsProvider();
            try {
                boolean z2 = options.getShowTouches() ? !"1".equals(contentProviderCreateSettingsProvider.getAndPutValue(ContentProvider.TABLE_SYSTEM, "show_touches", "1")) : false;
                if (options.getStayAwake()) {
                    try {
                        int i2 = Integer.parseInt(contentProviderCreateSettingsProvider.getAndPutValue(ContentProvider.TABLE_GLOBAL, "stay_on_while_plugged_in", String.valueOf(7)));
                        if (i2 != 7) {
                            i = i2;
                        }
                    } catch (NumberFormatException unused) {
                        i = 0;
                    }
                }
                if (contentProviderCreateSettingsProvider != null) {
                    contentProviderCreateSettingsProvider.close();
                }
                z = z2;
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
        try {
            CleanUp.configure(options.getDisplayId(), i, z, true, options.getPowerOffScreenOnClose());
        } catch (IOException e) {
            Ln.w("CleanUp.configure() failed:" + e.getMessage());
        }
    }

    public boolean setVideoSettings(VideoSettings videoSettings) {
        if (this.videoSettings.equals(videoSettings)) {
            return false;
        }
        this.videoSettings.merge(videoSettings);
        this.device.applyNewVideoSetting(this.videoSettings);
        StreamInvalidateListener streamInvalidateListener = this.streamInvalidateListener;
        if (streamInvalidateListener == null) {
            return true;
        }
        streamInvalidateListener.onStreamInvalidate();
        return true;
    }

    public void setStreamInvalidateListener(StreamInvalidateListener streamInvalidateListener) {
        this.streamInvalidateListener = streamInvalidateListener;
    }

    @Override // com.genymobile.scrcpy.Device.RotationListener
    public void onRotationChanged(int i) {
        StreamInvalidateListener streamInvalidateListener = this.streamInvalidateListener;
        if (streamInvalidateListener != null) {
            streamInvalidateListener.onStreamInvalidate();
        }
    }

    @Override // com.genymobile.scrcpy.Device.ClipboardListener
    public void onClipboardTextChanged(String str) {
        this.controller.getSender().pushClipboardText(str);
    }

    private static void startDeviceMessageSender(final DeviceMessageSender deviceMessageSender) {
        new Thread(new Runnable() { // from class: com.genymobile.scrcpy.Connection.1
            @Override // java.lang.Runnable
            public void run() {
                try {
                    deviceMessageSender.loop();
                } catch (IOException | InterruptedException unused) {
                    Ln.d("Device message sender stopped");
                }
            }
        }).start();
    }
}
