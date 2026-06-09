package org.java_websocket;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.ByteChannel;
import org.java_websocket.enums.Role;

/* JADX INFO: loaded from: classes.dex */
public class SocketChannelIOHelper {
    private SocketChannelIOHelper() {
        throw new IllegalStateException("Utility class");
    }

    public static boolean read(ByteBuffer byteBuffer, WebSocketImpl webSocketImpl, ByteChannel byteChannel) throws IOException {
        byteBuffer.clear();
        int i = byteChannel.read(byteBuffer);
        byteBuffer.flip();
        if (i != -1) {
            return i != 0;
        }
        webSocketImpl.eot();
        return false;
    }

    public static boolean readMore(ByteBuffer byteBuffer, WebSocketImpl webSocketImpl, WrappedByteChannel wrappedByteChannel) throws IOException {
        byteBuffer.clear();
        int more = wrappedByteChannel.readMore(byteBuffer);
        byteBuffer.flip();
        if (more == -1) {
            webSocketImpl.eot();
            return false;
        }
        return wrappedByteChannel.isNeedRead();
    }

    public static boolean batch(WebSocketImpl webSocketImpl, ByteChannel byteChannel) throws IOException {
        if (webSocketImpl == null) {
            return false;
        }
        ByteBuffer byteBufferPeek = webSocketImpl.outQueue.peek();
        WrappedByteChannel wrappedByteChannel = null;
        if (byteBufferPeek != null) {
            do {
                byteChannel.write(byteBufferPeek);
                if (byteBufferPeek.remaining() > 0) {
                    return false;
                }
                webSocketImpl.outQueue.poll();
                byteBufferPeek = webSocketImpl.outQueue.peek();
            } while (byteBufferPeek != null);
        } else if (byteChannel instanceof WrappedByteChannel) {
            wrappedByteChannel = (WrappedByteChannel) byteChannel;
            if (wrappedByteChannel.isNeedWrite()) {
                wrappedByteChannel.writeMore();
            }
        }
        if (webSocketImpl.outQueue.isEmpty() && webSocketImpl.isFlushAndClose() && webSocketImpl.getDraft() != null && webSocketImpl.getDraft().getRole() != null && webSocketImpl.getDraft().getRole() == Role.SERVER) {
            webSocketImpl.closeConnection();
        }
        return wrappedByteChannel == null || !((WrappedByteChannel) byteChannel).isNeedWrite();
    }
}
