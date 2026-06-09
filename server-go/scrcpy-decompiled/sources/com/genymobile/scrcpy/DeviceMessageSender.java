package com.genymobile.scrcpy;

import java.io.IOException;

/* JADX INFO: loaded from: classes.dex */
public final class DeviceMessageSender {
    private String clipboardText;
    private final Connection connection;

    public DeviceMessageSender(Connection connection) {
        this.connection = connection;
    }

    public synchronized void pushClipboardText(String str) {
        this.clipboardText = str;
        notify();
    }

    public void loop() throws InterruptedException, IOException {
        String str;
        while (true) {
            synchronized (this) {
                while (this.clipboardText == null) {
                    wait();
                }
                str = this.clipboardText;
                this.clipboardText = null;
            }
            this.connection.sendDeviceMessage(DeviceMessage.createClipboard(str));
        }
    }
}
