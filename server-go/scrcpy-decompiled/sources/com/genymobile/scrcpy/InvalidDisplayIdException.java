package com.genymobile.scrcpy;

/* JADX INFO: loaded from: classes.dex */
public class InvalidDisplayIdException extends RuntimeException {
    private final int[] availableDisplayIds;
    private final int displayId;

    public InvalidDisplayIdException(int i, int[] iArr) {
        super("There is no display having id " + i);
        this.displayId = i;
        this.availableDisplayIds = iArr;
    }

    public int getDisplayId() {
        return this.displayId;
    }

    public int[] getAvailableDisplayIds() {
        return this.availableDisplayIds;
    }
}
