package org.java_websocket;

import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.ByteChannel;
import java.nio.channels.SelectionKey;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.enums.CloseHandshakeType;
import org.java_websocket.enums.HandshakeState;
import org.java_websocket.enums.Opcode;
import org.java_websocket.enums.ReadyState;
import org.java_websocket.enums.Role;
import org.java_websocket.exceptions.IncompleteHandshakeException;
import org.java_websocket.exceptions.InvalidDataException;
import org.java_websocket.exceptions.InvalidHandshakeException;
import org.java_websocket.exceptions.LimitExceededException;
import org.java_websocket.exceptions.WebsocketNotConnectedException;
import org.java_websocket.framing.CloseFrame;
import org.java_websocket.framing.Framedata;
import org.java_websocket.framing.PingFrame;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.handshake.ClientHandshakeBuilder;
import org.java_websocket.handshake.Handshakedata;
import org.java_websocket.handshake.ServerHandshake;
import org.java_websocket.server.WebSocketServer;
import org.java_websocket.util.Charsetfunctions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/* JADX INFO: loaded from: classes.dex */
public class WebSocketImpl implements WebSocket {
    static final /* synthetic */ boolean $assertionsDisabled = false;
    public static final int DEFAULT_PORT = 80;
    public static final int DEFAULT_WSS_PORT = 443;
    public static final int RCVBUF = 16384;
    private static final Logger log = LoggerFactory.getLogger((Class<?>) WebSocketImpl.class);
    private Object attachment;
    private ByteChannel channel;
    private Integer closecode;
    private Boolean closedremotely;
    private String closemessage;
    private Draft draft;
    private boolean flushandclosestate;
    private ClientHandshake handshakerequest;
    public final BlockingQueue<ByteBuffer> inQueue;
    private SelectionKey key;
    private List<Draft> knownDrafts;
    private long lastPong;
    public final BlockingQueue<ByteBuffer> outQueue;
    private PingFrame pingFrame;
    private volatile ReadyState readyState;
    private String resourceDescriptor;
    private Role role;
    private final Object synchronizeWriteObject;
    private ByteBuffer tmpHandshakeBytes;
    private WebSocketServer.WebSocketWorker workerThread;
    private final WebSocketListener wsl;

    public WebSocketImpl(WebSocketListener webSocketListener, List<Draft> list) {
        this(webSocketListener, (Draft) null);
        this.role = Role.SERVER;
        if (list == null || list.isEmpty()) {
            ArrayList arrayList = new ArrayList();
            this.knownDrafts = arrayList;
            arrayList.add(new Draft_6455());
            return;
        }
        this.knownDrafts = list;
    }

    public WebSocketImpl(WebSocketListener webSocketListener, Draft draft) {
        this.flushandclosestate = false;
        this.readyState = ReadyState.NOT_YET_CONNECTED;
        this.draft = null;
        this.tmpHandshakeBytes = ByteBuffer.allocate(0);
        this.handshakerequest = null;
        this.closemessage = null;
        this.closecode = null;
        this.closedremotely = null;
        this.resourceDescriptor = null;
        this.lastPong = System.currentTimeMillis();
        this.synchronizeWriteObject = new Object();
        if (webSocketListener == null || (draft == null && this.role == Role.SERVER)) {
            throw new IllegalArgumentException("parameters must not be null");
        }
        this.outQueue = new LinkedBlockingQueue();
        this.inQueue = new LinkedBlockingQueue();
        this.wsl = webSocketListener;
        this.role = Role.CLIENT;
        if (draft != null) {
            this.draft = draft.copyInstance();
        }
    }

    public void decode(ByteBuffer byteBuffer) {
        log.trace("process({}): ({})", Integer.valueOf(byteBuffer.remaining()), byteBuffer.remaining() > 1000 ? "too big to display" : new String(byteBuffer.array(), byteBuffer.position(), byteBuffer.remaining()));
        if (this.readyState != ReadyState.NOT_YET_CONNECTED) {
            if (this.readyState == ReadyState.OPEN) {
                decodeFrames(byteBuffer);
            }
        } else {
            if (!decodeHandshake(byteBuffer) || isClosing() || isClosed()) {
                return;
            }
            if (byteBuffer.hasRemaining()) {
                decodeFrames(byteBuffer);
            } else if (this.tmpHandshakeBytes.hasRemaining()) {
                decodeFrames(this.tmpHandshakeBytes);
            }
        }
    }

    private boolean decodeHandshake(ByteBuffer byteBuffer) {
        ByteBuffer byteBuffer2;
        Handshakedata handshakedataTranslateHandshake = null;
        if (this.tmpHandshakeBytes.capacity() == 0) {
            byteBuffer2 = byteBuffer;
        } else {
            if (this.tmpHandshakeBytes.remaining() < byteBuffer.remaining()) {
                ByteBuffer byteBufferAllocate = ByteBuffer.allocate(this.tmpHandshakeBytes.capacity() + byteBuffer.remaining());
                this.tmpHandshakeBytes.flip();
                byteBufferAllocate.put(this.tmpHandshakeBytes);
                this.tmpHandshakeBytes = byteBufferAllocate;
            }
            this.tmpHandshakeBytes.put(byteBuffer);
            this.tmpHandshakeBytes.flip();
            byteBuffer2 = this.tmpHandshakeBytes;
        }
        byteBuffer2.mark();
        try {
            if (this.role == Role.SERVER) {
                if (this.draft == null) {
                    Iterator<Draft> it = this.knownDrafts.iterator();
                    while (it.hasNext()) {
                        Draft draftCopyInstance = it.next().copyInstance();
                        try {
                            draftCopyInstance.setParseMode(this.role);
                            byteBuffer2.reset();
                            handshakedataTranslateHandshake = draftCopyInstance.translateHandshake(byteBuffer2);
                        } catch (InvalidHandshakeException unused) {
                            continue;
                        }
                        if (!(handshakedataTranslateHandshake instanceof ClientHandshake)) {
                            log.trace("Closing due to wrong handshake");
                            closeConnectionDueToWrongHandshake(new InvalidDataException(CloseFrame.PROTOCOL_ERROR, "wrong http function"));
                            return false;
                        }
                        ClientHandshake clientHandshake = (ClientHandshake) handshakedataTranslateHandshake;
                        if (draftCopyInstance.acceptHandshakeAsServer(clientHandshake) == HandshakeState.MATCHED) {
                            this.resourceDescriptor = clientHandshake.getResourceDescriptor();
                            try {
                                write(draftCopyInstance.createHandshake(draftCopyInstance.postProcessHandshakeResponseAsServer(clientHandshake, this.wsl.onWebsocketHandshakeReceivedAsServer(this, draftCopyInstance, clientHandshake))));
                                this.draft = draftCopyInstance;
                                open(clientHandshake);
                                return true;
                            } catch (RuntimeException e3) {
                                log.error("Closing due to internal server error", (Throwable) e3);
                                this.wsl.onWebsocketError(this, e3);
                                closeConnectionDueToInternalServerError(e3);
                                return false;
                            } catch (InvalidDataException e4) {
                                log.trace("Closing due to wrong handshake. Possible handshake rejection", (Throwable) e4);
                                closeConnectionDueToWrongHandshake(e4);
                                return false;
                            }
                        }
                    }
                    if (this.draft == null) {
                        log.trace("Closing due to protocol error: no draft matches");
                        closeConnectionDueToWrongHandshake(new InvalidDataException(CloseFrame.PROTOCOL_ERROR, "no draft matches"));
                    }
                    return false;
                }
                Handshakedata handshakedataTranslateHandshake2 = this.draft.translateHandshake(byteBuffer2);
                if (!(handshakedataTranslateHandshake2 instanceof ClientHandshake)) {
                    log.trace("Closing due to protocol error: wrong http function");
                    flushAndClose(CloseFrame.PROTOCOL_ERROR, "wrong http function", false);
                    return false;
                }
                ClientHandshake clientHandshake2 = (ClientHandshake) handshakedataTranslateHandshake2;
                if (this.draft.acceptHandshakeAsServer(clientHandshake2) == HandshakeState.MATCHED) {
                    open(clientHandshake2);
                    return true;
                }
                log.trace("Closing due to protocol error: the handshake did finally not match");
                close(CloseFrame.PROTOCOL_ERROR, "the handshake did finally not match");
                return false;
            }
            if (this.role == Role.CLIENT) {
                this.draft.setParseMode(this.role);
                Handshakedata handshakedataTranslateHandshake3 = this.draft.translateHandshake(byteBuffer2);
                if (!(handshakedataTranslateHandshake3 instanceof ServerHandshake)) {
                    log.trace("Closing due to protocol error: wrong http function");
                    flushAndClose(CloseFrame.PROTOCOL_ERROR, "wrong http function", false);
                    return false;
                }
                ServerHandshake serverHandshake = (ServerHandshake) handshakedataTranslateHandshake3;
                if (this.draft.acceptHandshakeAsClient(this.handshakerequest, serverHandshake) == HandshakeState.MATCHED) {
                    try {
                        this.wsl.onWebsocketHandshakeReceivedAsClient(this, this.handshakerequest, serverHandshake);
                        open(serverHandshake);
                        return true;
                    } catch (RuntimeException e5) {
                        log.error("Closing since client was never connected", (Throwable) e5);
                        this.wsl.onWebsocketError(this, e5);
                        flushAndClose(-1, e5.getMessage(), false);
                        return false;
                    } catch (InvalidDataException e6) {
                        log.trace("Closing due to invalid data exception. Possible handshake rejection", (Throwable) e6);
                        flushAndClose(e6.getCloseCode(), e6.getMessage(), false);
                        return false;
                    }
                }
                log.trace("Closing due to protocol error: draft {} refuses handshake", this.draft);
                close(CloseFrame.PROTOCOL_ERROR, "draft " + this.draft + " refuses handshake");
            }
        } catch (InvalidHandshakeException e) {
            log.trace("Closing due to invalid handshake", (Throwable) e);
            close(e);
        } catch (IncompleteHandshakeException e2) {
            if (this.tmpHandshakeBytes.capacity() == 0) {
                byteBuffer2.reset();
                int preferredSize = e2.getPreferredSize();
                if (preferredSize == 0) {
                    preferredSize = byteBuffer2.capacity() + 16;
                }
                ByteBuffer byteBufferAllocate2 = ByteBuffer.allocate(preferredSize);
                this.tmpHandshakeBytes = byteBufferAllocate2;
                byteBufferAllocate2.put(byteBuffer);
            } else {
                ByteBuffer byteBuffer3 = this.tmpHandshakeBytes;
                byteBuffer3.position(byteBuffer3.limit());
                ByteBuffer byteBuffer4 = this.tmpHandshakeBytes;
                byteBuffer4.limit(byteBuffer4.capacity());
            }
        }
        return false;
    }

    private void decodeFrames(ByteBuffer byteBuffer) {
        try {
            for (Framedata framedata : this.draft.translateFrame(byteBuffer)) {
                log.trace("matched frame: {}", framedata);
                this.draft.processFrame(this, framedata);
            }
        } catch (LimitExceededException e) {
            if (e.getLimit() == Integer.MAX_VALUE) {
                log.error("Closing due to invalid size of frame", (Throwable) e);
                this.wsl.onWebsocketError(this, e);
            }
            close(e);
        } catch (InvalidDataException e2) {
            log.error("Closing due to invalid data in frame", (Throwable) e2);
            this.wsl.onWebsocketError(this, e2);
            close(e2);
        }
    }

    private void closeConnectionDueToWrongHandshake(InvalidDataException invalidDataException) {
        write(generateHttpResponseDueToError(404));
        flushAndClose(invalidDataException.getCloseCode(), invalidDataException.getMessage(), false);
    }

    private void closeConnectionDueToInternalServerError(RuntimeException runtimeException) {
        write(generateHttpResponseDueToError(500));
        flushAndClose(-1, runtimeException.getMessage(), false);
    }

    private ByteBuffer generateHttpResponseDueToError(int i) {
        String str = i != 404 ? "500 Internal Server Error" : "404 WebSocket Upgrade Failure";
        return ByteBuffer.wrap(Charsetfunctions.asciiBytes("HTTP/1.1 " + str + "\r\nContent-Type: text/html\nServer: TooTallNate Java-WebSocket\r\nContent-Length: " + (str.length() + 48) + "\r\n\r\n<html><head></head><body><h1>" + str + "</h1></body></html>"));
    }

    /* JADX WARN: Removed duplicated region for block: B:23:0x003f A[Catch: InvalidDataException -> 0x0051, all -> 0x0086, TRY_LEAVE, TryCatch #2 {InvalidDataException -> 0x0051, blocks: (B:17:0x002d, B:21:0x0039, B:23:0x003f, B:20:0x0034), top: B:44:0x002d, outer: #0 }] */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public synchronized void close(int r6, java.lang.String r7, boolean r8) {
        /*
            r5 = this;
            monitor-enter(r5)
            org.java_websocket.enums.ReadyState r0 = r5.readyState     // Catch: java.lang.Throwable -> L86
            org.java_websocket.enums.ReadyState r1 = org.java_websocket.enums.ReadyState.CLOSING     // Catch: java.lang.Throwable -> L86
            if (r0 == r1) goto L84
            org.java_websocket.enums.ReadyState r0 = r5.readyState     // Catch: java.lang.Throwable -> L86
            org.java_websocket.enums.ReadyState r1 = org.java_websocket.enums.ReadyState.CLOSED     // Catch: java.lang.Throwable -> L86
            if (r0 == r1) goto L84
            org.java_websocket.enums.ReadyState r0 = r5.readyState     // Catch: java.lang.Throwable -> L86
            org.java_websocket.enums.ReadyState r1 = org.java_websocket.enums.ReadyState.OPEN     // Catch: java.lang.Throwable -> L86
            r2 = 0
            if (r0 != r1) goto L67
            r0 = 1006(0x3ee, float:1.41E-42)
            if (r6 != r0) goto L21
            org.java_websocket.enums.ReadyState r8 = org.java_websocket.enums.ReadyState.CLOSING     // Catch: java.lang.Throwable -> L86
            r5.readyState = r8     // Catch: java.lang.Throwable -> L86
            r5.flushAndClose(r6, r7, r2)     // Catch: java.lang.Throwable -> L86
            monitor-exit(r5)
            return
        L21:
            org.java_websocket.drafts.Draft r1 = r5.draft     // Catch: java.lang.Throwable -> L86
            org.java_websocket.enums.CloseHandshakeType r1 = r1.getCloseHandshakeType()     // Catch: java.lang.Throwable -> L86
            org.java_websocket.enums.CloseHandshakeType r3 = org.java_websocket.enums.CloseHandshakeType.NONE     // Catch: java.lang.Throwable -> L86
            if (r1 == r3) goto L63
            if (r8 != 0) goto L39
            org.java_websocket.WebSocketListener r1 = r5.wsl     // Catch: java.lang.RuntimeException -> L33 org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
            r1.onWebsocketCloseInitiated(r5, r6, r7)     // Catch: java.lang.RuntimeException -> L33 org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
            goto L39
        L33:
            r1 = move-exception
            org.java_websocket.WebSocketListener r3 = r5.wsl     // Catch: org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
            r3.onWebsocketError(r5, r1)     // Catch: org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
        L39:
            boolean r1 = r5.isOpen()     // Catch: org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
            if (r1 == 0) goto L63
            org.java_websocket.framing.CloseFrame r1 = new org.java_websocket.framing.CloseFrame     // Catch: org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
            r1.<init>()     // Catch: org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
            r1.setReason(r7)     // Catch: org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
            r1.setCode(r6)     // Catch: org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
            r1.isValid()     // Catch: org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
            r5.sendFrame(r1)     // Catch: org.java_websocket.exceptions.InvalidDataException -> L51 java.lang.Throwable -> L86
            goto L63
        L51:
            r1 = move-exception
            org.slf4j.Logger r3 = org.java_websocket.WebSocketImpl.log     // Catch: java.lang.Throwable -> L86
            java.lang.String r4 = "generated frame is invalid"
            r3.error(r4, r1)     // Catch: java.lang.Throwable -> L86
            org.java_websocket.WebSocketListener r3 = r5.wsl     // Catch: java.lang.Throwable -> L86
            r3.onWebsocketError(r5, r1)     // Catch: java.lang.Throwable -> L86
            java.lang.String r1 = "generated frame is invalid"
            r5.flushAndClose(r0, r1, r2)     // Catch: java.lang.Throwable -> L86
        L63:
            r5.flushAndClose(r6, r7, r8)     // Catch: java.lang.Throwable -> L86
            goto L7b
        L67:
            r0 = -3
            if (r6 != r0) goto L6f
            r6 = 1
            r5.flushAndClose(r0, r7, r6)     // Catch: java.lang.Throwable -> L86
            goto L7b
        L6f:
            r0 = 1002(0x3ea, float:1.404E-42)
            if (r6 != r0) goto L77
            r5.flushAndClose(r6, r7, r8)     // Catch: java.lang.Throwable -> L86
            goto L7b
        L77:
            r6 = -1
            r5.flushAndClose(r6, r7, r2)     // Catch: java.lang.Throwable -> L86
        L7b:
            org.java_websocket.enums.ReadyState r6 = org.java_websocket.enums.ReadyState.CLOSING     // Catch: java.lang.Throwable -> L86
            r5.readyState = r6     // Catch: java.lang.Throwable -> L86
            r6 = 0
            r5.tmpHandshakeBytes = r6     // Catch: java.lang.Throwable -> L86
            monitor-exit(r5)
            return
        L84:
            monitor-exit(r5)
            return
        L86:
            r6 = move-exception
            monitor-exit(r5)
            throw r6
        */
        throw new UnsupportedOperationException("Method not decompiled: org.java_websocket.WebSocketImpl.close(int, java.lang.String, boolean):void");
    }

    @Override // org.java_websocket.WebSocket
    public void close(int i, String str) {
        close(i, str, false);
    }

    /* JADX WARN: Removed duplicated region for block: B:30:0x005b A[Catch: all -> 0x0069, TryCatch #2 {, blocks: (B:3:0x0001, B:7:0x0009, B:11:0x0013, B:12:0x0017, B:14:0x001b, B:15:0x0020, B:17:0x0024, B:24:0x004b, B:28:0x0057, B:30:0x005b, B:31:0x0060, B:27:0x0052, B:20:0x002b, B:22:0x0037, B:23:0x003f), top: B:41:0x0001, inners: #0, #1 }] */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public synchronized void closeConnection(int r4, java.lang.String r5, boolean r6) {
        /*
            r3 = this;
            monitor-enter(r3)
            org.java_websocket.enums.ReadyState r0 = r3.readyState     // Catch: java.lang.Throwable -> L69
            org.java_websocket.enums.ReadyState r1 = org.java_websocket.enums.ReadyState.CLOSED     // Catch: java.lang.Throwable -> L69
            if (r0 != r1) goto L9
            monitor-exit(r3)
            return
        L9:
            org.java_websocket.enums.ReadyState r0 = r3.readyState     // Catch: java.lang.Throwable -> L69
            org.java_websocket.enums.ReadyState r1 = org.java_websocket.enums.ReadyState.OPEN     // Catch: java.lang.Throwable -> L69
            if (r0 != r1) goto L17
            r0 = 1006(0x3ee, float:1.41E-42)
            if (r4 != r0) goto L17
            org.java_websocket.enums.ReadyState r0 = org.java_websocket.enums.ReadyState.CLOSING     // Catch: java.lang.Throwable -> L69
            r3.readyState = r0     // Catch: java.lang.Throwable -> L69
        L17:
            java.nio.channels.SelectionKey r0 = r3.key     // Catch: java.lang.Throwable -> L69
            if (r0 == 0) goto L20
            java.nio.channels.SelectionKey r0 = r3.key     // Catch: java.lang.Throwable -> L69
            r0.cancel()     // Catch: java.lang.Throwable -> L69
        L20:
            java.nio.channels.ByteChannel r0 = r3.channel     // Catch: java.lang.Throwable -> L69
            if (r0 == 0) goto L4b
            java.nio.channels.ByteChannel r0 = r3.channel     // Catch: java.io.IOException -> L2a java.lang.Throwable -> L69
            r0.close()     // Catch: java.io.IOException -> L2a java.lang.Throwable -> L69
            goto L4b
        L2a:
            r0 = move-exception
            java.lang.String r1 = r0.getMessage()     // Catch: java.lang.Throwable -> L69
            java.lang.String r2 = "Broken pipe"
            boolean r1 = r1.equals(r2)     // Catch: java.lang.Throwable -> L69
            if (r1 == 0) goto L3f
            org.slf4j.Logger r1 = org.java_websocket.WebSocketImpl.log     // Catch: java.lang.Throwable -> L69
            java.lang.String r2 = "Caught IOException: Broken pipe during closeConnection()"
            r1.trace(r2, r0)     // Catch: java.lang.Throwable -> L69
            goto L4b
        L3f:
            org.slf4j.Logger r1 = org.java_websocket.WebSocketImpl.log     // Catch: java.lang.Throwable -> L69
            java.lang.String r2 = "Exception during channel.close()"
            r1.error(r2, r0)     // Catch: java.lang.Throwable -> L69
            org.java_websocket.WebSocketListener r1 = r3.wsl     // Catch: java.lang.Throwable -> L69
            r1.onWebsocketError(r3, r0)     // Catch: java.lang.Throwable -> L69
        L4b:
            org.java_websocket.WebSocketListener r0 = r3.wsl     // Catch: java.lang.RuntimeException -> L51 java.lang.Throwable -> L69
            r0.onWebsocketClose(r3, r4, r5, r6)     // Catch: java.lang.RuntimeException -> L51 java.lang.Throwable -> L69
            goto L57
        L51:
            r4 = move-exception
            org.java_websocket.WebSocketListener r5 = r3.wsl     // Catch: java.lang.Throwable -> L69
            r5.onWebsocketError(r3, r4)     // Catch: java.lang.Throwable -> L69
        L57:
            org.java_websocket.drafts.Draft r4 = r3.draft     // Catch: java.lang.Throwable -> L69
            if (r4 == 0) goto L60
            org.java_websocket.drafts.Draft r4 = r3.draft     // Catch: java.lang.Throwable -> L69
            r4.reset()     // Catch: java.lang.Throwable -> L69
        L60:
            r4 = 0
            r3.handshakerequest = r4     // Catch: java.lang.Throwable -> L69
            org.java_websocket.enums.ReadyState r4 = org.java_websocket.enums.ReadyState.CLOSED     // Catch: java.lang.Throwable -> L69
            r3.readyState = r4     // Catch: java.lang.Throwable -> L69
            monitor-exit(r3)
            return
        L69:
            r4 = move-exception
            monitor-exit(r3)
            throw r4
        */
        throw new UnsupportedOperationException("Method not decompiled: org.java_websocket.WebSocketImpl.closeConnection(int, java.lang.String, boolean):void");
    }

    protected void closeConnection(int i, boolean z) {
        closeConnection(i, "", z);
    }

    public void closeConnection() {
        if (this.closedremotely == null) {
            throw new IllegalStateException("this method must be used in conjunction with flushAndClose");
        }
        closeConnection(this.closecode.intValue(), this.closemessage, this.closedremotely.booleanValue());
    }

    @Override // org.java_websocket.WebSocket
    public void closeConnection(int i, String str) {
        closeConnection(i, str, false);
    }

    public synchronized void flushAndClose(int i, String str, boolean z) {
        if (this.flushandclosestate) {
            return;
        }
        this.closecode = Integer.valueOf(i);
        this.closemessage = str;
        this.closedremotely = Boolean.valueOf(z);
        this.flushandclosestate = true;
        this.wsl.onWriteDemand(this);
        try {
            this.wsl.onWebsocketClosing(this, i, str, z);
        } catch (RuntimeException e) {
            log.error("Exception in onWebsocketClosing", (Throwable) e);
            this.wsl.onWebsocketError(this, e);
        }
        if (this.draft != null) {
            this.draft.reset();
        }
        this.handshakerequest = null;
    }

    public void eot() {
        if (this.readyState == ReadyState.NOT_YET_CONNECTED) {
            closeConnection(-1, true);
            return;
        }
        if (this.flushandclosestate) {
            closeConnection(this.closecode.intValue(), this.closemessage, this.closedremotely.booleanValue());
            return;
        }
        if (this.draft.getCloseHandshakeType() == CloseHandshakeType.NONE) {
            closeConnection(CloseFrame.NORMAL, true);
            return;
        }
        if (this.draft.getCloseHandshakeType() == CloseHandshakeType.ONEWAY) {
            if (this.role == Role.SERVER) {
                closeConnection(CloseFrame.ABNORMAL_CLOSE, true);
                return;
            } else {
                closeConnection(CloseFrame.NORMAL, true);
                return;
            }
        }
        closeConnection(CloseFrame.ABNORMAL_CLOSE, true);
    }

    @Override // org.java_websocket.WebSocket
    public void close(int i) {
        close(i, "", false);
    }

    public void close(InvalidDataException invalidDataException) {
        close(invalidDataException.getCloseCode(), invalidDataException.getMessage(), false);
    }

    @Override // org.java_websocket.WebSocket
    public void send(String str) {
        if (str == null) {
            throw new IllegalArgumentException("Cannot send 'null' data to a WebSocketImpl.");
        }
        send(this.draft.createFrames(str, this.role == Role.CLIENT));
    }

    @Override // org.java_websocket.WebSocket
    public void send(ByteBuffer byteBuffer) {
        if (byteBuffer == null) {
            throw new IllegalArgumentException("Cannot send 'null' data to a WebSocketImpl.");
        }
        send(this.draft.createFrames(byteBuffer, this.role == Role.CLIENT));
    }

    @Override // org.java_websocket.WebSocket
    public void send(byte[] bArr) {
        send(ByteBuffer.wrap(bArr));
    }

    private void send(Collection<Framedata> collection) {
        if (!isOpen()) {
            throw new WebsocketNotConnectedException();
        }
        if (collection == null) {
            throw new IllegalArgumentException();
        }
        ArrayList arrayList = new ArrayList();
        for (Framedata framedata : collection) {
            log.trace("send frame: {}", framedata);
            arrayList.add(this.draft.createBinaryFrame(framedata));
        }
        write(arrayList);
    }

    @Override // org.java_websocket.WebSocket
    public void sendFragmentedFrame(Opcode opcode, ByteBuffer byteBuffer, boolean z) {
        send(this.draft.continuousFrame(opcode, byteBuffer, z));
    }

    @Override // org.java_websocket.WebSocket
    public void sendFrame(Collection<Framedata> collection) {
        send(collection);
    }

    @Override // org.java_websocket.WebSocket
    public void sendFrame(Framedata framedata) {
        send(Collections.singletonList(framedata));
    }

    @Override // org.java_websocket.WebSocket
    public void sendPing() {
        if (this.pingFrame == null) {
            this.pingFrame = new PingFrame();
        }
        sendFrame(this.pingFrame);
    }

    @Override // org.java_websocket.WebSocket
    public boolean hasBufferedData() {
        return !this.outQueue.isEmpty();
    }

    public void startHandshake(ClientHandshakeBuilder clientHandshakeBuilder) throws InvalidHandshakeException {
        this.handshakerequest = this.draft.postProcessHandshakeRequestAsClient(clientHandshakeBuilder);
        this.resourceDescriptor = clientHandshakeBuilder.getResourceDescriptor();
        try {
            this.wsl.onWebsocketHandshakeSentAsClient(this, this.handshakerequest);
            write(this.draft.createHandshake(this.handshakerequest));
        } catch (RuntimeException e) {
            log.error("Exception in startHandshake", (Throwable) e);
            this.wsl.onWebsocketError(this, e);
            throw new InvalidHandshakeException("rejected because of " + e);
        } catch (InvalidDataException unused) {
            throw new InvalidHandshakeException("Handshake data rejected by client.");
        }
    }

    private void write(ByteBuffer byteBuffer) {
        log.trace("write({}): {}", Integer.valueOf(byteBuffer.remaining()), byteBuffer.remaining() > 1000 ? "too big to display" : new String(byteBuffer.array()));
        this.outQueue.add(byteBuffer);
        this.wsl.onWriteDemand(this);
    }

    private void write(List<ByteBuffer> list) {
        synchronized (this.synchronizeWriteObject) {
            Iterator<ByteBuffer> it = list.iterator();
            while (it.hasNext()) {
                write(it.next());
            }
        }
    }

    private void open(Handshakedata handshakedata) {
        log.trace("open using draft: {}", this.draft);
        this.readyState = ReadyState.OPEN;
        try {
            this.wsl.onWebsocketOpen(this, handshakedata);
        } catch (RuntimeException e) {
            this.wsl.onWebsocketError(this, e);
        }
    }

    @Override // org.java_websocket.WebSocket
    public boolean isOpen() {
        return this.readyState == ReadyState.OPEN;
    }

    @Override // org.java_websocket.WebSocket
    public boolean isClosing() {
        return this.readyState == ReadyState.CLOSING;
    }

    @Override // org.java_websocket.WebSocket
    public boolean isFlushAndClose() {
        return this.flushandclosestate;
    }

    @Override // org.java_websocket.WebSocket
    public boolean isClosed() {
        return this.readyState == ReadyState.CLOSED;
    }

    @Override // org.java_websocket.WebSocket
    public ReadyState getReadyState() {
        return this.readyState;
    }

    public void setSelectionKey(SelectionKey selectionKey) {
        this.key = selectionKey;
    }

    public SelectionKey getSelectionKey() {
        return this.key;
    }

    public String toString() {
        return super.toString();
    }

    @Override // org.java_websocket.WebSocket
    public InetSocketAddress getRemoteSocketAddress() {
        return this.wsl.getRemoteSocketAddress(this);
    }

    @Override // org.java_websocket.WebSocket
    public InetSocketAddress getLocalSocketAddress() {
        return this.wsl.getLocalSocketAddress(this);
    }

    @Override // org.java_websocket.WebSocket
    public Draft getDraft() {
        return this.draft;
    }

    @Override // org.java_websocket.WebSocket
    public void close() {
        close(CloseFrame.NORMAL);
    }

    @Override // org.java_websocket.WebSocket
    public String getResourceDescriptor() {
        return this.resourceDescriptor;
    }

    long getLastPong() {
        return this.lastPong;
    }

    public void updateLastPong() {
        this.lastPong = System.currentTimeMillis();
    }

    public WebSocketListener getWebSocketListener() {
        return this.wsl;
    }

    @Override // org.java_websocket.WebSocket
    public <T> T getAttachment() {
        return (T) this.attachment;
    }

    @Override // org.java_websocket.WebSocket
    public <T> void setAttachment(T t) {
        this.attachment = t;
    }

    public ByteChannel getChannel() {
        return this.channel;
    }

    public void setChannel(ByteChannel byteChannel) {
        this.channel = byteChannel;
    }

    public WebSocketServer.WebSocketWorker getWorkerThread() {
        return this.workerThread;
    }

    public void setWorkerThread(WebSocketServer.WebSocketWorker webSocketWorker) {
        this.workerThread = webSocketWorker;
    }
}
