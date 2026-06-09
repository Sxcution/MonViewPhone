package org.java_websocket.exceptions;

import java.io.UnsupportedEncodingException;

/* JADX INFO: loaded from: classes.dex */
public class InvalidEncodingException extends RuntimeException {
    private final UnsupportedEncodingException encodingException;

    public InvalidEncodingException(UnsupportedEncodingException unsupportedEncodingException) {
        if (unsupportedEncodingException == null) {
            throw new IllegalArgumentException();
        }
        this.encodingException = unsupportedEncodingException;
    }

    public UnsupportedEncodingException getEncodingException() {
        return this.encodingException;
    }
}
