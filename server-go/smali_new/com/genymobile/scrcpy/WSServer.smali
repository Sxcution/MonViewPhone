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
    .registers 1

    .line 22
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    sput-object v0, Lcom/genymobile/scrcpy/WSServer;->STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;

    return-void
.end method

.method public constructor <init>(Lcom/genymobile/scrcpy/Options;)V
    .registers 5

    .line 65
    new-instance v0, Ljava/net/InetSocketAddress;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getListenOnAllInterfaces()Z

    move-result v1

    if-eqz v1, :cond_b

    const-string v1, "0.0.0.0"

    goto :goto_d

    :cond_b
    const-string v1, "127.0.0.1"

    :goto_d
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getPortNumber()I

    move-result v2

    invoke-direct {v0, v1, v2}, Ljava/net/InetSocketAddress;-><init>(Ljava/lang/String;I)V

    invoke-direct {p0, v0}, Lorg/java_websocket/server/WebSocketServer;-><init>(Ljava/net/InetSocketAddress;)V

    .line 66
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessageReader;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/WSServer;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    .line 67
    iput-object p1, p0, Lcom/genymobile/scrcpy/WSServer;->options:Lcom/genymobile/scrcpy/Options;

    .line 68
    invoke-static {}, Lcom/genymobile/scrcpy/WSServer;->unlinkPidFile()V

    .line 69
    return-void
.end method

.method public static getConnectionForDisplay(I)Lcom/genymobile/scrcpy/WebSocketConnection;
    .registers 2

    .line 191
    sget-object v0, Lcom/genymobile/scrcpy/WSServer;->STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;

    invoke-static {p0}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Lcom/genymobile/scrcpy/WebSocketConnection;

    return-object p0
.end method

.method private static joinStreamForDisplayId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/VideoSettings;Lcom/genymobile/scrcpy/Options;ILcom/genymobile/scrcpy/WSServer;)V
    .registers 8

    .line 158
    invoke-interface {p0}, Lorg/java_websocket/WebSocket;->getAttachment()Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    .line 159
    sget-object v1, Lcom/genymobile/scrcpy/WSServer;->STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;

    invoke-static {p3}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Lcom/genymobile/scrcpy/WebSocketConnection;

    .line 160
    if-nez v1, :cond_22

    .line 161
    new-instance v1, Lcom/genymobile/scrcpy/WebSocketConnection;

    invoke-direct {v1, p2, p1, p4}, Lcom/genymobile/scrcpy/WebSocketConnection;-><init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;Lcom/genymobile/scrcpy/WSServer;)V

    .line 162
    sget-object p2, Lcom/genymobile/scrcpy/WSServer;->STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;

    invoke-static {p3}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p3

    invoke-virtual {p2, p3, v1}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 164
    :cond_22
    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->setConnection(Lcom/genymobile/scrcpy/WebSocketConnection;)V

    .line 165
    invoke-virtual {v1, p0, p1}, Lcom/genymobile/scrcpy/WebSocketConnection;->join(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 166
    return-void
.end method

.method public static releaseConnectionForDisplay(I)V
    .registers 2

    .line 195
    sget-object v0, Lcom/genymobile/scrcpy/WSServer;->STREAM_BY_DISPLAY_ID:Ljava/util/HashMap;

    invoke-static {p0}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/util/HashMap;->remove(Ljava/lang/Object;)Ljava/lang/Object;

    .line 196
    return-void
.end method

.method private static unlinkPidFile()V
    .registers 2

    .line 170
    :try_start_0
    new-instance v0, Ljava/io/File;

    const-string v1, "/data/local/tmp/ws_scrcpy.pid"

    invoke-direct {v0, v1}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    .line 171
    invoke-virtual {v0}, Ljava/io/File;->exists()Z

    move-result v1

    if-eqz v1, :cond_1a

    invoke-virtual {v0}, Ljava/io/File;->delete()Z

    move-result v0

    if-eqz v0, :cond_14

    goto :goto_1a

    .line 174
    :cond_14
    const-string v0, "Failed to delete PID file"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V
    :try_end_19
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_19} :catch_1b

    .line 177
    goto :goto_21

    .line 172
    :cond_1a
    :goto_1a
    return-void

    .line 175
    :catch_1b
    move-exception v0

    .line 176
    const-string v1, "Failed to delete PID file:"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 178
    :goto_21
    return-void
.end method

.method private static writePidFile()V
    .registers 3

    .line 182
    :try_start_0
    new-instance v0, Ljava/io/FileOutputStream;

    new-instance v1, Ljava/io/File;

    const-string v2, "/data/local/tmp/ws_scrcpy.pid"

    invoke-direct {v1, v2}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    const/4 v2, 0x0

    invoke-direct {v0, v1, v2}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;Z)V

    .line 183
    invoke-static {}, Landroid/os/Process;->myPid()I

    move-result v1

    invoke-static {v1}, Ljava/lang/Integer;->toString(I)Ljava/lang/String;

    move-result-object v1

    sget-object v2, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v1, v2}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/io/FileOutputStream;->write([B)V

    .line 184
    invoke-virtual {v0}, Ljava/io/FileOutputStream;->close()V
    :try_end_21
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_21} :catch_22

    .line 187
    goto :goto_2a

    .line 185
    :catch_22
    move-exception v0

    .line 186
    invoke-virtual {v0}, Ljava/io/IOException;->getMessage()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 188
    :goto_2a
    return-void
.end method


# virtual methods
.method public onClose(Lorg/java_websocket/WebSocket;ILjava/lang/String;Z)V
    .registers 5

    .line 87
    const-string p2, "Client has left the room!"

    invoke-static {p2}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 88
    invoke-static {p1}, Lcom/genymobile/scrcpy/FilePushHandler;->cancelAllForConnection(Lorg/java_websocket/WebSocket;)V

    .line 89
    invoke-interface {p1}, Lorg/java_websocket/WebSocket;->getAttachment()Ljava/lang/Object;

    move-result-object p2

    check-cast p2, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    .line 90
    if-eqz p2, :cond_1c

    .line 91
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->getConnection()Lcom/genymobile/scrcpy/WebSocketConnection;

    move-result-object p3

    .line 92
    if-eqz p3, :cond_19

    .line 93
    invoke-virtual {p3, p1}, Lcom/genymobile/scrcpy/WebSocketConnection;->leave(Lorg/java_websocket/WebSocket;)V

    .line 95
    :cond_19
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->release()V

    .line 97
    :cond_1c
    return-void
.end method

.method public onError(Lorg/java_websocket/WebSocket;Ljava/lang/Exception;)V
    .registers 4

    .line 140
    const-string v0, "WebSocket error"

    invoke-static {v0, p2}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 141
    if-eqz p1, :cond_a

    .line 142
    invoke-static {p1}, Lcom/genymobile/scrcpy/FilePushHandler;->cancelAllForConnection(Lorg/java_websocket/WebSocket;)V

    .line 144
    :cond_a
    instance-of p1, p2, Ljava/net/BindException;

    if-eqz p1, :cond_12

    .line 145
    const/4 p1, 0x1

    invoke-static {p1}, Ljava/lang/System;->exit(I)V

    .line 147
    :cond_12
    return-void
.end method

.method public onMessage(Lorg/java_websocket/WebSocket;Ljava/lang/String;)V
    .registers 5

    .line 101
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "?  Client from "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-interface {p1}, Lorg/java_websocket/WebSocket;->getRemoteSocketAddress()Ljava/net/InetSocketAddress;

    move-result-object p1

    invoke-virtual {p1}, Ljava/net/InetSocketAddress;->getAddress()Ljava/net/InetAddress;

    move-result-object p1

    invoke-virtual {p1}, Ljava/net/InetAddress;->getHostAddress()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string v0, " says: \""

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string p2, "\""

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 102
    return-void
.end method

.method public onMessage(Lorg/java_websocket/WebSocket;Ljava/nio/ByteBuffer;)V
    .registers 6

    .line 106
    invoke-interface {p1}, Lorg/java_websocket/WebSocket;->getAttachment()Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    .line 107
    if-nez v0, :cond_e

    .line 108
    const-string p1, "No info attached to connection"

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 109
    return-void

    .line 111
    :cond_e
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->getConnection()Lcom/genymobile/scrcpy/WebSocketConnection;

    move-result-object v0

    .line 112
    invoke-interface {p1}, Lorg/java_websocket/WebSocket;->getRemoteSocketAddress()Ljava/net/InetSocketAddress;

    move-result-object v1

    invoke-virtual {v1}, Ljava/net/InetSocketAddress;->getAddress()Ljava/net/InetAddress;

    move-result-object v1

    invoke-virtual {v1}, Ljava/net/InetAddress;->getHostAddress()Ljava/lang/String;

    move-result-object v1

    .line 113
    iget-object v2, p0, Lcom/genymobile/scrcpy/WSServer;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    invoke-virtual {v2, p2}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v2

    .line 114
    if-eqz v2, :cond_62

    .line 115
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/ControlMessage;->getType()I

    move-result p2

    const/16 v1, 0x66

    if-ne p2, v1, :cond_32

    .line 116
    invoke-static {p1, v2}, Lcom/genymobile/scrcpy/FilePushHandler;->handlePush(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V

    .line 117
    return-void

    .line 119
    :cond_32
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/ControlMessage;->getType()I

    move-result p2

    const/16 v1, 0x65

    if-eq p2, v1, :cond_45

    .line 120
    if-eqz v0, :cond_44

    .line 121
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/WebSocketConnection;->getController()Lcom/genymobile/scrcpy/Controller;

    move-result-object p1

    invoke-virtual {p1, v2}, Lcom/genymobile/scrcpy/Controller;->handleEvent(Lcom/genymobile/scrcpy/ControlMessage;)V

    .line 122
    return-void

    .line 124
    :cond_44
    return-void

    .line 126
    :cond_45
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/ControlMessage;->getVideoSettings()Lcom/genymobile/scrcpy/VideoSettings;

    move-result-object p2

    .line 127
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/VideoSettings;->getDisplayId()I

    move-result v1

    .line 128
    if-eqz v0, :cond_5c

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/WebSocketConnection;->getVideoSettings()Lcom/genymobile/scrcpy/VideoSettings;

    move-result-object v2

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/VideoSettings;->getDisplayId()I

    move-result v2

    if-eq v2, v1, :cond_5c

    .line 129
    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/WebSocketConnection;->leave(Lorg/java_websocket/WebSocket;)V

    .line 131
    :cond_5c
    iget-object v0, p0, Lcom/genymobile/scrcpy/WSServer;->options:Lcom/genymobile/scrcpy/Options;

    invoke-static {p1, p2, v0, v1, p0}, Lcom/genymobile/scrcpy/WSServer;->joinStreamForDisplayId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/VideoSettings;Lcom/genymobile/scrcpy/Options;ILcom/genymobile/scrcpy/WSServer;)V

    .line 132
    return-void

    .line 135
    :cond_62
    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v0, "?  Client from "

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string v0, " sends bytes: "

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 136
    return-void
.end method

.method public onOpen(Lorg/java_websocket/WebSocket;Lorg/java_websocket/handshake/ClientHandshake;)V
    .registers 4

    .line 73
    invoke-interface {p1}, Lorg/java_websocket/WebSocket;->isOpen()Z

    move-result p2

    if-eqz p2, :cond_27

    .line 74
    invoke-static {}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->getNextClientId()S

    move-result p2

    .line 75
    const/4 v0, -0x1

    if-ne p2, v0, :cond_13

    .line 76
    const/16 p2, 0x3f5

    invoke-interface {p1, p2}, Lorg/java_websocket/WebSocket;->close(I)V

    .line 77
    return-void

    .line 79
    :cond_13
    new-instance v0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    invoke-direct {v0, p2}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;-><init>(S)V

    invoke-interface {p1, v0}, Lorg/java_websocket/WebSocket;->setAttachment(Ljava/lang/Object;)V

    .line 80
    invoke-static {}, Lcom/genymobile/scrcpy/WebSocketConnection;->getInitialInfo()Ljava/nio/ByteBuffer;

    move-result-object v0

    invoke-static {v0, p1, p2}, Lcom/genymobile/scrcpy/WebSocketConnection;->sendInitialInfo(Ljava/nio/ByteBuffer;Lorg/java_websocket/WebSocket;I)V

    .line 81
    const-string p1, "Client entered the room!"

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 83
    :cond_27
    return-void
.end method

.method public onStart()V
    .registers 3

    .line 151
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Server started! "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/WSServer;->getAddress()Ljava/net/InetSocketAddress;

    move-result-object v1

    invoke-virtual {v1}, Ljava/net/InetSocketAddress;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 152
    const/4 v0, 0x0

    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/WSServer;->setConnectionLostTimeout(I)V

    .line 153
    const/16 v0, 0x64

    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/WSServer;->setConnectionLostTimeout(I)V

    .line 154
    invoke-static {}, Lcom/genymobile/scrcpy/WSServer;->writePidFile()V

    .line 155
    return-void
.end method

.method public sendInitialInfoToAll()V
    .registers 5

    .line 199
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/WSServer;->getConnections()Ljava/util/Collection;

    move-result-object v0

    .line 200
    invoke-interface {v0}, Ljava/util/Collection;->isEmpty()Z

    move-result v1

    if-eqz v1, :cond_b

    .line 201
    return-void

    .line 203
    :cond_b
    invoke-static {}, Lcom/genymobile/scrcpy/WebSocketConnection;->getInitialInfo()Ljava/nio/ByteBuffer;

    move-result-object v1

    .line 204
    invoke-interface {v0}, Ljava/util/Collection;->iterator()Ljava/util/Iterator;

    move-result-object v0

    :goto_13
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    move-result v2

    if-eqz v2, :cond_2f

    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lorg/java_websocket/WebSocket;

    .line 205
    invoke-interface {v2}, Lorg/java_websocket/WebSocket;->getAttachment()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    .line 206
    if-eqz v3, :cond_2e

    .line 207
    invoke-virtual {v3}, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->getId()S

    move-result v3

    invoke-static {v1, v2, v3}, Lcom/genymobile/scrcpy/WebSocketConnection;->sendInitialInfo(Ljava/nio/ByteBuffer;Lorg/java_websocket/WebSocket;I)V

    .line 209
    :cond_2e
    goto :goto_13

    .line 210
    :cond_2f
    return-void
.end method
