package org.java_websocket.server;

import java.io.IOException;
import java.nio.channels.ByteChannel;
import java.nio.channels.SelectionKey;
import java.nio.channels.SocketChannel;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.SSLParameters;
import org.java_websocket.SSLSocketChannel2;

/* JADX INFO: loaded from: classes.dex */
public class SSLParametersWebSocketServerFactory extends DefaultSSLWebSocketServerFactory {
    private final SSLParameters sslParameters;

    public SSLParametersWebSocketServerFactory(SSLContext sSLContext, SSLParameters sSLParameters) {
        this(sSLContext, Executors.newSingleThreadScheduledExecutor(), sSLParameters);
    }

    public SSLParametersWebSocketServerFactory(SSLContext sSLContext, ExecutorService executorService, SSLParameters sSLParameters) {
        super(sSLContext, executorService);
        if (sSLParameters == null) {
            throw new IllegalArgumentException();
        }
        this.sslParameters = sSLParameters;
    }

    @Override // org.java_websocket.server.DefaultSSLWebSocketServerFactory, org.java_websocket.WebSocketServerFactory
    public ByteChannel wrapChannel(SocketChannel socketChannel, SelectionKey selectionKey) throws IOException {
        SSLEngine sSLEngineCreateSSLEngine = this.sslcontext.createSSLEngine();
        sSLEngineCreateSSLEngine.setUseClientMode(false);
        sSLEngineCreateSSLEngine.setSSLParameters(this.sslParameters);
        return new SSLSocketChannel2(socketChannel, sSLEngineCreateSSLEngine, this.exec, selectionKey);
    }
}
