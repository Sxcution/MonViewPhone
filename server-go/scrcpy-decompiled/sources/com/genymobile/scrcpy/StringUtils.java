package com.genymobile.scrcpy;

/* JADX INFO: loaded from: classes.dex */
public final class StringUtils {
    private StringUtils() {
    }

    public static int getUtf8TruncationIndex(byte[] bArr, int i) {
        int length = bArr.length;
        if (length <= i) {
            return length;
        }
        while ((bArr[i] & 128) != 0 && (bArr[i] & 192) != 192) {
            i--;
        }
        return i;
    }
}
