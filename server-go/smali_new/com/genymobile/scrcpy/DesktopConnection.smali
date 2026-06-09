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

    .line 36
    invoke-direct {p0, p1, p2}, Lcom/genymobile/scrcpy/Connection;-><init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 37
    new-instance v0, Lcom/genymobile/scrcpy/DeviceMessageWriter;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/DeviceMessageWriter;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->writer:Lcom/genymobile/scrcpy/DeviceMessageWriter;

    .line 38
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->isTunnelForward()Z

    move-result v0

    const-string v1, "scrcpy"

    if-eqz v0, :cond_3f

    .line 39
    new-instance v0, Landroid/net/LocalServerSocket;

    invoke-direct {v0, v1}, Landroid/net/LocalServerSocket;-><init>(Ljava/lang/String;)V

    .line 41
    :try_start_17
    invoke-virtual {v0}, Landroid/net/LocalServerSocket;->accept()Landroid/net/LocalSocket;

    move-result-object v1

    .line 42
    iput-object v1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    .line 43
    invoke-virtual {v1}, Landroid/net/LocalSocket;->getOutputStream()Ljava/io/OutputStream;

    move-result-object v1

    const/4 v2, 0x0

    invoke-virtual {v1, v2}, Ljava/io/OutputStream;->write(I)V
    :try_end_25
    .catchall {:try_start_17 .. :try_end_25} :catchall_3a

    .line 45
    :try_start_25
    invoke-virtual {v0}, Landroid/net/LocalServerSocket;->accept()Landroid/net/LocalSocket;

    move-result-object v1

    iput-object v1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;
    :try_end_2b
    .catch Ljava/io/IOException; {:try_start_25 .. :try_end_2b} :catch_33
    .catch Ljava/lang/RuntimeException; {:try_start_25 .. :try_end_2b} :catch_31
    .catchall {:try_start_25 .. :try_end_2b} :catchall_3a

    .line 49
    nop

    .line 51
    invoke-virtual {v0}, Landroid/net/LocalServerSocket;->close()V

    .line 52
    nop

    .line 53
    goto :goto_4c

    .line 46
    :catch_31
    move-exception p1

    goto :goto_34

    :catch_33
    move-exception p1

    .line 47
    :goto_34
    :try_start_34
    iget-object p2, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {p2}, Landroid/net/LocalSocket;->close()V

    .line 48
    throw p1
    :try_end_3a
    .catchall {:try_start_34 .. :try_end_3a} :catchall_3a

    .line 51
    :catchall_3a
    move-exception p1

    invoke-virtual {v0}, Landroid/net/LocalServerSocket;->close()V

    .line 52
    throw p1

    .line 54
    :cond_3f
    invoke-static {v1}, Lcom/genymobile/scrcpy/DesktopConnection;->connect(Ljava/lang/String;)Landroid/net/LocalSocket;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    .line 56
    :try_start_45
    invoke-static {v1}, Lcom/genymobile/scrcpy/DesktopConnection;->connect(Ljava/lang/String;)Landroid/net/LocalSocket;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;
    :try_end_4b
    .catch Ljava/io/IOException; {:try_start_45 .. :try_end_4b} :catch_a1
    .catch Ljava/lang/RuntimeException; {:try_start_45 .. :try_end_4b} :catch_9f

    .line 60
    nop

    .line 62
    :goto_4c
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

    if-eqz p1, :cond_6d

    .line 66
    invoke-direct {p0}, Lcom/genymobile/scrcpy/DesktopConnection;->startEventController()V

    .line 68
    :cond_6d
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

    .line 74
    return-void

    .line 57
    :catch_9f
    move-exception p1

    goto :goto_a2

    :catch_a1
    move-exception p1

    .line 58
    :goto_a2
    iget-object p2, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {p2}, Landroid/net/LocalSocket;->close()V

    .line 59
    throw p1
.end method

.method private static connect(Ljava/lang/String;)Landroid/net/LocalSocket;
    .registers 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 30
    new-instance v0, Landroid/net/LocalSocket;

    invoke-direct {v0}, Landroid/net/LocalSocket;-><init>()V

    .line 31
    new-instance v1, Landroid/net/LocalSocketAddress;

    invoke-direct {v1, p0}, Landroid/net/LocalSocketAddress;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, v1}, Landroid/net/LocalSocket;->connect(Landroid/net/LocalSocketAddress;)V

    .line 32
    return-object v0
.end method

.method private send(Ljava/lang/String;II)V
    .registers 8
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 87
    const/16 v0, 0x44

    new-array v1, v0, [B

    .line 88
    sget-object v2, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {p1, v2}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object p1

    .line 89
    const/16 v2, 0x3f

    invoke-static {p1, v2}, Lcom/genymobile/scrcpy/StringUtils;->getUtf8TruncationIndex([BI)I

    move-result v2

    const/4 v3, 0x0

    invoke-static {p1, v3, v1, v3, v2}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 90
    shr-int/lit8 p1, p2, 0x8

    int-to-byte p1, p1

    const/16 v2, 0x40

    aput-byte p1, v1, v2

    .line 91
    const/16 p1, 0x41

    int-to-byte p2, p2

    aput-byte p2, v1, p1

    .line 92
    shr-int/lit8 p1, p3, 0x8

    int-to-byte p1, p1

    const/16 p2, 0x42

    aput-byte p1, v1, p2

    .line 93
    const/16 p1, 0x43

    int-to-byte p2, p3

    aput-byte p2, v1, p1

    .line 94
    iget-object p1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoFd:Ljava/io/FileDescriptor;

    invoke-static {p1, v1, v3, v0}, Lcom/genymobile/scrcpy/IO;->writeFully(Ljava/io/FileDescriptor;[BII)V

    .line 95
    return-void
.end method

.method private startEventController()V
    .registers 3

    .line 111
    new-instance v0, Ljava/lang/Thread;

    new-instance v1, Lcom/genymobile/scrcpy/DesktopConnection$1;

    invoke-direct {v1, p0}, Lcom/genymobile/scrcpy/DesktopConnection$1;-><init>(Lcom/genymobile/scrcpy/DesktopConnection;)V

    invoke-direct {v0, v1}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;)V

    .line 129
    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    .line 130
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

    .line 78
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->shutdownInput()V

    .line 79
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->shutdownOutput()V

    .line 80
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->close()V

    .line 81
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->shutdownInput()V

    .line 82
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->shutdownOutput()V

    .line 83
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlSocket:Landroid/net/LocalSocket;

    invoke-virtual {v0}, Landroid/net/LocalSocket;->close()V

    .line 84
    return-void
.end method

.method public getVideoFd()Ljava/io/FileDescriptor;
    .registers 2

    .line 107
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoFd:Ljava/io/FileDescriptor;

    return-object v0
.end method

.method hasConnections()Z
    .registers 2

    .line 26
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

    .line 133
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->next()Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v0

    .line 134
    :goto_6
    if-nez v0, :cond_16

    .line 135
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    iget-object v1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlInputStream:Ljava/io/InputStream;

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/ControlMessageReader;->readFrom(Ljava/io/InputStream;)V

    .line 136
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->next()Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v0

    goto :goto_6

    .line 138
    :cond_16
    return-object v0
.end method

.method public send(Ljava/nio/ByteBuffer;)V
    .registers 3

    .line 100
    :try_start_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->videoFd:Ljava/io/FileDescriptor;

    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/IO;->writeFully(Ljava/io/FileDescriptor;Ljava/nio/ByteBuffer;)V
    :try_end_5
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_5} :catch_6

    .line 103
    goto :goto_c

    .line 101
    :catch_6
    move-exception p1

    .line 102
    const-string v0, "Failed to send data"

    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 104
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

    .line 143
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection;->writer:Lcom/genymobile/scrcpy/DeviceMessageWriter;

    iget-object v1, p0, Lcom/genymobile/scrcpy/DesktopConnection;->controlOutputStream:Ljava/io/OutputStream;

    invoke-virtual {v0, p1, v1}, Lcom/genymobile/scrcpy/DeviceMessageWriter;->writeTo(Lcom/genymobile/scrcpy/DeviceMessage;Ljava/io/OutputStream;)V

    .line 144
    return-void
.end method
