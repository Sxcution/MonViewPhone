package org.java_websocket.framing;

import com.genymobile.scrcpy.ControlMessage;
import java.nio.ByteBuffer;
import org.java_websocket.enums.Opcode;
import org.java_websocket.exceptions.InvalidDataException;
import org.java_websocket.util.ByteBufferUtils;

/* JADX INFO: loaded from: classes.dex */
public abstract class FramedataImpl1 implements Framedata {
    private Opcode optcode;
    private ByteBuffer unmaskedpayload = ByteBufferUtils.getEmptyByteBuffer();
    private boolean fin = true;
    private boolean transferemasked = false;
    private boolean rsv1 = false;
    private boolean rsv2 = false;
    private boolean rsv3 = false;

    public abstract void isValid() throws InvalidDataException;

    public FramedataImpl1(Opcode opcode) {
        this.optcode = opcode;
    }

    @Override // org.java_websocket.framing.Framedata
    public boolean isRSV1() {
        return this.rsv1;
    }

    @Override // org.java_websocket.framing.Framedata
    public boolean isRSV2() {
        return this.rsv2;
    }

    @Override // org.java_websocket.framing.Framedata
    public boolean isRSV3() {
        return this.rsv3;
    }

    @Override // org.java_websocket.framing.Framedata
    public boolean isFin() {
        return this.fin;
    }

    @Override // org.java_websocket.framing.Framedata
    public Opcode getOpcode() {
        return this.optcode;
    }

    @Override // org.java_websocket.framing.Framedata
    public boolean getTransfereMasked() {
        return this.transferemasked;
    }

    @Override // org.java_websocket.framing.Framedata
    public ByteBuffer getPayloadData() {
        return this.unmaskedpayload;
    }

    @Override // org.java_websocket.framing.Framedata
    public void append(Framedata framedata) {
        ByteBuffer payloadData = framedata.getPayloadData();
        if (this.unmaskedpayload == null) {
            this.unmaskedpayload = ByteBuffer.allocate(payloadData.remaining());
            payloadData.mark();
            this.unmaskedpayload.put(payloadData);
            payloadData.reset();
        } else {
            payloadData.mark();
            ByteBuffer byteBuffer = this.unmaskedpayload;
            byteBuffer.position(byteBuffer.limit());
            ByteBuffer byteBuffer2 = this.unmaskedpayload;
            byteBuffer2.limit(byteBuffer2.capacity());
            if (payloadData.remaining() > this.unmaskedpayload.remaining()) {
                ByteBuffer byteBufferAllocate = ByteBuffer.allocate(payloadData.remaining() + this.unmaskedpayload.capacity());
                this.unmaskedpayload.flip();
                byteBufferAllocate.put(this.unmaskedpayload);
                byteBufferAllocate.put(payloadData);
                this.unmaskedpayload = byteBufferAllocate;
            } else {
                this.unmaskedpayload.put(payloadData);
            }
            this.unmaskedpayload.rewind();
            payloadData.reset();
        }
        this.fin = framedata.isFin();
    }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Framedata{ optcode:");
        sb.append(getOpcode());
        sb.append(", fin:");
        sb.append(isFin());
        sb.append(", rsv1:");
        sb.append(isRSV1());
        sb.append(", rsv2:");
        sb.append(isRSV2());
        sb.append(", rsv3:");
        sb.append(isRSV3());
        sb.append(", payloadlength:[pos:");
        sb.append(this.unmaskedpayload.position());
        sb.append(", len:");
        sb.append(this.unmaskedpayload.remaining());
        sb.append("], payload:");
        sb.append(this.unmaskedpayload.remaining() > 1000 ? "(too big to display)" : new String(this.unmaskedpayload.array()));
        sb.append('}');
        return sb.toString();
    }

    public void setPayload(ByteBuffer byteBuffer) {
        this.unmaskedpayload = byteBuffer;
    }

    public void setFin(boolean z) {
        this.fin = z;
    }

    public void setRSV1(boolean z) {
        this.rsv1 = z;
    }

    public void setRSV2(boolean z) {
        this.rsv2 = z;
    }

    public void setRSV3(boolean z) {
        this.rsv3 = z;
    }

    public void setTransferemasked(boolean z) {
        this.transferemasked = z;
    }

    /* JADX INFO: renamed from: org.java_websocket.framing.FramedataImpl1$1, reason: invalid class name */
    static /* synthetic */ class AnonymousClass1 {
        static final /* synthetic */ int[] $SwitchMap$org$java_websocket$enums$Opcode;

        static {
            int[] iArr = new int[Opcode.values().length];
            $SwitchMap$org$java_websocket$enums$Opcode = iArr;
            try {
                iArr[Opcode.PING.ordinal()] = 1;
            } catch (NoSuchFieldError unused) {
            }
            try {
                $SwitchMap$org$java_websocket$enums$Opcode[Opcode.PONG.ordinal()] = 2;
            } catch (NoSuchFieldError unused2) {
            }
            try {
                $SwitchMap$org$java_websocket$enums$Opcode[Opcode.TEXT.ordinal()] = 3;
            } catch (NoSuchFieldError unused3) {
            }
            try {
                $SwitchMap$org$java_websocket$enums$Opcode[Opcode.BINARY.ordinal()] = 4;
            } catch (NoSuchFieldError unused4) {
            }
            try {
                $SwitchMap$org$java_websocket$enums$Opcode[Opcode.CLOSING.ordinal()] = 5;
            } catch (NoSuchFieldError unused5) {
            }
            try {
                $SwitchMap$org$java_websocket$enums$Opcode[Opcode.CONTINUOUS.ordinal()] = 6;
            } catch (NoSuchFieldError unused6) {
            }
        }
    }

    public static FramedataImpl1 get(Opcode opcode) {
        if (opcode == null) {
            throw new IllegalArgumentException("Supplied opcode cannot be null");
        }
        switch (AnonymousClass1.$SwitchMap$org$java_websocket$enums$Opcode[opcode.ordinal()]) {
            case 1:
                return new PingFrame();
            case 2:
                return new PongFrame();
            case 3:
                return new TextFrame();
            case 4:
                return new BinaryFrame();
            case ControlMessage.TYPE_EXPAND_NOTIFICATION_PANEL /* 5 */:
                return new CloseFrame();
            case ControlMessage.TYPE_EXPAND_SETTINGS_PANEL /* 6 */:
                return new ContinuousFrame();
            default:
                throw new IllegalArgumentException("Supplied opcode is invalid");
        }
    }

    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }
        FramedataImpl1 framedataImpl1 = (FramedataImpl1) obj;
        if (this.fin != framedataImpl1.fin || this.transferemasked != framedataImpl1.transferemasked || this.rsv1 != framedataImpl1.rsv1 || this.rsv2 != framedataImpl1.rsv2 || this.rsv3 != framedataImpl1.rsv3 || this.optcode != framedataImpl1.optcode) {
            return false;
        }
        ByteBuffer byteBuffer = this.unmaskedpayload;
        ByteBuffer byteBuffer2 = framedataImpl1.unmaskedpayload;
        return byteBuffer != null ? byteBuffer.equals(byteBuffer2) : byteBuffer2 == null;
    }

    public int hashCode() {
        int iHashCode = (((this.fin ? 1 : 0) * 31) + this.optcode.hashCode()) * 31;
        ByteBuffer byteBuffer = this.unmaskedpayload;
        return ((((((((iHashCode + (byteBuffer != null ? byteBuffer.hashCode() : 0)) * 31) + (this.transferemasked ? 1 : 0)) * 31) + (this.rsv1 ? 1 : 0)) * 31) + (this.rsv2 ? 1 : 0)) * 31) + (this.rsv3 ? 1 : 0);
    }
}
