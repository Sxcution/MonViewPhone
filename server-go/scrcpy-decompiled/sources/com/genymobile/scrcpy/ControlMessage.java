package com.genymobile.scrcpy;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

/* JADX INFO: loaded from: classes.dex */
public final class ControlMessage {
    public static final int PUSH_STATE_APPEND = 2;
    public static final int PUSH_STATE_CANCEL = 4;
    public static final int PUSH_STATE_FINISH = 3;
    public static final int PUSH_STATE_NEW = 0;
    public static final int PUSH_STATE_START = 1;
    public static final int TYPE_BACK_OR_SCREEN_ON = 4;
    public static final int TYPE_CHANGE_STREAM_PARAMETERS = 101;
    public static final int TYPE_COLLAPSE_PANELS = 7;
    public static final int TYPE_EXPAND_NOTIFICATION_PANEL = 5;
    public static final int TYPE_EXPAND_SETTINGS_PANEL = 6;
    public static final int TYPE_GET_CLIPBOARD = 8;
    public static final int TYPE_INJECT_KEYCODE = 0;
    public static final int TYPE_INJECT_SCROLL_EVENT = 3;
    public static final int TYPE_INJECT_TEXT = 1;
    public static final int TYPE_INJECT_TOUCH_EVENT = 2;
    public static final int TYPE_PUSH_FILE = 102;
    public static final int TYPE_ROTATE_DEVICE = 11;
    public static final int TYPE_SET_CLIPBOARD = 9;
    public static final int TYPE_SET_SCREEN_POWER_MODE = 10;
    private int action;
    private int buttons;
    private byte[] bytes;
    private String fileName;
    private int fileSize;
    private int hScroll;
    private int keycode;
    private int metaState;
    private boolean paste;
    private long pointerId;
    private Position position;
    private float pressure;
    private byte[] pushChunk;
    private int pushChunkSize;
    private short pushId;
    private int pushState;
    private int repeat;
    private String text;
    private int type;
    private int vScroll;
    private VideoSettings videoSettings;

    private ControlMessage() {
    }

    public static ControlMessage createInjectKeycode(int i, int i2, int i3, int i4) {
        ControlMessage controlMessage = new ControlMessage();
        controlMessage.type = 0;
        controlMessage.action = i;
        controlMessage.keycode = i2;
        controlMessage.repeat = i3;
        controlMessage.metaState = i4;
        return controlMessage;
    }

    public static ControlMessage createInjectText(String str) {
        ControlMessage controlMessage = new ControlMessage();
        controlMessage.type = 1;
        controlMessage.text = str;
        return controlMessage;
    }

    public static ControlMessage createInjectTouchEvent(int i, long j, Position position, float f, int i2) {
        ControlMessage controlMessage = new ControlMessage();
        controlMessage.type = 2;
        controlMessage.action = i;
        controlMessage.pointerId = j;
        controlMessage.pressure = f;
        controlMessage.position = position;
        controlMessage.buttons = i2;
        return controlMessage;
    }

    public static ControlMessage createInjectScrollEvent(Position position, int i, int i2) {
        ControlMessage controlMessage = new ControlMessage();
        controlMessage.type = 3;
        controlMessage.position = position;
        controlMessage.hScroll = i;
        controlMessage.vScroll = i2;
        return controlMessage;
    }

    public static ControlMessage createBackOrScreenOn(int i) {
        ControlMessage controlMessage = new ControlMessage();
        controlMessage.type = 4;
        controlMessage.action = i;
        return controlMessage;
    }

    public static ControlMessage createSetClipboard(String str, boolean z) {
        ControlMessage controlMessage = new ControlMessage();
        controlMessage.type = 9;
        controlMessage.text = str;
        controlMessage.paste = z;
        return controlMessage;
    }

    public static ControlMessage createSetScreenPowerMode(int i) {
        ControlMessage controlMessage = new ControlMessage();
        controlMessage.type = 10;
        controlMessage.action = i;
        return controlMessage;
    }

    public static ControlMessage createChangeSteamParameters(byte[] bArr) {
        ControlMessage controlMessage = new ControlMessage();
        controlMessage.type = 101;
        controlMessage.videoSettings = VideoSettings.fromByteArray(bArr);
        return controlMessage;
    }

    public static ControlMessage createFilePush(byte[] bArr) {
        ControlMessage controlMessage = new ControlMessage();
        controlMessage.type = TYPE_PUSH_FILE;
        ByteBuffer byteBufferWrap = ByteBuffer.wrap(bArr);
        controlMessage.pushId = byteBufferWrap.getShort();
        byte b = byteBufferWrap.get();
        controlMessage.pushState = b;
        if (b != 0) {
            if (b == 1) {
                controlMessage.fileSize = byteBufferWrap.getInt();
                int i = byteBufferWrap.getShort();
                byte[] bArr2 = new byte[i];
                byteBufferWrap.get(bArr2, 0, i);
                controlMessage.fileName = new String(bArr2, 0, i, StandardCharsets.UTF_8);
            } else if (b == 2) {
                int i2 = byteBufferWrap.getInt();
                byte[] bArr3 = new byte[i2];
                if (byteBufferWrap.remaining() >= i2) {
                    byteBufferWrap.get(bArr3, 0, i2);
                    controlMessage.pushChunkSize = i2;
                    controlMessage.pushChunk = bArr3;
                } else {
                    controlMessage.pushState = 4;
                }
            } else if (b != 3 && b != 4) {
                Ln.w("Unknown push event state: " + controlMessage.pushState);
                return null;
            }
        }
        return controlMessage;
    }

    public static ControlMessage createEmpty(int i) {
        ControlMessage controlMessage = new ControlMessage();
        controlMessage.type = i;
        return controlMessage;
    }

    public int getType() {
        return this.type;
    }

    public String getText() {
        return this.text;
    }

    public int getMetaState() {
        return this.metaState;
    }

    public int getAction() {
        return this.action;
    }

    public int getKeycode() {
        return this.keycode;
    }

    public int getButtons() {
        return this.buttons;
    }

    public long getPointerId() {
        return this.pointerId;
    }

    public float getPressure() {
        return this.pressure;
    }

    public Position getPosition() {
        return this.position;
    }

    public int getHScroll() {
        return this.hScroll;
    }

    public int getVScroll() {
        return this.vScroll;
    }

    public boolean getPaste() {
        return this.paste;
    }

    public int getRepeat() {
        return this.repeat;
    }

    public byte[] getBytes() {
        return this.bytes;
    }

    public short getPushId() {
        return this.pushId;
    }

    public int getPushState() {
        return this.pushState;
    }

    public byte[] getPushChunk() {
        return this.pushChunk;
    }

    public int getPushChunkSize() {
        return this.pushChunkSize;
    }

    public String getFileName() {
        return this.fileName;
    }

    public int getFileSize() {
        return this.fileSize;
    }

    public VideoSettings getVideoSettings() {
        return this.videoSettings;
    }
}
