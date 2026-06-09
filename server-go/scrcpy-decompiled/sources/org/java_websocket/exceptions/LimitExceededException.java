package org.java_websocket.exceptions;

import org.java_websocket.framing.CloseFrame;

/* JADX INFO: loaded from: classes.dex */
public class LimitExceededException extends InvalidDataException {
    private static final long serialVersionUID = 6908339749836826785L;
    private final int limit;

    public LimitExceededException() {
        this(Integer.MAX_VALUE);
    }

    public LimitExceededException(int i) {
        super(CloseFrame.TOOBIG);
        this.limit = i;
    }

    public LimitExceededException(String str, int i) {
        super(CloseFrame.TOOBIG, str);
        this.limit = i;
    }

    public LimitExceededException(String str) {
        this(str, Integer.MAX_VALUE);
    }

    public int getLimit() {
        return this.limit;
    }
}
