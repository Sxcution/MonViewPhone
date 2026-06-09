package com.genymobile.scrcpy;

import java.io.IOException;
import java.io.OutputStream;

/* JADX INFO: loaded from: classes.dex */
public class DeviceMessageWriter {
    private final byte[] rawBuffer = new byte[DeviceMessage.MAX_EVENT_SIZE];

    public void writeTo(DeviceMessage deviceMessage, OutputStream outputStream) throws IOException {
        deviceMessage.writeToByteArray(this.rawBuffer);
        outputStream.write(this.rawBuffer, 0, deviceMessage.getLen());
    }
}
