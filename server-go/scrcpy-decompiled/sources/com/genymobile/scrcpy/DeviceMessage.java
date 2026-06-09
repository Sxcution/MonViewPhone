package com.genymobile.scrcpy;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

/* JADX INFO: loaded from: classes.dex */
public abstract class DeviceMessage {
    public static final int MAX_EVENT_SIZE = 4096;
    private static final int MESSAGE_MAX_SIZE = 262144;
    public static final int TYPE_CLIPBOARD = 0;
    public static final int TYPE_PUSH_RESPONSE = 101;
    private int type;

    public abstract int getLen();

    public abstract void writeToByteArray(byte[] bArr, int i);

    private DeviceMessage(int i) {
        this.type = i;
    }

    private static final class ClipboardMessage extends DeviceMessage {
        public static final int CLIPBOARD_TEXT_MAX_LENGTH = 262139;
        private int len;
        private byte[] raw;

        private ClipboardMessage(String str) {
            super(0);
            byte[] bytes = str.getBytes(StandardCharsets.UTF_8);
            this.raw = bytes;
            this.len = StringUtils.getUtf8TruncationIndex(bytes, CLIPBOARD_TEXT_MAX_LENGTH);
        }

        @Override // com.genymobile.scrcpy.DeviceMessage
        public void writeToByteArray(byte[] bArr, int i) {
            ByteBuffer byteBufferWrap = ByteBuffer.wrap(bArr, i, bArr.length - i);
            byteBufferWrap.put((byte) getType());
            byteBufferWrap.putInt(this.len);
            byteBufferWrap.put(this.raw, 0, this.len);
        }

        @Override // com.genymobile.scrcpy.DeviceMessage
        public int getLen() {
            return this.len + 5;
        }
    }

    private static final class FilePushResponseMessage extends DeviceMessage {
        private short id;
        private int result;

        @Override // com.genymobile.scrcpy.DeviceMessage
        public int getLen() {
            return 4;
        }

        private FilePushResponseMessage(short s, int i) {
            super(101);
            this.id = s;
            this.result = i;
        }

        @Override // com.genymobile.scrcpy.DeviceMessage
        public void writeToByteArray(byte[] bArr, int i) {
            ByteBuffer byteBufferWrap = ByteBuffer.wrap(bArr, i, bArr.length - i);
            byteBufferWrap.put((byte) getType());
            byteBufferWrap.putShort(this.id);
            byteBufferWrap.put((byte) this.result);
        }
    }

    public static DeviceMessage createClipboard(String str) {
        return new ClipboardMessage(str);
    }

    public static DeviceMessage createPushResponse(short s, int i) {
        return new FilePushResponseMessage(s, i);
    }

    public int getType() {
        return this.type;
    }

    public void writeToByteArray(byte[] bArr) {
        writeToByteArray(bArr, 0);
    }

    public byte[] writeToByteArray(int i) {
        byte[] bArr = new byte[getLen() + i];
        writeToByteArray(bArr, i);
        return bArr;
    }
}
