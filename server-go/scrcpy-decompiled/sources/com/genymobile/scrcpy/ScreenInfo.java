package com.genymobile.scrcpy;

import android.graphics.Rect;
import java.nio.ByteBuffer;

/* JADX INFO: loaded from: classes.dex */
public final class ScreenInfo {
    private final Rect contentRect;
    private final int deviceRotation;
    private final int lockedVideoOrientation;
    private final Size unlockedVideoSize;

    public ScreenInfo(Rect rect, Size size, int i, int i2) {
        this.contentRect = rect;
        this.unlockedVideoSize = size;
        this.deviceRotation = i;
        this.lockedVideoOrientation = i2;
    }

    public Rect getContentRect() {
        return this.contentRect;
    }

    public Size getUnlockedVideoSize() {
        return this.unlockedVideoSize;
    }

    public Size getVideoSize() {
        if (getVideoRotation() % 2 == 0) {
            return this.unlockedVideoSize;
        }
        return this.unlockedVideoSize.rotate();
    }

    public int getDeviceRotation() {
        return this.deviceRotation;
    }

    public ScreenInfo withDeviceRotation(int i) {
        Rect rectFlipRect;
        Size sizeRotate;
        int i2 = this.deviceRotation;
        if (i == i2) {
            return this;
        }
        if ((i2 + i) % 2 != 0) {
            rectFlipRect = flipRect(this.contentRect);
            sizeRotate = this.unlockedVideoSize.rotate();
        } else {
            rectFlipRect = this.contentRect;
            sizeRotate = this.unlockedVideoSize;
        }
        return new ScreenInfo(rectFlipRect, sizeRotate, i, this.lockedVideoOrientation);
    }

    public static ScreenInfo computeScreenInfo(DisplayInfo displayInfo, VideoSettings videoSettings) {
        int lockedVideoOrientation = videoSettings.getLockedVideoOrientation();
        Rect crop = videoSettings.getCrop();
        int rotation = displayInfo.getRotation();
        if (lockedVideoOrientation == -2) {
            lockedVideoOrientation = rotation;
        }
        Size size = displayInfo.getSize();
        Rect rect = new Rect(0, 0, size.getWidth(), size.getHeight());
        if (crop != null) {
            if (rotation % 2 != 0) {
                crop = flipRect(crop);
            }
            if (!rect.intersect(crop)) {
                Ln.w("Crop rectangle (" + formatCrop(crop) + ") does not intersect device screen (" + formatCrop(size.toRect()) + ")");
                rect = new Rect();
            }
        }
        return new ScreenInfo(rect, computeVideoSize(rect.width(), rect.height(), videoSettings.getBounds()), rotation, lockedVideoOrientation);
    }

    private static String formatCrop(Rect rect) {
        return rect.width() + ":" + rect.height() + ":" + rect.left + ":" + rect.top;
    }

    private static Size computeVideoSize(int i, int i2, Size size) {
        if (size == null) {
            return new Size(i & (-16), i2 & (-16));
        }
        int width = size.getWidth();
        int height = size.getHeight();
        int i3 = width > i ? i2 : (width * i2) / i;
        if (height > i3) {
            height = i3;
        }
        if (height != i2) {
            i = (i * height) / i2;
        }
        if (width > i) {
            width = i;
        }
        return new Size(width & (-16), height & (-16));
    }

    private static Rect flipRect(Rect rect) {
        return new Rect(rect.top, rect.left, rect.bottom, rect.right);
    }

    public int getVideoRotation() {
        int i = this.lockedVideoOrientation;
        if (i == -1) {
            return 0;
        }
        return ((this.deviceRotation + 4) - i) % 4;
    }

    public int getReverseVideoRotation() {
        int i = this.lockedVideoOrientation;
        if (i == -1) {
            return 0;
        }
        return ((i + 4) - this.deviceRotation) % 4;
    }

    public byte[] toByteArray() {
        ByteBuffer byteBufferAllocate = ByteBuffer.allocate(25);
        byteBufferAllocate.putInt(this.contentRect.left);
        byteBufferAllocate.putInt(this.contentRect.top);
        byteBufferAllocate.putInt(this.contentRect.right);
        byteBufferAllocate.putInt(this.contentRect.bottom);
        byteBufferAllocate.putInt(this.unlockedVideoSize.getWidth());
        byteBufferAllocate.putInt(this.unlockedVideoSize.getHeight());
        byteBufferAllocate.put((byte) getVideoRotation());
        return byteBufferAllocate.array();
    }
}
