package com.genymobile.scrcpy;

import android.os.Process;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.BindException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import org.java_websocket.WebSocket;
import org.java_websocket.framing.CloseFrame;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

/* JADX INFO: loaded from: classes.dex */
public class WSServer extends WebSocketServer {
    private static final String PID_FILE_PATH = "/data/local/tmp/ws_scrcpy.pid";
    private static final HashMap<Integer, WebSocketConnection> STREAM_BY_DISPLAY_ID = new HashMap<>();
    private final Options options;
    protected final ControlMessageReader reader;

    public static final class SocketInfo {
        private static final HashSet<Short> INSTANCES_BY_ID = new HashSet<>();
        private WebSocketConnection connection;
        private final short id;

        SocketInfo(short s) {
            this.id = s;
            INSTANCES_BY_ID.add(Short.valueOf(s));
        }

        public static short getNextClientId() {
            short s = 0;
            do {
                s = (short) (s + 1);
                if (!INSTANCES_BY_ID.contains(Short.valueOf(s))) {
                    return s;
                }
            } while (s != Short.MAX_VALUE);
            return (short) -1;
        }

        public short getId() {
            return this.id;
        }

        public WebSocketConnection getConnection() {
            return this.connection;
        }

        public void setConnection(WebSocketConnection webSocketConnection) {
            this.connection = webSocketConnection;
        }

        public void release() {
            INSTANCES_BY_ID.remove(Short.valueOf(this.id));
        }
    }

    public WSServer(Options options) {
        super(new InetSocketAddress(options.getListenOnAllInterfaces() ? "0.0.0.0" : "127.0.0.1", options.getPortNumber()));
        this.reader = new ControlMessageReader();
        this.options = options;
        unlinkPidFile();
    }

    @Override // org.java_websocket.server.WebSocketServer
    public void onOpen(WebSocket webSocket, ClientHandshake clientHandshake) {
        if (webSocket.isOpen()) {
            short nextClientId = SocketInfo.getNextClientId();
            if (nextClientId == -1) {
                webSocket.close(CloseFrame.TRY_AGAIN_LATER);
                return;
            }
            webSocket.setAttachment(new SocketInfo(nextClientId));
            WebSocketConnection.sendInitialInfo(WebSocketConnection.getInitialInfo(), webSocket, nextClientId);
            Ln.d("Client entered the room!");
        }
    }

    @Override // org.java_websocket.server.WebSocketServer
    public void onClose(WebSocket webSocket, int i, String str, boolean z) {
        Ln.d("Client has left the room!");
        FilePushHandler.cancelAllForConnection(webSocket);
        SocketInfo socketInfo = (SocketInfo) webSocket.getAttachment();
        if (socketInfo != null) {
            WebSocketConnection connection = socketInfo.getConnection();
            if (connection != null) {
                connection.leave(webSocket);
            }
            socketInfo.release();
        }
    }

    @Override // org.java_websocket.server.WebSocketServer
    public void onMessage(WebSocket webSocket, String str) {
        Ln.w("?  Client from " + webSocket.getRemoteSocketAddress().getAddress().getHostAddress() + " says: \"" + str + "\"");
    }

    @Override // org.java_websocket.server.WebSocketServer
    public void onMessage(WebSocket webSocket, ByteBuffer byteBuffer) {
        SocketInfo socketInfo = (SocketInfo) webSocket.getAttachment();
        if (socketInfo == null) {
            Ln.e("No info attached to connection");
            return;
        }
        WebSocketConnection connection = socketInfo.getConnection();
        String hostAddress = webSocket.getRemoteSocketAddress().getAddress().getHostAddress();
        ControlMessage event = this.reader.parseEvent(byteBuffer);
        if (event != null) {
            if (event.getType() == 102) {
                FilePushHandler.handlePush(webSocket, event);
                return;
            }
            if (event.getType() != 101) {
                if (connection != null) {
                    connection.getController().handleEvent(event);
                    return;
                }
                return;
            } else {
                VideoSettings videoSettings = event.getVideoSettings();
                int displayId = videoSettings.getDisplayId();
                if (connection != null && connection.getVideoSettings().getDisplayId() != displayId) {
                    connection.leave(webSocket);
                }
                joinStreamForDisplayId(webSocket, videoSettings, this.options, displayId, this);
                return;
            }
        }
        Ln.w("?  Client from " + hostAddress + " sends bytes: " + byteBuffer);
    }

    @Override // org.java_websocket.server.WebSocketServer
    public void onError(WebSocket webSocket, Exception exc) {
        Ln.e("WebSocket error", exc);
        if (webSocket != null) {
            FilePushHandler.cancelAllForConnection(webSocket);
        }
        if (exc instanceof BindException) {
            System.exit(1);
        }
    }

    @Override // org.java_websocket.server.WebSocketServer
    public void onStart() {
        Ln.d("Server started! " + getAddress().toString());
        setConnectionLostTimeout(0);
        setConnectionLostTimeout(100);
        writePidFile();
    }

    private static void joinStreamForDisplayId(WebSocket webSocket, VideoSettings videoSettings, Options options, int i, WSServer wSServer) {
        SocketInfo socketInfo = (SocketInfo) webSocket.getAttachment();
        WebSocketConnection webSocketConnection = STREAM_BY_DISPLAY_ID.get(Integer.valueOf(i));
        if (webSocketConnection == null) {
            webSocketConnection = new WebSocketConnection(options, videoSettings, wSServer);
            STREAM_BY_DISPLAY_ID.put(Integer.valueOf(i), webSocketConnection);
        }
        socketInfo.setConnection(webSocketConnection);
        webSocketConnection.join(webSocket, videoSettings);
    }

    private static void unlinkPidFile() {
        try {
            File file = new File(PID_FILE_PATH);
            if (!file.exists() || file.delete()) {
                return;
            }
            Ln.e("Failed to delete PID file");
        } catch (Exception e) {
            Ln.e("Failed to delete PID file:", e);
        }
    }

    private static void writePidFile() {
        try {
            FileOutputStream fileOutputStream = new FileOutputStream(new File(PID_FILE_PATH), false);
            fileOutputStream.write(Integer.toString(Process.myPid()).getBytes(StandardCharsets.UTF_8));
            fileOutputStream.close();
        } catch (IOException e) {
            Ln.e(e.getMessage());
        }
    }

    public static WebSocketConnection getConnectionForDisplay(int i) {
        return STREAM_BY_DISPLAY_ID.get(Integer.valueOf(i));
    }

    public static void releaseConnectionForDisplay(int i) {
        STREAM_BY_DISPLAY_ID.remove(Integer.valueOf(i));
    }

    public void sendInitialInfoToAll() {
        Collection<WebSocket> connections = getConnections();
        if (connections.isEmpty()) {
            return;
        }
        ByteBuffer initialInfo = WebSocketConnection.getInitialInfo();
        for (WebSocket webSocket : connections) {
            SocketInfo socketInfo = (SocketInfo) webSocket.getAttachment();
            if (socketInfo != null) {
                WebSocketConnection.sendInitialInfo(initialInfo, webSocket, socketInfo.getId());
            }
        }
    }
}
