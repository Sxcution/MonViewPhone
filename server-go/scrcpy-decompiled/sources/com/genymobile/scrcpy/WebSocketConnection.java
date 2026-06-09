package com.genymobile.scrcpy;

import android.media.MediaCodecInfo;
import com.genymobile.scrcpy.WSServer;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import org.java_websocket.WebSocket;

/* JADX INFO: loaded from: classes.dex */
public class WebSocketConnection extends Connection {
    private ScreenEncoder screenEncoder;
    private final HashSet<WebSocket> sockets;
    private final WSServer wsServer;
    private static final byte[] MAGIC_BYTES_INITIAL = "scrcpy_initial".getBytes(StandardCharsets.UTF_8);
    private static final byte[] MAGIC_BYTES_MESSAGE = "scrcpy_message".getBytes(StandardCharsets.UTF_8);
    private static final byte[] DEVICE_NAME_BYTES = Device.getDeviceName().getBytes(StandardCharsets.UTF_8);

    @Override // com.genymobile.scrcpy.Connection
    public void close() throws Exception {
    }

    public WebSocketConnection(Options options, VideoSettings videoSettings, WSServer wSServer) {
        super(options, videoSettings);
        this.sockets = new HashSet<>();
        this.wsServer = wSServer;
    }

    public void join(WebSocket webSocket, VideoSettings videoSettings) {
        this.sockets.add(webSocket);
        boolean videoSettings2 = setVideoSettings(videoSettings);
        this.wsServer.sendInitialInfoToAll();
        if (!Device.isScreenOn()) {
            this.controller.turnScreenOn();
        }
        ScreenEncoder screenEncoder = this.screenEncoder;
        if (screenEncoder == null || !screenEncoder.isAlive()) {
            Ln.d("First connection. Start new encoder.");
            this.device.setRotationListener(this);
            ScreenEncoder screenEncoder2 = new ScreenEncoder(videoSettings);
            this.screenEncoder = screenEncoder2;
            screenEncoder2.start(this.device, this);
            return;
        }
        if (videoSettings2 || this.streamInvalidateListener == null) {
            return;
        }
        this.streamInvalidateListener.onStreamInvalidate();
    }

    public void leave(WebSocket webSocket) {
        this.sockets.remove(webSocket);
        if (this.sockets.isEmpty()) {
            Ln.d("Last client has left");
            release();
        }
        this.wsServer.sendInitialInfoToAll();
    }

    public static ByteBuffer deviceMessageToByteBuffer(DeviceMessage deviceMessage) {
        ByteBuffer byteBufferWrap = ByteBuffer.wrap(deviceMessage.writeToByteArray(MAGIC_BYTES_MESSAGE.length));
        byteBufferWrap.put(MAGIC_BYTES_MESSAGE);
        byteBufferWrap.rewind();
        return byteBufferWrap;
    }

    @Override // com.genymobile.scrcpy.Connection
    void send(ByteBuffer byteBuffer) {
        if (this.sockets.isEmpty()) {
            return;
        }
        synchronized (this.sockets) {
            for (WebSocket webSocket : this.sockets) {
                WSServer.SocketInfo socketInfo = (WSServer.SocketInfo) webSocket.getAttachment();
                if (webSocket.isOpen() && socketInfo != null) {
                    webSocket.send(byteBuffer);
                }
            }
        }
    }

    public static void sendInitialInfo(ByteBuffer byteBuffer, WebSocket webSocket, int i) {
        byteBuffer.position(byteBuffer.capacity() - 4);
        byteBuffer.putInt(i);
        byteBuffer.rewind();
        webSocket.send(byteBuffer);
    }

    @Override // com.genymobile.scrcpy.Connection
    public void sendDeviceMessage(DeviceMessage deviceMessage) {
        send(deviceMessageToByteBuffer(deviceMessage));
    }

    @Override // com.genymobile.scrcpy.Connection
    public boolean hasConnections() {
        return this.sockets.size() > 0;
    }

    public VideoSettings getVideoSettings() {
        return this.videoSettings;
    }

    public Controller getController() {
        return this.controller;
    }

    public Device getDevice() {
        return this.device;
    }

    public static ByteBuffer getInitialInfo() {
        int length = MAGIC_BYTES_INITIAL.length + 64 + 4 + 4;
        int[] displayIds = Device.getDisplayIds();
        HashMap map = new HashMap();
        HashMap map2 = new HashMap();
        HashMap map3 = new HashMap();
        HashMap map4 = new HashMap();
        HashMap map5 = new HashMap();
        int length2 = 0;
        for (int i : displayIds) {
            DisplayInfo displayInfo = Device.getDisplayInfo(i);
            map.put(Integer.valueOf(i), displayInfo);
            byte[] byteArray = displayInfo.toByteArray();
            int length3 = length2 + byteArray.length;
            map3.put(Integer.valueOf(i), byteArray);
            WebSocketConnection connectionForDisplay = WSServer.getConnectionForDisplay(i);
            length2 = length3 + 4 + 4 + 4;
            if (connectionForDisplay != null) {
                map2.put(Integer.valueOf(i), Integer.valueOf(connectionForDisplay.sockets.size()));
                byte[] byteArray2 = connectionForDisplay.getDevice().getScreenInfo().toByteArray();
                int length4 = length2 + byteArray2.length;
                map5.put(Integer.valueOf(i), byteArray2);
                byte[] byteArray3 = connectionForDisplay.getVideoSettings().toByteArray();
                length2 = length4 + byteArray3.length;
                map4.put(Integer.valueOf(i), byteArray3);
            }
        }
        MediaCodecInfo[] mediaCodecInfoArrListEncoders = ScreenEncoder.listEncoders();
        ArrayList<byte[]> arrayList = new ArrayList();
        if (mediaCodecInfoArrListEncoders != null && mediaCodecInfoArrListEncoders.length > 0) {
            length2 += 4;
            for (MediaCodecInfo mediaCodecInfo : mediaCodecInfoArrListEncoders) {
                byte[] bytes = mediaCodecInfo.getName().getBytes(StandardCharsets.UTF_8);
                length2 += bytes.length + 4;
                arrayList.add(bytes);
            }
        }
        ByteBuffer byteBufferWrap = ByteBuffer.wrap(new byte[length + length2]);
        byteBufferWrap.put(MAGIC_BYTES_INITIAL);
        byte[] bArr = DEVICE_NAME_BYTES;
        byteBufferWrap.put(bArr, 0, Math.min(63, bArr.length));
        byteBufferWrap.position(MAGIC_BYTES_INITIAL.length + 64);
        byteBufferWrap.putInt(displayIds.length);
        Iterator it = map.values().iterator();
        while (it.hasNext()) {
            int displayId = ((DisplayInfo) it.next()).getDisplayId();
            if (map3.containsKey(Integer.valueOf(displayId))) {
                byteBufferWrap.put((byte[]) map3.get(Integer.valueOf(displayId)));
            }
            byteBufferWrap.putInt(map2.containsKey(Integer.valueOf(displayId)) ? ((Integer) map2.get(Integer.valueOf(displayId))).intValue() : 0);
            if (map5.containsKey(Integer.valueOf(displayId))) {
                byte[] bArr2 = (byte[]) map5.get(Integer.valueOf(displayId));
                byteBufferWrap.putInt(bArr2.length);
                byteBufferWrap.put(bArr2);
            } else {
                byteBufferWrap.putInt(0);
            }
            if (map4.containsKey(Integer.valueOf(displayId))) {
                byte[] bArr3 = (byte[]) map4.get(Integer.valueOf(displayId));
                byteBufferWrap.putInt(bArr3.length);
                byteBufferWrap.put(bArr3);
            } else {
                byteBufferWrap.putInt(0);
            }
        }
        byteBufferWrap.putInt(arrayList.size());
        for (byte[] bArr4 : arrayList) {
            byteBufferWrap.putInt(bArr4.length);
            byteBufferWrap.put(bArr4);
        }
        return byteBufferWrap;
    }

    @Override // com.genymobile.scrcpy.Connection, com.genymobile.scrcpy.Device.RotationListener
    public void onRotationChanged(int i) {
        super.onRotationChanged(i);
        this.wsServer.sendInitialInfoToAll();
    }

    private void release() {
        WSServer.releaseConnectionForDisplay(this.videoSettings.getDisplayId());
    }
}
