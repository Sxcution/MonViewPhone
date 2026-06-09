package com.genymobile.scrcpy;

import android.graphics.Rect;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;

/* JADX INFO: loaded from: classes.dex */
public class VideoSettings {
    private static final int DEFAULT_BIT_RATE = 8000000;
    private static final byte DEFAULT_I_FRAME_INTERVAL = 10;
    private static final byte DEFAULT_MAX_FPS = 60;
    private Size bounds;
    private List<CodecOption> codecOptions;
    private String codecOptionsString;
    private Rect crop;
    private int displayId;
    private String encoderName;
    private int lockedVideoOrientation;
    private int maxFps;
    private boolean sendFrameMeta;
    private int bitRate = DEFAULT_BIT_RATE;
    private byte iFrameInterval = DEFAULT_I_FRAME_INTERVAL;

    public int getBitRate() {
        return this.bitRate;
    }

    public void setBitRate(int i) {
        this.bitRate = i;
    }

    public int getIFrameInterval() {
        return this.iFrameInterval;
    }

    public void setIFrameInterval(byte b) {
        this.iFrameInterval = b;
    }

    public Rect getCrop() {
        return this.crop;
    }

    public void setCrop(Rect rect) {
        this.crop = rect;
    }

    public boolean getSendFrameMeta() {
        return this.sendFrameMeta;
    }

    public void setSendFrameMeta(boolean z) {
        this.sendFrameMeta = z;
    }

    public int getDisplayId() {
        return this.displayId;
    }

    public void setDisplayId(int i) {
        this.displayId = i;
    }

    public int getMaxFps() {
        return this.maxFps;
    }

    public void setMaxFps(int i) {
        this.maxFps = i;
    }

    public int getLockedVideoOrientation() {
        return this.lockedVideoOrientation;
    }

    public void setLockedVideoOrientation(int i) {
        this.lockedVideoOrientation = i;
    }

    public Size getBounds() {
        return this.bounds;
    }

    public void setBounds(Size size) {
        this.bounds = size;
    }

    public void setBounds(int i, int i2) {
        this.bounds = new Size(i & (-16), i2 & (-16));
    }

    public List<CodecOption> getCodecOptions() {
        return this.codecOptions;
    }

    public void setCodecOptions(String str) {
        this.codecOptions = CodecOption.parse(str);
        if (str.equals("-")) {
            this.codecOptionsString = null;
        } else {
            this.codecOptionsString = str;
        }
    }

    public String getEncoderName() {
        return this.encoderName;
    }

    public void setEncoderName(String str) {
        if (str != null && str.equals("-")) {
            this.encoderName = null;
        } else {
            this.encoderName = str;
        }
    }

    public byte[] toByteArray() {
        int length;
        int width;
        int height;
        int i;
        int i2;
        int i3;
        int i4 = 0;
        byte[] bytes = new byte[0];
        String str = this.codecOptionsString;
        if (str != null) {
            bytes = str.getBytes(StandardCharsets.UTF_8);
            length = bytes.length + 0;
        } else {
            length = 0;
        }
        byte[] bytes2 = new byte[0];
        String str2 = this.encoderName;
        if (str2 != null) {
            bytes2 = str2.getBytes(StandardCharsets.UTF_8);
            length += bytes2.length;
        }
        ByteBuffer byteBufferAllocate = ByteBuffer.allocate(35 + length);
        byteBufferAllocate.putInt(this.bitRate);
        byteBufferAllocate.putInt(this.maxFps);
        byteBufferAllocate.put(this.iFrameInterval);
        Size size = this.bounds;
        if (size != null) {
            width = size.getWidth();
            height = this.bounds.getHeight();
        } else {
            width = 0;
            height = 0;
        }
        byteBufferAllocate.putShort((short) width);
        byteBufferAllocate.putShort((short) height);
        Rect rect = this.crop;
        if (rect != null) {
            i4 = rect.left;
            i = this.crop.top;
            i2 = this.crop.right;
            i3 = this.crop.bottom;
        } else {
            i = 0;
            i2 = 0;
            i3 = 0;
        }
        byteBufferAllocate.putShort((short) i4);
        byteBufferAllocate.putShort((short) i);
        byteBufferAllocate.putShort((short) i2);
        byteBufferAllocate.putShort((short) i3);
        byteBufferAllocate.put(this.sendFrameMeta ? (byte) 1 : (byte) 0);
        byteBufferAllocate.put((byte) this.lockedVideoOrientation);
        byteBufferAllocate.putInt(this.displayId);
        byteBufferAllocate.putInt(bytes.length);
        if (bytes.length != 0) {
            byteBufferAllocate.put(bytes);
        }
        byteBufferAllocate.putInt(bytes2.length);
        if (bytes2.length != 0) {
            byteBufferAllocate.put(bytes2);
        }
        return byteBufferAllocate.array();
    }

    public void merge(VideoSettings videoSettings) {
        this.codecOptions = videoSettings.codecOptions;
        this.codecOptionsString = videoSettings.codecOptionsString;
        this.encoderName = videoSettings.encoderName;
        this.bitRate = videoSettings.bitRate;
        this.maxFps = videoSettings.maxFps;
        this.iFrameInterval = videoSettings.iFrameInterval;
        this.bounds = videoSettings.bounds;
        this.crop = videoSettings.crop;
        this.sendFrameMeta = videoSettings.sendFrameMeta;
        this.lockedVideoOrientation = videoSettings.lockedVideoOrientation;
        this.displayId = videoSettings.displayId;
    }

    public static VideoSettings fromByteArray(byte[] bArr) {
        VideoSettings videoSettings = new VideoSettings();
        mergeFromByteArray(videoSettings, bArr);
        return videoSettings;
    }

    public static void mergeFromByteArray(VideoSettings videoSettings, byte[] bArr) {
        boolean z;
        byte b;
        int i;
        int i2;
        int i3;
        ByteBuffer byteBufferWrap = ByteBuffer.wrap(bArr);
        int i4 = byteBufferWrap.getInt();
        int i5 = byteBufferWrap.getInt();
        byte b2 = byteBufferWrap.get();
        short s = byteBufferWrap.getShort();
        short s2 = byteBufferWrap.getShort();
        short s3 = byteBufferWrap.getShort();
        short s4 = byteBufferWrap.getShort();
        short s5 = byteBufferWrap.getShort();
        short s6 = byteBufferWrap.getShort();
        boolean z2 = byteBufferWrap.get() != 0;
        byte b3 = byteBufferWrap.get();
        int i6 = byteBufferWrap.getInt();
        if (byteBufferWrap.remaining() <= 0 || (i3 = byteBufferWrap.getInt()) <= 0) {
            z = z2;
            b = b3;
            i = i6;
        } else {
            i = i6;
            byte[] bArr2 = new byte[i3];
            byteBufferWrap.get(bArr2, 0, i3);
            b = b3;
            z = z2;
            String str = new String(bArr2, 0, i3, StandardCharsets.UTF_8);
            if (!str.isEmpty()) {
                videoSettings.setCodecOptions(str);
            }
        }
        if (byteBufferWrap.remaining() > 0 && (i2 = byteBufferWrap.getInt()) > 0) {
            byte[] bArr3 = new byte[i2];
            byteBufferWrap.get(bArr3, 0, i2);
            String str2 = new String(bArr3, 0, i2, StandardCharsets.UTF_8);
            if (!str2.isEmpty()) {
                videoSettings.setEncoderName(str2);
            }
        }
        videoSettings.setBitRate(i4);
        videoSettings.setMaxFps(i5);
        videoSettings.setIFrameInterval(b2);
        videoSettings.setBounds(s, s2);
        if (s3 == 0 && s5 == 0 && s4 == 0 && s6 == 0) {
            videoSettings.setCrop(null);
        } else {
            videoSettings.setCrop(new Rect(s3, s4, s5, s6));
        }
        videoSettings.setSendFrameMeta(z);
        videoSettings.setLockedVideoOrientation(b);
        if (i > 0) {
            videoSettings.setDisplayId(i);
        }
    }

    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj != null && getClass() == obj.getClass()) {
            VideoSettings videoSettings = (VideoSettings) obj;
            if (this.bitRate == videoSettings.bitRate && this.maxFps == videoSettings.maxFps && this.lockedVideoOrientation == videoSettings.lockedVideoOrientation && this.iFrameInterval == videoSettings.iFrameInterval && this.sendFrameMeta == videoSettings.sendFrameMeta && this.displayId == videoSettings.displayId && Objects.equals(this.codecOptionsString, videoSettings.codecOptionsString) && Objects.equals(this.encoderName, videoSettings.encoderName) && Objects.equals(this.bounds, videoSettings.bounds) && Objects.equals(this.crop, videoSettings.crop)) {
                return true;
            }
        }
        return false;
    }

    public int hashCode() {
        return Objects.hash(Integer.valueOf(this.bitRate), Integer.valueOf(this.maxFps), Integer.valueOf(this.lockedVideoOrientation), Byte.valueOf(this.iFrameInterval), Boolean.valueOf(this.sendFrameMeta), Integer.valueOf(this.displayId), Integer.valueOf(Objects.hashCode(this.codecOptionsString)), Integer.valueOf(Objects.hashCode(this.encoderName)), Integer.valueOf(Objects.hashCode(this.bounds)), Integer.valueOf(Objects.hashCode(this.crop)));
    }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("VideoSettings{bitRate=");
        sb.append(this.bitRate);
        sb.append(", maxFps=");
        sb.append(this.maxFps);
        sb.append(", iFrameInterval=");
        sb.append((int) this.iFrameInterval);
        sb.append(", bounds=");
        sb.append(this.bounds);
        sb.append(", crop=");
        sb.append(this.crop);
        sb.append(", metaFrame=");
        sb.append(this.sendFrameMeta);
        sb.append(", lockedVideoOrientation=");
        sb.append(this.lockedVideoOrientation);
        sb.append(", displayId=");
        sb.append(this.displayId);
        sb.append(", codecOptions=");
        String str = this.codecOptionsString;
        if (str == null) {
            str = "-";
        }
        sb.append(str);
        sb.append(", encoderName=");
        String str2 = this.encoderName;
        sb.append(str2 != null ? str2 : "-");
        sb.append("}");
        return sb.toString();
    }
}
