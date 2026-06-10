.class public Lcom/genymobile/scrcpy/WSServer;
.super Lorg/java_websocket/server/WebSocketServer;
.source "WSServer.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/genymobile/scrcpy/WSServer$SocketInfo;
    }
.end annotation


# static fields
.field private static final PID_FILE_PATH:Ljava/lang/String; = "/data/local/tmp/ws_scrcpy.pid"

.field private static final STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/HashMap<",
            "Ljava/lang/Integer;",
            "Lcom/genymobile/scrcpy/WebSocketConnection;",
            ">;"
        }
    .end annotation
.end field


# instance fields
.field private final options:Lcom/genymobile/scrcpy/Options;

.field protected final reader:Lcom/genymobile/scrcpy/ControlMessageReader;


# direct methods
.method static constructor <clinit>()V
    .locals 1

    .line 60
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    sput-object v0, Lcom/genymobile/scrcpy/WSServer;->STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;

    return-void
.end method

.method public constructor <init>(Lcom/genymobile/scrcpy/Options;)V
    .locals 3

    .line 63
    new-instance v0, Ljava/net/InetSocketAddress;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getListenOnAllInterfaces()Z

    move-result v1

    if-eqz v1, :cond_0

    const-string v1, "0.0.0.0"

    goto :goto_0

    :cond_0
    const-string v1, "127.0.0.1"

    :goto_0
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getPortNumber()I

    move-result v2

    invoke-direct {v0, v1, v2}, Ljava/net/InetSocketAddress;-><init>(Ljava/lang/String;I)V

    invoke-direct {p0, v0}, Lorg/java_websocket/server/WebSocketServer;-><init>(Ljava/net/InetSocketAddress;)V

    .line 58
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessageReader;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/WSServer;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    .line 64
    iput-object p1, p0, Lcom/genymobile/scrcpy/WSServer;->options:Lcom/genymobile/scrcpy/Options;

    .line 65
    invoke-static {}, Lcom/genymobile/scrcpy/WSServer;->unlinkPidFile()V

    return-void
.end method

.method public static getConnectionForDisplay(I)Lcom/genymobile/scrcpy/WebSocketConnection;
    .locals 1

    .line 196
    sget-object v0, Lcom/genymobile/scrcpy/WSServer;->STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;

    invoke-static {p0}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Lcom/genymobile/scrcpy/WebSocketConnection;

    return-object p0
.end method

.method private static joinStreamForDisplayId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/VideoSettings;Lcom/genymobile/scrcpy/Options;ILcom/genymobile/scrcpy/WSServer;)V
    .locals 3

    .line 160
    invoke-interface {p0}, Lorg/java_websocket/WebSocket;->getAttachment()Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    .line 161
    sget-object v1, Lcom/genymobile/scrcpy/WSServer;->STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;

    invoke-static {p3}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Lcom/genymobile/scrcpy/WebSocketConnection;

    if-nez v1, :cond_0

    .line 163
    new-instance v1, Lcom/genymobile/scrcpy/WebSocketConnection;

    invoke-direct {v1, p2, p1, p4}, Lcom/genymobile/scrcpy/WebSocketConnection;-><init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;Lcom/genymobile/scrcpy/WSServer;)V

    .line 164
    sget-object p2, Lcom/genymobile/scrcpy/WSServer;->STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;

    invoke-static {p3}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p3

    invoke-virtual {p2, p3, v1}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 166
    :cond_0
    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->setConnection(Lcom/genymobile/scrcpy/WebSocketConnection;)V

    .line 167
    invoke-virtual {v1, p0, p1}, Lcom/genymobile/scrcpy/WebSocketConnection;->join(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/VideoSettings;)V

    return-void
.end method

.method public static releaseConnectionForDisplay(I)V
    .locals 1

    .line 200
    sget-object v0, Lcom/genymobile/scrcpy/WSServer;->STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;

    invoke-static {p0}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/util/HashMap;->remove(Ljava/lang/Object;)Ljava/lang/Object;

    return-void
.end method

.method private static unlinkPidFile()V
    .locals 2

    .line 172
    :try_start_0
    new-instance v0, Ljava/io/File;

    const-string v1, "/data/local/tmp/ws_scrcpy.pid"

    invoke-direct {v0, v1}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 173
    invoke-virtual {v0}, Ljava/io/File;->exists()Z

    move-result v1

    if-eqz v1, :cond_0

    .line 174
    invoke-virtual {v0}, Ljava/io/File;->delete()Z

    move-result v0

    if-nez v0, :cond_0

    const-string v0, "Failed to delete PID file"

    .line 175
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    move-exception v0

    const-string v1, "Failed to delete PID file:"

    .line 179
    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    :goto_0
    return-void
.end method

.method private static writePidFile()V
    .locals 3

    .line 184
    new-instance v0, Ljava/io/File;

    const-string v1, "/data/local/tmp/ws_scrcpy.pid"

    invoke-direct {v0, v1}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 187
    :try_start_0
    new-instance v1, Ljava/io/FileOutputStream;

    const/4 v2, 0x0

    invoke-direct {v1, v0, v2}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;Z)V

    .line 188
    invoke-static {}, Landroid/os/Process;->myPid()I

    move-result v0

    invoke-static {v0}, Ljava/lang/Integer;->toString(I)Ljava/lang/String;

    move-result-object v0

    sget-object v2, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v0, v2}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/io/FileOutputStream;->write([B)V

    .line 189
    invoke-virtual {v1}, Ljava/io/FileOutputStream;->close()V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    move-exception v0

    .line 191
    invoke-virtual {v0}, Ljava/io/IOException;->getMessage()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    :goto_0
    return-void
.end method


# virtual methods
.method public onClose(Lorg/java_websocket/WebSocket;ILjava/lang/String;Z)V
    .locals 0

    const-string p2, "Client has left the room!"

    .line 85
    invoke-static {p2}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 86
    invoke-static {p1}, Lcom/genymobile/scrcpy/FilePushHandler;->cancelAllForConnection(Lorg/java_websocket/WebSocket;)V

    .line 87
    invoke-interface {p1}, Lorg/java_websocket/WebSocket;->getAttachment()Ljava/lang/Object;

    move-result-object p2

    check-cast p2, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    if-eqz p2, :cond_1

    .line 89
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->getConnection()Lcom/genymobile/scrcpy/WebSocketConnection;

    move-result-object p3

    if-eqz p3, :cond_0

    .line 91
    invoke-virtual {p3, p1}, Lcom/genymobile/scrcpy/WebSocketConnection;->leave(Lorg/java_websocket/WebSocket;)V

    .line 93
    :cond_0
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->release()V

    :cond_1
    return-void
.end method

.method public onError(Lorg/java_websocket/WebSocket;Ljava/lang/Exception;)V
    .locals 1

    const-string v0, "WebSocket error"

    .line 140
    invoke-static {v0, p2}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    if-eqz p1, :cond_0

    .line 143
    invoke-static {p1}, Lcom/genymobile/scrcpy/FilePushHandler;->cancelAllForConnection(Lorg/java_websocket/WebSocket;)V

    .line 145
    :cond_0
    instance-of p1, p2, Ljava/net/BindException;

    if-eqz p1, :cond_1

    const/4 p1, 0x1

    .line 146
    invoke-static {p1}, Ljava/lang/System;->exit(I)V

    :cond_1
    return-void
.end method

.method public onMessage(Lorg/java_websocket/WebSocket;Ljava/lang/String;)V
    .locals 2

    .line 99
    invoke-interface {p1}, Lorg/java_websocket/WebSocket;->getRemoteSocketAddress()Ljava/net/InetSocketAddress;

    move-result-object p1

    invoke-virtual {p1}, Ljava/net/InetSocketAddress;->getAddress()Ljava/net/InetAddress;

    move-result-object p1

    invoke-virtual {p1}, Ljava/net/InetAddress;->getHostAddress()Ljava/lang/String;

    move-result-object p1

    .line 100
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "?  Client from "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p1, " says: \""

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p1, "\""

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    return-void
.end method

.method public onMessage(Lorg/java_websocket/WebSocket;Ljava/nio/ByteBuffer;)V
    .locals 3

    .line 105
    invoke-interface {p1}, Lorg/java_websocket/WebSocket;->getAttachment()Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    if-nez v0, :cond_0

    const-string p1, "No info attached to connection"

    .line 107
    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    return-void

    .line 110
    :cond_0
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->getConnection()Lcom/genymobile/scrcpy/WebSocketConnection;

    move-result-object v0

    .line 111
    invoke-interface {p1}, Lorg/java_websocket/WebSocket;->getRemoteSocketAddress()Ljava/net/InetSocketAddress;

    move-result-object v1

    invoke-virtual {v1}, Ljava/net/InetSocketAddress;->getAddress()Ljava/net/InetAddress;

    move-result-object v1

    invoke-virtual {v1}, Ljava/net/InetAddress;->getHostAddress()Ljava/lang/String;

    move-result-object v1

    .line 112
    iget-object v2, p0, Lcom/genymobile/scrcpy/WSServer;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    invoke-virtual {v2, p2}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v2

    if-eqz v2, :cond_4

    .line 114
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/ControlMessage;->getType()I

    move-result p2

    const/16 v1, 0x66

    if-ne p2, v1, :cond_1

    .line 115
    invoke-static {p1, v2}, Lcom/genymobile/scrcpy/FilePushHandler;->handlePush(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V

    return-void

    .line 118
    :cond_1
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/ControlMessage;->getType()I

    move-result p2

    const/16 v1, 0x65

    if-ne p2, v1, :cond_3

    .line 119
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/ControlMessage;->getVideoSettings()Lcom/genymobile/scrcpy/VideoSettings;

    move-result-object p2

    .line 120
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/VideoSettings;->getDisplayId()I

    move-result v1

    if-eqz v0, :cond_2

    .line 122
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/WebSocketConnection;->getVideoSettings()Lcom/genymobile/scrcpy/VideoSettings;

    move-result-object v2

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/VideoSettings;->getDisplayId()I

    move-result v2

    if-eq v2, v1, :cond_2

    .line 123
    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/WebSocketConnection;->leave(Lorg/java_websocket/WebSocket;)V

    .line 126
    :cond_2
    iget-object v0, p0, Lcom/genymobile/scrcpy/WSServer;->options:Lcom/genymobile/scrcpy/Options;

    invoke-static {p1, p2, v0, v1, p0}, Lcom/genymobile/scrcpy/WSServer;->joinStreamForDisplayId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/VideoSettings;Lcom/genymobile/scrcpy/Options;ILcom/genymobile/scrcpy/WSServer;)V

    return-void

    :cond_3
    if-eqz v0, :cond_5

    .line 130
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/WebSocketConnection;->getController()Lcom/genymobile/scrcpy/Controller;

    move-result-object p1

    .line 131
    invoke-virtual {p1, v2}, Lcom/genymobile/scrcpy/Controller;->handleEvent(Lcom/genymobile/scrcpy/ControlMessage;)V

    goto :goto_0

    .line 134
    :cond_4
    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v0, "?  Client from "

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, " sends bytes: "

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    :cond_5
    :goto_0
    return-void
.end method

.method public onOpen(Lorg/java_websocket/WebSocket;Lorg/java_websocket/handshake/ClientHandshake;)V
    .locals 1

    .line 70
    invoke-interface {p1}, Lorg/java_websocket/WebSocket;->isOpen()Z

    move-result p2

    if-eqz p2, :cond_1

    .line 71
    invoke-static {}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->getNextClientId()S

    move-result p2

    const/4 v0, -0x1

    if-ne p2, v0, :cond_0

    const/16 p2, 0x3f5

    .line 73
    invoke-interface {p1, p2}, Lorg/java_websocket/WebSocket;->close(I)V

    return-void

    .line 76
    :cond_0
    new-instance v0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    invoke-direct {v0, p2}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;-><init>(S)V

    .line 77
    invoke-interface {p1, v0}, Lorg/java_websocket/WebSocket;->setAttachment(Ljava/lang/Object;)V

    .line 78
    invoke-static {}, Lcom/genymobile/scrcpy/WebSocketConnection;->getInitialInfo()Ljava/nio/ByteBuffer;

    move-result-object v0

    invoke-static {v0, p1, p2}, Lcom/genymobile/scrcpy/WebSocketConnection;->sendInitialInfo(Ljava/nio/ByteBuffer;Lorg/java_websocket/WebSocket;I)V

    const-string p1, "Client entered the room!"

    .line 79
    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    :cond_1
    return-void
.end method

.method public onStart()V
    .locals 2

    .line 152
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Server started! "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/WSServer;->getAddress()Ljava/net/InetSocketAddress;

    move-result-object v1

    invoke-virtual {v1}, Ljava/net/InetSocketAddress;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    const/4 v0, 0x0

    .line 153
    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/WSServer;->setConnectionLostTimeout(I)V

    const/16 v0, 0x64

    .line 154
    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/WSServer;->setConnectionLostTimeout(I)V

    .line 155
    invoke-static {}, Lcom/genymobile/scrcpy/WSServer;->writePidFile()V

    return-void
.end method

.method public sendInitialInfoToAll()V
    .locals 4

    .line 204
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/WSServer;->getConnections()Ljava/util/Collection;

    move-result-object v0

    .line 205
    invoke-interface {v0}, Ljava/util/Collection;->isEmpty()Z

    move-result v1

    if-eqz v1, :cond_0

    return-void

    .line 208
    :cond_0
    invoke-static {}, Lcom/genymobile/scrcpy/WebSocketConnection;->getInitialInfo()Ljava/nio/ByteBuffer;

    move-result-object v1

    .line 209
    invoke-interface {v0}, Ljava/util/Collection;->iterator()Ljava/util/Iterator;

    move-result-object v0

    :goto_0
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    move-result v2

    if-eqz v2, :cond_2

    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lorg/java_websocket/WebSocket;

    .line 210
    invoke-interface {v2}, Lorg/java_websocket/WebSocket;->getAttachment()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    if-nez v3, :cond_1

    goto :goto_0

    .line 214
    :cond_1
    invoke-virtual {v3}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->getId()S

    move-result v3

    invoke-static {v1, v2, v3}, Lcom/genymobile/scrcpy/WebSocketConnection;->sendInitialInfo(Ljava/nio/ByteBuffer;Lorg/java_websocket/WebSocket;I)V

    goto :goto_0

    :cond_2
    return-void
.end method
