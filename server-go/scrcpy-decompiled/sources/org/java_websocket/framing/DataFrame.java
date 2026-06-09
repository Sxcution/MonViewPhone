package org.java_websocket.framing;

import org.java_websocket.enums.Opcode;
import org.java_websocket.exceptions.InvalidDataException;

/* JADX INFO: loaded from: classes.dex */
public abstract class DataFrame extends FramedataImpl1 {
    @Override // org.java_websocket.framing.FramedataImpl1
    public void isValid() throws InvalidDataException {
    }

    public DataFrame(Opcode opcode) {
        super(opcode);
    }
}
