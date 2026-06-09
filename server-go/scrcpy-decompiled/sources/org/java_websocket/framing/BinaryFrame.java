package org.java_websocket.framing;

import org.java_websocket.enums.Opcode;

/* JADX INFO: loaded from: classes.dex */
public class BinaryFrame extends DataFrame {
    public BinaryFrame() {
        super(Opcode.BINARY);
    }
}
