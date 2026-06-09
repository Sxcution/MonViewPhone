package org.java_websocket;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.Timer;
import java.util.TimerTask;
import org.java_websocket.framing.CloseFrame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/* JADX INFO: loaded from: classes.dex */
public abstract class AbstractWebSocket extends WebSocketAdapter {
    private static final Logger log = LoggerFactory.getLogger((Class<?>) AbstractWebSocket.class);
    private Timer connectionLostTimer;
    private TimerTask connectionLostTimerTask;
    private boolean reuseAddr;
    private boolean tcpNoDelay;
    private int connectionLostTimeout = 60;
    private boolean websocketRunning = false;
    private final Object syncConnectionLost = new Object();

    protected abstract Collection<WebSocket> getConnections();

    public int getConnectionLostTimeout() {
        int i;
        synchronized (this.syncConnectionLost) {
            i = this.connectionLostTimeout;
        }
        return i;
    }

    public void setConnectionLostTimeout(int i) {
        synchronized (this.syncConnectionLost) {
            this.connectionLostTimeout = i;
            if (i <= 0) {
                log.trace("Connection lost timer stopped");
                cancelConnectionLostTimer();
                return;
            }
            if (this.websocketRunning) {
                log.trace("Connection lost timer restarted");
                try {
                    for (WebSocket webSocket : new ArrayList<WebSocket>(getConnections())) {
                        if (webSocket instanceof WebSocketImpl) {
                            ((WebSocketImpl) webSocket).updateLastPong();
                        }
                    }
                } catch (Exception e) {
                    log.error("Exception during connection lost restart", (Throwable) e);
                }
                restartConnectionLostTimer();
            }
        }
    }

    protected void stopConnectionLostTimer() {
        synchronized (this.syncConnectionLost) {
            if (this.connectionLostTimer != null || this.connectionLostTimerTask != null) {
                this.websocketRunning = false;
                log.trace("Connection lost timer stopped");
                cancelConnectionLostTimer();
            }
        }
    }

    protected void startConnectionLostTimer() {
        synchronized (this.syncConnectionLost) {
            if (this.connectionLostTimeout <= 0) {
                log.trace("Connection lost timer deactivated");
                return;
            }
            log.trace("Connection lost timer started");
            this.websocketRunning = true;
            restartConnectionLostTimer();
        }
    }

    private void restartConnectionLostTimer() {
        cancelConnectionLostTimer();
        this.connectionLostTimer = new Timer("WebSocketTimer");
        TimerTask timerTask = new TimerTask() { // from class: org.java_websocket.AbstractWebSocket.1
            private ArrayList<WebSocket> connections = new ArrayList<>();

            @Override // java.util.TimerTask, java.lang.Runnable
            public void run() {
                this.connections.clear();
                try {
                    this.connections.addAll(AbstractWebSocket.this.getConnections());
                    long jCurrentTimeMillis = System.currentTimeMillis() - ((long) (AbstractWebSocket.this.connectionLostTimeout * 1500));
                    Iterator<WebSocket> it = this.connections.iterator();
                    while (it.hasNext()) {
                        AbstractWebSocket.this.executeConnectionLostDetection(it.next(), jCurrentTimeMillis);
                    }
                } catch (Exception unused) {
                }
                this.connections.clear();
            }
        };
        this.connectionLostTimerTask = timerTask;
        Timer timer = this.connectionLostTimer;
        int i = this.connectionLostTimeout;
        timer.scheduleAtFixedRate(timerTask, ((long) i) * 1000, 1000 * ((long) i));
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void executeConnectionLostDetection(WebSocket webSocket, long j) {
        if (webSocket instanceof WebSocketImpl) {
            WebSocketImpl webSocketImpl = (WebSocketImpl) webSocket;
            if (webSocketImpl.getLastPong() < j) {
                log.trace("Closing connection due to no pong received: {}", webSocketImpl);
                webSocketImpl.closeConnection(CloseFrame.ABNORMAL_CLOSE, "The connection was closed because the other endpoint did not respond with a pong in time. For more information check: https://github.com/TooTallNate/Java-WebSocket/wiki/Lost-connection-detection");
            } else if (webSocketImpl.isOpen()) {
                webSocketImpl.sendPing();
            } else {
                log.trace("Trying to ping a non open connection: {}", webSocketImpl);
            }
        }
    }

    private void cancelConnectionLostTimer() {
        Timer timer = this.connectionLostTimer;
        if (timer != null) {
            timer.cancel();
            this.connectionLostTimer = null;
        }
        TimerTask timerTask = this.connectionLostTimerTask;
        if (timerTask != null) {
            timerTask.cancel();
            this.connectionLostTimerTask = null;
        }
    }

    public boolean isTcpNoDelay() {
        return this.tcpNoDelay;
    }

    public void setTcpNoDelay(boolean z) {
        this.tcpNoDelay = z;
    }

    public boolean isReuseAddr() {
        return this.reuseAddr;
    }

    public void setReuseAddr(boolean z) {
        this.reuseAddr = z;
    }
}
