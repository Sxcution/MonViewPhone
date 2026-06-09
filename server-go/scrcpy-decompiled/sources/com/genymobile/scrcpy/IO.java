package com.genymobile.scrcpy;

import android.system.ErrnoException;
import android.system.Os;
import android.system.OsConstants;
import java.io.FileDescriptor;
import java.io.IOException;
import java.nio.ByteBuffer;

/* JADX INFO: loaded from: classes.dex */
public final class IO {
    private IO() {
    }

    public static void writeFully(FileDescriptor fileDescriptor, ByteBuffer byteBuffer) throws IOException {
        int iRemaining = byteBuffer.remaining();
        while (iRemaining > 0) {
            try {
                iRemaining -= Os.write(fileDescriptor, byteBuffer);
            } catch (ErrnoException e) {
                if (e.errno != OsConstants.EINTR) {
                    throw new IOException(e);
                }
            }
        }
    }

    public static void writeFully(FileDescriptor fileDescriptor, byte[] bArr, int i, int i2) throws IOException {
        writeFully(fileDescriptor, ByteBuffer.wrap(bArr, i, i2));
    }
}
