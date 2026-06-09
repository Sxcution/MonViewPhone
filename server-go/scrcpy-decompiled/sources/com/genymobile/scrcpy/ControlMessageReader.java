package com.genymobile.scrcpy;

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

/* JADX INFO: loaded from: classes.dex */
public class ControlMessageReader {
    static final int BACK_OR_SCREEN_ON_LENGTH = 1;
    public static final int CLIPBOARD_TEXT_MAX_LENGTH = 262138;
    static final int INJECT_KEYCODE_PAYLOAD_LENGTH = 13;
    static final int INJECT_SCROLL_EVENT_PAYLOAD_LENGTH = 20;
    public static final int INJECT_TEXT_MAX_LENGTH = 300;
    static final int INJECT_TOUCH_EVENT_PAYLOAD_LENGTH = 27;
    private static final int MESSAGE_MAX_SIZE = 262144;
    static final int SET_CLIPBOARD_FIXED_PAYLOAD_LENGTH = 1;
    static final int SET_SCREEN_POWER_MODE_PAYLOAD_LENGTH = 1;
    private final ByteBuffer buffer;
    private final byte[] rawBuffer;

    private static int toUnsigned(byte b) {
        return b & 255;
    }

    private static int toUnsigned(short s) {
        return s & 65535;
    }

    public ControlMessageReader() {
        byte[] bArr = new byte[MESSAGE_MAX_SIZE];
        this.rawBuffer = bArr;
        ByteBuffer byteBufferWrap = ByteBuffer.wrap(bArr);
        this.buffer = byteBufferWrap;
        byteBufferWrap.limit(0);
    }

    public boolean isFull() {
        return this.buffer.remaining() == this.rawBuffer.length;
    }

    public void readFrom(InputStream inputStream) throws IOException {
        if (isFull()) {
            throw new IllegalStateException("Buffer full, call next() to consume");
        }
        this.buffer.compact();
        int iPosition = this.buffer.position();
        byte[] bArr = this.rawBuffer;
        int i = inputStream.read(bArr, iPosition, bArr.length - iPosition);
        if (i == -1) {
            throw new EOFException("Controller socket closed");
        }
        this.buffer.position(iPosition + i);
        this.buffer.flip();
    }

    public ControlMessage next() {
        return parseEvent(this.buffer);
    }

    public ControlMessage parseEvent(ByteBuffer byteBuffer) {
        ControlMessage changeStreamParameters = null;
        if (!byteBuffer.hasRemaining()) {
            return null;
        }
        int iPosition = byteBuffer.position();
        byte b = byteBuffer.get();
        if (b == 101) {
            changeStreamParameters = parseChangeStreamParameters(byteBuffer);
        } else if (b != 102) {
            switch (b) {
                case 0:
                    changeStreamParameters = parseInjectKeycode(byteBuffer);
                    break;
                case 1:
                    changeStreamParameters = parseInjectText(byteBuffer);
                    break;
                case 2:
                    changeStreamParameters = parseInjectTouchEvent(byteBuffer);
                    break;
                case 3:
                    changeStreamParameters = parseInjectScrollEvent(byteBuffer);
                    break;
                case 4:
                    changeStreamParameters = parseBackOrScreenOnEvent(byteBuffer);
                    break;
                case ControlMessage.TYPE_EXPAND_NOTIFICATION_PANEL /* 5 */:
                case ControlMessage.TYPE_EXPAND_SETTINGS_PANEL /* 6 */:
                case ControlMessage.TYPE_COLLAPSE_PANELS /* 7 */:
                case 8:
                case ControlMessage.TYPE_ROTATE_DEVICE /* 11 */:
                    changeStreamParameters = ControlMessage.createEmpty(b);
                    break;
                case ControlMessage.TYPE_SET_CLIPBOARD /* 9 */:
                    changeStreamParameters = parseSetClipboard(byteBuffer);
                    break;
                case 10:
                    changeStreamParameters = parseSetScreenPowerMode(byteBuffer);
                    break;
                default:
                    Ln.w("Unknown event type: " + ((int) b));
                    break;
            }
        } else {
            changeStreamParameters = parsePushFile(byteBuffer);
        }
        if (changeStreamParameters == null) {
            byteBuffer.position(iPosition);
        }
        return changeStreamParameters;
    }

    private ControlMessage parseChangeStreamParameters(ByteBuffer byteBuffer) {
        int iRemaining = byteBuffer.remaining();
        byte[] bArr = new byte[iRemaining];
        if (iRemaining > 0) {
            byteBuffer.get(bArr, 0, iRemaining);
        }
        return ControlMessage.createChangeSteamParameters(bArr);
    }

    private ControlMessage parsePushFile(ByteBuffer byteBuffer) {
        int iRemaining = byteBuffer.remaining();
        byte[] bArr = new byte[iRemaining];
        if (iRemaining > 0) {
            byteBuffer.get(bArr, 0, iRemaining);
        }
        return ControlMessage.createFilePush(bArr);
    }

    private ControlMessage parseInjectKeycode(ByteBuffer byteBuffer) {
        if (byteBuffer.remaining() < INJECT_KEYCODE_PAYLOAD_LENGTH) {
            return null;
        }
        return ControlMessage.createInjectKeycode(toUnsigned(byteBuffer.get()), byteBuffer.getInt(), byteBuffer.getInt(), byteBuffer.getInt());
    }

    private String parseString(ByteBuffer byteBuffer) {
        int i;
        if (byteBuffer.remaining() < 4 || byteBuffer.remaining() < (i = byteBuffer.getInt())) {
            return null;
        }
        byteBuffer.get(this.rawBuffer, 0, i);
        return new String(this.rawBuffer, 0, i, StandardCharsets.UTF_8);
    }

    private ControlMessage parseInjectText(ByteBuffer byteBuffer) {
        String string = parseString(byteBuffer);
        if (string == null) {
            return null;
        }
        return ControlMessage.createInjectText(string);
    }

    private ControlMessage parseInjectTouchEvent(ByteBuffer byteBuffer) {
        if (byteBuffer.remaining() < INJECT_TOUCH_EVENT_PAYLOAD_LENGTH) {
            return null;
        }
        int unsigned = toUnsigned(byteBuffer.get());
        long j = byteBuffer.getLong();
        Position position = readPosition(byteBuffer);
        int unsigned2 = toUnsigned(byteBuffer.getShort());
        return ControlMessage.createInjectTouchEvent(unsigned, j, position, unsigned2 == 65535 ? 1.0f : unsigned2 / 65536.0f, byteBuffer.getInt());
    }

    private ControlMessage parseInjectScrollEvent(ByteBuffer byteBuffer) {
        if (byteBuffer.remaining() < 20) {
            return null;
        }
        return ControlMessage.createInjectScrollEvent(readPosition(byteBuffer), byteBuffer.getInt(), byteBuffer.getInt());
    }

    private ControlMessage parseBackOrScreenOnEvent(ByteBuffer byteBuffer) {
        if (byteBuffer.remaining() < 1) {
            return null;
        }
        return ControlMessage.createBackOrScreenOn(toUnsigned(byteBuffer.get()));
    }

    private ControlMessage parseSetClipboard(ByteBuffer byteBuffer) {
        if (byteBuffer.remaining() < 1) {
            return null;
        }
        boolean z = byteBuffer.get() != 0;
        String string = parseString(byteBuffer);
        if (string == null) {
            return null;
        }
        return ControlMessage.createSetClipboard(string, z);
    }

    private ControlMessage parseSetScreenPowerMode(ByteBuffer byteBuffer) {
        if (byteBuffer.remaining() < 1) {
            return null;
        }
        return ControlMessage.createSetScreenPowerMode(byteBuffer.get());
    }

    private static Position readPosition(ByteBuffer byteBuffer) {
        return new Position(byteBuffer.getInt(), byteBuffer.getInt(), toUnsigned(byteBuffer.getShort()), toUnsigned(byteBuffer.getShort()));
    }
}
