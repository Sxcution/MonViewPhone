package com.genymobile.scrcpy;

import android.net.LocalServerSocket;
import android.net.LocalSocket;
import android.net.LocalSocketAddress;
import android.os.SystemClock;
import java.io.FileDescriptor;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

/* JADX INFO: loaded from: classes.dex */
public final class DesktopConnection extends Connection {
    private static final String SOCKET_NAME = "scrcpy";
    private final InputStream controlInputStream;
    private final OutputStream controlOutputStream;
    private final LocalSocket controlSocket;
    private final FileDescriptor videoFd;
    private final LocalSocket videoSocket;
    private final DeviceMessageWriter writer;

    @Override // com.genymobile.scrcpy.Connection
    boolean hasConnections() {
        return true;
    }

    private static LocalSocket connect(String str) throws IOException {
        LocalSocket localSocket = new LocalSocket();
        localSocket.connect(new LocalSocketAddress(str));
        return localSocket;
    }

    public DesktopConnection(Options options, VideoSettings videoSettings) throws IOException {
        super(options, videoSettings);
        this.writer = new DeviceMessageWriter();
        if (options.isTunnelForward()) {
            LocalServerSocket localServerSocket = new LocalServerSocket(SOCKET_NAME);
            try {
                LocalSocket localSocketAccept = localServerSocket.accept();
                this.videoSocket = localSocketAccept;
                localSocketAccept.getOutputStream().write(0);
                try {
                    this.controlSocket = localServerSocket.accept();
                } catch (IOException | RuntimeException e) {
                    this.videoSocket.close();
                    throw e;
                }
            } finally {
                localServerSocket.close();
            }
        } else {
            this.videoSocket = connect(SOCKET_NAME);
            try {
                this.controlSocket = connect(SOCKET_NAME);
            } catch (IOException | RuntimeException e2) {
                this.videoSocket.close();
                throw e2;
            }
        }
        this.controlInputStream = this.controlSocket.getInputStream();
        this.controlOutputStream = this.controlSocket.getOutputStream();
        this.videoFd = this.videoSocket.getFileDescriptor();
        if (options.getControl()) {
            startEventController();
        }
        Size videoSize = this.device.getScreenInfo().getVideoSize();
        send(Device.getDeviceName(), videoSize.getWidth(), videoSize.getHeight());
        this.screenEncoder = new ScreenEncoder(videoSettings);
        this.screenEncoder.setDevice(this.device);
        this.screenEncoder.setConnection(this);
        this.screenEncoder.run();
    }

    @Override // com.genymobile.scrcpy.Connection
    public void close() throws IOException {
        this.videoSocket.shutdownInput();
        this.videoSocket.shutdownOutput();
        this.videoSocket.close();
        this.controlSocket.shutdownInput();
        this.controlSocket.shutdownOutput();
        this.controlSocket.close();
    }

    private void send(String str, int i, int i2) throws IOException {
        byte[] bArr = new byte[68];
        byte[] bytes = str.getBytes(StandardCharsets.UTF_8);
        System.arraycopy(bytes, 0, bArr, 0, StringUtils.getUtf8TruncationIndex(bytes, 63));
        bArr[64] = (byte) (i >> 8);
        bArr[65] = (byte) i;
        bArr[66] = (byte) (i2 >> 8);
        bArr[67] = (byte) i2;
        IO.writeFully(this.videoFd, bArr, 0, 68);
    }

    @Override // com.genymobile.scrcpy.Connection
    public void send(ByteBuffer byteBuffer) {
        try {
            IO.writeFully(this.videoFd, byteBuffer);
        } catch (IOException e) {
            Ln.e("Failed to send data", e);
        }
    }

    public FileDescriptor getVideoFd() {
        return this.videoFd;
    }

    private void startEventController() {
        new Thread(new Runnable() { // from class: com.genymobile.scrcpy.DesktopConnection.1
            @Override // java.lang.Runnable
            public void run() {
                try {
                    if (!Device.isScreenOn()) {
                        DesktopConnection.this.controller.turnScreenOn();
                        SystemClock.sleep(500L);
                    }
                    while (true) {
                        ControlMessage controlMessageReceiveControlMessage = DesktopConnection.this.receiveControlMessage();
                        if (controlMessageReceiveControlMessage != null) {
                            DesktopConnection.this.controller.handleEvent(controlMessageReceiveControlMessage);
                        }
                    }
                } catch (IOException unused) {
                    Ln.d("Event controller stopped");
                }
            }
        }).start();
    }

    public ControlMessage receiveControlMessage() throws IOException {
        ControlMessage next = this.reader.next();
        while (next == null) {
            this.reader.readFrom(this.controlInputStream);
            next = this.reader.next();
        }
        return next;
    }

    @Override // com.genymobile.scrcpy.Connection
    public void sendDeviceMessage(DeviceMessage deviceMessage) throws IOException {
        this.writer.writeTo(deviceMessage, this.controlOutputStream);
    }
}
