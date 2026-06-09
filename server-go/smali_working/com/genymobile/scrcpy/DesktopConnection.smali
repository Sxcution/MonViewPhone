.class public final Lcom/genymobile/scrcpy/DesktopConnection;
.super Lcom/genymobile/scrcpy/Connection;
.source "DesktopConnection.java"


# static fields
.field private static final SOCKET_NAME:Ljava/lang/String; = "scrcpy"


# instance fields
.field private final controlInputStream:Ljava/io/InputStream;

.field private final controlOutputStream:Ljava/io/OutputStream;

.field private final controlSocket:Landroid/net/LocalSocket;

.field private final videoFd:Ljava/io/FileDescriptor;

.field private final videoSocket:Landroid/net/LocalSocket;

.field private final writer:Lcom/genymobile/scrcpy/DeviceMessageWriter;


# direct methods
.method public constructor <init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V
    .registers 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 35
    invoke-direct {p0, p1, p2}, Lcom/genymobile/scrcpy/Connection;-><init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 26
    new-instance v0, Lcom/genymobile/scrcpy/DeviceMessageWriter;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/DeviceMessageWriter;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->writer:Lcom/genymobile/scrcpy/DeviceMessageWriter;

    .line 36
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->isTunnelForward()Z

    move-result v0

    const-string v1, "scrcpy"

    if-eqz v0, :cond_3d

    .line 38
    new-instance v0, Landroid/net/LocalServerSocket;

    invoke-direct {v0, v1}, Landroid/net/LocalServerSocket;-><init>(Ljava/lang/String;)V

    .line 40
    :try_start_17
    invoke-virtual {v0}, Landroid/net/LocalServerSocket;->accept()Landroid/net/LocalSocket;

    move-result-object v1

    iput-object v1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    .line 42
    invoke-virtual {v1}, Landroid/net/LocalSocket;->getOutputStream()Ljava/io/OutputStream;

    move-result-object v1

    const/4 v2, 0x0

    invoke-virtual {v1, v2}, Ljava/io/OutputStream;->write(I)V
    :try_end_25
    .catchall {:try_start_17 .. :try_end_25} :catchall_38

    .line 44
    :try_start_25
    invoke-virtual {v0}, Landroid/net/LocalServerSocket;->accept()Landroid/net/LocalSocket;

    move-result-object v1

    iput-object v1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;
    :try_end_2b
    .catch Ljava/io/IOException; {:try_start_25 .. :try_end_2b} :catch_31
    .catch Ljava/lang/RuntimeException; {:try_start_25 .. :try_end_2b} :catch_2f
    .catchall {:try_start_25 .. :try_end_2b} :catchall_38

    .line 50
    invoke-virtual {v0}, Landroid/net/LocalServerSocket;->close()V

    goto :goto_49

    :catch_2f
    move-exception p1

    goto :goto_32

    :catch_31
    move-exception p1

    .line 46
    :goto_32
    :try_start_32
    iget-object p2, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {p2}, Landroid/net/LocalSocket;->close()V

    .line 47
    throw p1
    :try_end_38
    .catchall {:try_start_32 .. :try_end_38} :catchall_38

    :catchall_38
    move-exception p1

    .line 50
    invoke-virtual {v0}, Landroid/net/LocalServerSocket;->close()V

    .line 51
    throw p1

    .line 53
    :cond_3d
    invoke-static {v1}, Lcom/genymobile/scrcpy/DesktopConnection;->connect(Ljava/lang/String;)Landroid/net/LocalSocket;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    .line 55
    :try_start_43
    invoke-static {v1}, Lcom/genymobile/scrcpy/DesktopConnection;->connect(Ljava/lang/String;)Landroid/net/LocalSocket;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;
    :try_end_49
    .catch Ljava/io/IOException; {:try_start_43 .. :try_end_49} :catch_9e
    .catch Ljava/lang/RuntimeException; {:try_start_43 .. :try_end_49} :catch_9c

    .line 62
    :goto_49
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->getInputStream()Ljava/io/InputStream;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlInputStream:Ljava/io/InputStream;

    .line 63
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->getOutputStream()Ljava/io/OutputStream;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlOutputStream:Ljava/io/OutputStream;

    .line 64
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->getFileDescriptor()Ljava/io/FileDescriptor;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoFd:Ljava/io/FileDescriptor;

    .line 65
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getControl()Z

    move-result p1

    if-eqz p1, :cond_6a

    .line 66
    invoke-direct {p0}, Lcom/genymobile/scrcpy/DesktopConnection;->startEventController()V

    .line 68
    :cond_6a
    iget-object p1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Device;->getScreenInfo()Lcom/genymobile/scrcpy/ScreenInfo;

    move-result-object p1

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ScreenInfo;->getVideoSize()Lcom/genymobile/scrcpy/Size;

    move-result-object p1

    .line 69
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->getDeviceName()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v1

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result p1

    invoke-direct {p0, v0, v1, p1}, Lcom/genymobile/scrcpy/DesktopConnection;->send(Ljava/lang/String;II)V

    .line 70
    new-instance p1, Lcom/genymobile/scrcpy/ScreenEncoder;

    invoke-direct {p1, p2}, Lcom/genymobile/scrcpy/ScreenEncoder;-><init>(Lcom/genymobile/scrcpy/VideoSettings;)V

    iput-object p1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->screenEncoder:Lcom/genymobile/scrcpy/ScreenEncoder;

    .line 71
    iget-object p1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->screenEncoder:Lcom/genymobile/scrcpy/ScreenEncoder;

    iget-object p2, p0, Lcom/genymobile/scrcpy/DesktopConnection;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {p1, p2}, Lcom/genymobile/scrcpy/ScreenEncoder;->setDevice(Lcom/genymobile/scrcpy/Device;)V

    .line 72
    iget-object p1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->screenEncoder:Lcom/genymobile/scrcpy/ScreenEncoder;

    invoke-virtual {p1, p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->setConnection(Lcom/genymobile/scrcpy/Connection;)V

    .line 73
    iget-object p1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->screenEncoder:Lcom/genymobile/scrcpy/ScreenEncoder;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ScreenEncoder;->run()V

    return-void

    :catch_9c
    move-exception p1

    goto :goto_9f

    :catch_9e
    move-exception p1

    .line 57
    :goto_9f
    iget-object p2, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {p2}, Landroid/net/LocalSocket;->close()V

    .line 58
    throw p1
.end method

.method private static connect(Ljava/lang/String;)Landroid/net/LocalSocket;
    .registers 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 29
    new-instance v0, Landroid/net/LocalSocket;

    invoke-direct {v0}, Landroid/net/LocalSocket;-><init>()V

    .line 30
    new-instance v1, Landroid/net/LocalSocketAddress;

    invoke-direct {v1, p0}, Landroid/net/LocalSocketAddress;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, v1}, Landroid/net/LocalSocket;->connect(Landroid/net/LocalSocketAddress;)V

    return-object v0
.end method

.method private send(Ljava/lang/String;II)V
    .registers 8
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    const/16 v0, 0x44

    new-array v1, v0, [B

    .line 88
    sget-object v2, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {p1, v2}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object p1

    const/16 v2, 0x3f

    .line 89
    invoke-static {p1, v2}, Lcom/genymobile/scrcpy/StringUtils;->getUtf8TruncationIndex([BI)I

    move-result v2

    const/4 v3, 0x0

    .line 90
    invoke-static {p1, v3, v1, v3, v2}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    shr-int/lit8 p1, p2, 0x8

    int-to-byte p1, p1

    const/16 v2, 0x40

    aput-byte p1, v1, v2

    int-to-byte p1, p2

    const/16 p2, 0x41

    aput-byte p1, v1, p2

    shr-int/lit8 p1, p3, 0x8

    int-to-byte p1, p1

    const/16 p2, 0x42

    aput-byte p1, v1, p2

    int-to-byte p1, p3

    const/16 p2, 0x43

    aput-byte p1, v1, p2

    .line 97
    iget-object p1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoFd:Ljava/io/FileDescriptor;

    invoke-static {p1, v1, v3, v0}, Lcom/genymobile/scrcpy/IO;->writeFully(Ljava/io/FileDescriptor;[BII)V

    return-void
.end method

.method private startEventController()V
    .registers 3

    .line 118
    new-instance v0, Ljava/lang/Thread;

    new-instance v1, Lcom/genymobile/scrcpy/DesktopConnection$1;

    invoke-direct {v1, p0}, Lcom/genymobile/scrcpy/DesktopConnection$1;-><init>(Lcom/genymobile/scrcpy/DesktopConnection;)V

    invoke-direct {v0, v1}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;)V

    .line 147
    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    return-void
.end method


# virtual methods
.method public close()V
    .registers 2
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 77
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->shutdownInput()V

    .line 78
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->shutdownOutput()V

    .line 79
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->close()V

    .line 80
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->shutdownInput()V

    .line 81
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->shutdownOutput()V

    .line 82
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->close()V

    return-void
.end method

.method public getVideoFd()Ljava/io/FileDescriptor;
    .registers 2

    .line 114
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoFd:Ljava/io/FileDescriptor;

    return-object v0
.end method

.method hasConnections()Z
    .registers 2

    const/4 v0, 0x1

    return v0
.end method

.method public receiveControlMessage()Lcom/genymobile/scrcpy/ControlMessage;
    .registers 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 151
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->next()Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v0

    :goto_6
    if-nez v0, :cond_16

    .line 153
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    iget-object v1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlInputStream:Ljava/io/InputStream;

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/ControlMessageReader;->readFrom(Ljava/io/InputStream;)V

    .line 154
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->next()Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v0

    goto :goto_6

    :cond_16
    return-object v0
.end method

.method public send(Ljava/nio/ByteBuffer;)V
    .registers 3

    .line 102
    :try_start_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoFd:Ljava/io/FileDescriptor;

    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/IO;->writeFully(Ljava/io/FileDescriptor;Ljava/nio/ByteBuffer;)V
    :try_end_5
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_5} :catch_6

    goto :goto_c

    :catch_6
    move-exception p1

    const-string v0, "Failed to send data"

    .line 104
    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :goto_c
    return-void
.end method

.method public sendDeviceMessage(Lcom/genymobile/scrcpy/DeviceMessage;)V
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 160
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->writer:Lcom/genymobile/scrcpy/DeviceMessageWriter;

    iget-object v1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlOutputStream:Ljava/io/OutputStream;

    invoke-virtual {v0, p1, v1}, Lcom/genymobile/scrcpy/DeviceMessageWriter;->writeTo(Lcom/genymobile/scrcpy/DeviceMessage;Ljava/io/OutputStream;)V

    return-void
.end method
