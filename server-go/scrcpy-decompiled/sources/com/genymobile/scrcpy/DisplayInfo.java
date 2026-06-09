package com.genymobile.scrcpy;

import java.nio.ByteBuffer;

/* JADX INFO: loaded from: classes.dex */
public final class DisplayInfo {
    public static final int FLAG_SUPPORTS_PROTECTED_BUFFERS = 1;
    private final int displayId;
    private final int flags;
    private final int layerStack;
    private final int rotation;
    private final Size size;

    public DisplayInfo(int i, Size size, int i2, int i3, int i4) {
        this.displayId = i;
        this.size = size;
        this.rotation = i2;
        this.layerStack = i3;
        this.flags = i4;
    }

    public int getDisplayId() {
        return this.displayId;
    }

    public Size getSize() {
        return this.size;
    }

    public int getRotation() {
        return this.rotation;
    }

    public int getLayerStack() {
        return this.layerStack;
    }

    public int getFlags() {
        return this.flags;
    }

    public byte[] toByteArray() {
        ByteBuffer byteBufferAllocate = ByteBuffer.allocate(24);
        byteBufferAllocate.putInt(this.displayId);
        byteBufferAllocate.putInt(this.size.getWidth());
        byteBufferAllocate.putInt(this.size.getHeight());
        byteBufferAllocate.putInt(this.rotation);
        byteBufferAllocate.putInt(this.layerStack);
        byteBufferAllocate.putInt(this.flags);
        byteBufferAllocate.rewind();
        return byteBufferAllocate.array();
    }
}
