.class public Lcom/genymobile/scrcpy/WebSocketConnection;
.super Lcom/genymobile/scrcpy/Connection;
.source "WebSocketConnection.java"


# static fields
.field private static final DEVICE_NAME_BYTES:[B

.field private static final MAGIC_BYTES_INITIAL:[B

.field private static final MAGIC_BYTES_MESSAGE:[B


# instance fields
.field private screenEncoder:Lcom/genymobile/scrcpy/ScreenEncoder;

.field private final sockets:Ljava/util/HashSet;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/HashSet<",
            "Lorg/java_websocket/WebSocket;",
            ">;"
        }
    .end annotation
.end field

.field private final wsServer:Lcom/genymobile/scrcpy/WSServer;


# direct methods
.method static constructor <clinit>()V
    .registers 2

    .line 18
    const-string v0, "scrcpy_initial"

    sget-object v1, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v0, v1}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v0

    sput-object v0, Lcom/genymobile/scrcpy/WebSocketConnection;->MAGIC_BYTES_INITIAL:[B

    .line 19
    const-string v0, "scrcpy_message"

    sget-object v1, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v0, v1}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v0

    sput-object v0, Lcom/genymobile/scrcpy/WebSocketConnection;->MAGIC_BYTES_MESSAGE:[B

    .line 20
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->getDeviceName()Ljava/lang/String;

    move-result-object v0

    sget-object v1, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v0, v1}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v0

    sput-object v0, Lcom/genymobile/scrcpy/WebSocketConnection;->DEVICE_NAME_BYTES:[B

    return-void
.end method

.method public constructor <init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;Lcom/genymobile/scrcpy/WSServer;)V
    .registers 4

    .line 27
    invoke-direct {p0, p1, p2}, Lcom/genymobile/scrcpy/Connection;-><init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 28
    new-instance p1, Ljava/util/HashSet;

    invoke-direct {p1}, Ljava/util/HashSet;-><init>()V

    iput-object p1, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->sockets:Ljava/util/HashSet;

    .line 29
    iput-object p3, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->wsServer:Lcom/genymobile/scrcpy/WSServer;

    .line 30
    return-void
.end method

.method public static deviceMessageToByteBuffer(Lcom/genymobile/scrcpy/DeviceMessage;)Ljava/nio/ByteBuffer;
    .registers 2

    .line 64
    sget-object v0, Lcom/genymobile/scrcpy/WebSocketConnection;->MAGIC_BYTES_MESSAGE:[B

    array-length v0, v0

    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/DeviceMessage;->writeToByteArray(I)[B

    move-result-object p0

    invoke-static {p0}, Ljava/nio/ByteBuffer;->wrap([B)Ljava/nio/ByteBuffer;

    move-result-object p0

    .line 65
    sget-object v0, Lcom/genymobile/scrcpy/WebSocketConnection;->MAGIC_BYTES_MESSAGE:[B

    invoke-virtual {p0, v0}, Ljava/nio/ByteBuffer;->put([B)Ljava/nio/ByteBuffer;

    .line 66
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->rewind()Ljava/nio/Buffer;

    .line 67
    return-object p0
.end method

.method public static getInitialInfo()Ljava/nio/ByteBuffer;
    .registers 15

    .line 115
    sget-object v0, Lcom/genymobile/scrcpy/WebSocketConnection;->MAGIC_BYTES_INITIAL:[B

    array-length v0, v0

    add-int/lit8 v0, v0, 0x40

    add-int/lit8 v0, v0, 0x4

    add-int/lit8 v0, v0, 0x4

    .line 116
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->getDisplayIds()[I

    move-result-object v1

    .line 117
    new-instance v2, Ljava/util/HashMap;

    invoke-direct {v2}, Ljava/util/HashMap;-><init>()V

    .line 118
    new-instance v3, Ljava/util/HashMap;

    invoke-direct {v3}, Ljava/util/HashMap;-><init>()V

    .line 119
    new-instance v4, Ljava/util/HashMap;

    invoke-direct {v4}, Ljava/util/HashMap;-><init>()V

    .line 120
    new-instance v5, Ljava/util/HashMap;

    invoke-direct {v5}, Ljava/util/HashMap;-><init>()V

    .line 121
    new-instance v6, Ljava/util/HashMap;

    invoke-direct {v6}, Ljava/util/HashMap;-><init>()V

    .line 122
    nop

    .line 123
    array-length v7, v1

    const/4 v8, 0x0

    const/4 v9, 0x0

    const/4 v10, 0x0

    :goto_2b
    if-ge v9, v7, :cond_8d

    aget v11, v1, v9

    .line 124
    invoke-static {v11}, Lcom/genymobile/scrcpy/Device;->getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;

    move-result-object v12

    .line 125
    invoke-static {v11}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v13

    invoke-virtual {v2, v13, v12}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 126
    invoke-virtual {v12}, Lcom/genymobile/scrcpy/DisplayInfo;->toByteArray()[B

    move-result-object v12

    .line 127
    array-length v13, v12

    add-int/2addr v10, v13

    .line 128
    invoke-static {v11}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v13

    invoke-virtual {v4, v13, v12}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 129
    invoke-static {v11}, Lcom/genymobile/scrcpy/WSServer;->getConnectionForDisplay(I)Lcom/genymobile/scrcpy/WebSocketConnection;

    move-result-object v12

    .line 130
    add-int/lit8 v10, v10, 0x4

    add-int/lit8 v10, v10, 0x4

    add-int/lit8 v10, v10, 0x4

    .line 131
    if-eqz v12, :cond_8a

    .line 132
    invoke-static {v11}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v13

    iget-object v14, v12, Lcom/genymobile/scrcpy/WebSocketConnection;->sockets:Ljava/util/HashSet;

    invoke-virtual {v14}, Ljava/util/HashSet;->size()I

    move-result v14

    invoke-static {v14}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v14

    invoke-virtual {v3, v13, v14}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 133
    invoke-virtual {v12}, Lcom/genymobile/scrcpy/WebSocketConnection;->getDevice()Lcom/genymobile/scrcpy/Device;

    move-result-object v13

    invoke-virtual {v13}, Lcom/genymobile/scrcpy/Device;->getScreenInfo()Lcom/genymobile/scrcpy/ScreenInfo;

    move-result-object v13

    invoke-virtual {v13}, Lcom/genymobile/scrcpy/ScreenInfo;->toByteArray()[B

    move-result-object v13

    .line 134
    array-length v14, v13

    add-int/2addr v10, v14

    .line 135
    invoke-static {v11}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v14

    invoke-virtual {v6, v14, v13}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 136
    invoke-virtual {v12}, Lcom/genymobile/scrcpy/WebSocketConnection;->getVideoSettings()Lcom/genymobile/scrcpy/VideoSettings;

    move-result-object v12

    invoke-virtual {v12}, Lcom/genymobile/scrcpy/VideoSettings;->toByteArray()[B

    move-result-object v12

    .line 137
    array-length v13, v12

    add-int/2addr v10, v13

    .line 138
    invoke-static {v11}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v11

    invoke-virtual {v5, v11, v12}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 123
    :cond_8a
    add-int/lit8 v9, v9, 0x1

    goto :goto_2b

    .line 141
    :cond_8d
    invoke-static {}, Lcom/genymobile/scrcpy/ScreenEncoder;->listEncoders()[Landroid/media/MediaCodecInfo;

    move-result-object v7

    .line 142
    new-instance v9, Ljava/util/ArrayList;

    invoke-direct {v9}, Ljava/util/ArrayList;-><init>()V

    .line 143
    if-eqz v7, :cond_b7

    array-length v11, v7

    if-lez v11, :cond_b7

    .line 144
    add-int/lit8 v10, v10, 0x4

    .line 145
    array-length v11, v7

    const/4 v12, 0x0

    :goto_9f
    if-ge v12, v11, :cond_b7

    aget-object v13, v7, v12

    .line 146
    invoke-virtual {v13}, Landroid/media/MediaCodecInfo;->getName()Ljava/lang/String;

    move-result-object v13

    sget-object v14, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v13, v14}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v13

    .line 147
    array-length v14, v13

    add-int/lit8 v14, v14, 0x4

    add-int/2addr v10, v14

    .line 148
    invoke-virtual {v9, v13}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    .line 145
    add-int/lit8 v12, v12, 0x1

    goto :goto_9f

    .line 151
    :cond_b7
    add-int/2addr v0, v10

    new-array v0, v0, [B

    invoke-static {v0}, Ljava/nio/ByteBuffer;->wrap([B)Ljava/nio/ByteBuffer;

    move-result-object v0

    .line 152
    sget-object v7, Lcom/genymobile/scrcpy/WebSocketConnection;->MAGIC_BYTES_INITIAL:[B

    invoke-virtual {v0, v7}, Ljava/nio/ByteBuffer;->put([B)Ljava/nio/ByteBuffer;

    .line 153
    sget-object v7, Lcom/genymobile/scrcpy/WebSocketConnection;->DEVICE_NAME_BYTES:[B

    .line 154
    const/16 v10, 0x3f

    array-length v11, v7

    invoke-static {v10, v11}, Ljava/lang/Math;->min(II)I

    move-result v10

    invoke-virtual {v0, v7, v8, v10}, Ljava/nio/ByteBuffer;->put([BII)Ljava/nio/ByteBuffer;

    .line 155
    sget-object v7, Lcom/genymobile/scrcpy/WebSocketConnection;->MAGIC_BYTES_INITIAL:[B

    array-length v7, v7

    add-int/lit8 v7, v7, 0x40

    invoke-virtual {v0, v7}, Ljava/nio/ByteBuffer;->position(I)Ljava/nio/Buffer;

    .line 156
    array-length v1, v1

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 157
    invoke-virtual {v2}, Ljava/util/HashMap;->values()Ljava/util/Collection;

    move-result-object v1

    invoke-interface {v1}, Ljava/util/Collection;->iterator()Ljava/util/Iterator;

    move-result-object v1

    .line 158
    :goto_e3
    invoke-interface {v1}, Ljava/util/Iterator;->hasNext()Z

    move-result v2

    if-eqz v2, :cond_167

    .line 159
    invoke-interface {v1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/genymobile/scrcpy/DisplayInfo;

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/DisplayInfo;->getDisplayId()I

    move-result v2

    .line 160
    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v7

    invoke-virtual {v4, v7}, Ljava/util/HashMap;->containsKey(Ljava/lang/Object;)Z

    move-result v7

    if-eqz v7, :cond_10a

    .line 161
    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v7

    invoke-virtual {v4, v7}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v7

    check-cast v7, [B

    invoke-virtual {v0, v7}, Ljava/nio/ByteBuffer;->put([B)Ljava/nio/ByteBuffer;

    .line 163
    :cond_10a
    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v7

    invoke-virtual {v3, v7}, Ljava/util/HashMap;->containsKey(Ljava/lang/Object;)Z

    move-result v7

    if-eqz v7, :cond_123

    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v7

    invoke-virtual {v3, v7}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v7

    check-cast v7, Ljava/lang/Integer;

    invoke-virtual {v7}, Ljava/lang/Integer;->intValue()I

    move-result v7

    goto :goto_124

    :cond_123
    const/4 v7, 0x0

    :goto_124
    invoke-virtual {v0, v7}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 164
    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v7

    invoke-virtual {v6, v7}, Ljava/util/HashMap;->containsKey(Ljava/lang/Object;)Z

    move-result v7

    if-eqz v7, :cond_143

    .line 165
    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v7

    invoke-virtual {v6, v7}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v7

    check-cast v7, [B

    .line 166
    array-length v10, v7

    invoke-virtual {v0, v10}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 167
    invoke-virtual {v0, v7}, Ljava/nio/ByteBuffer;->put([B)Ljava/nio/ByteBuffer;

    .line 168
    goto :goto_146

    .line 169
    :cond_143
    invoke-virtual {v0, v8}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 171
    :goto_146
    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v7

    invoke-virtual {v5, v7}, Ljava/util/HashMap;->containsKey(Ljava/lang/Object;)Z

    move-result v7

    if-eqz v7, :cond_162

    .line 172
    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v2

    invoke-virtual {v5, v2}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, [B

    .line 173
    array-length v7, v2

    invoke-virtual {v0, v7}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 174
    invoke-virtual {v0, v2}, Ljava/nio/ByteBuffer;->put([B)Ljava/nio/ByteBuffer;

    .line 175
    goto :goto_165

    .line 176
    :cond_162
    invoke-virtual {v0, v8}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 178
    :goto_165
    goto/16 :goto_e3

    .line 179
    :cond_167
    invoke-virtual {v9}, Ljava/util/ArrayList;->size()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 180
    invoke-virtual {v9}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object v1

    :goto_172
    invoke-interface {v1}, Ljava/util/Iterator;->hasNext()Z

    move-result v2

    if-eqz v2, :cond_186

    invoke-interface {v1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, [B

    .line 181
    array-length v3, v2

    invoke-virtual {v0, v3}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 182
    invoke-virtual {v0, v2}, Ljava/nio/ByteBuffer;->put([B)Ljava/nio/ByteBuffer;

    .line 183
    goto :goto_172

    .line 184
    :cond_186
    return-object v0
.end method

.method private release()V
    .registers 2

    .line 194
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/VideoSettings;->getDisplayId()I

    move-result v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/WSServer;->releaseConnectionForDisplay(I)V

    .line 195
    return-void
.end method

.method public static sendInitialInfo(Ljava/nio/ByteBuffer;Lorg/java_websocket/WebSocket;I)V
    .registers 4

    .line 86
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->capacity()I

    move-result v0

    add-int/lit8 v0, v0, -0x4

    invoke-virtual {p0, v0}, Ljava/nio/ByteBuffer;->position(I)Ljava/nio/Buffer;

    .line 87
    invoke-virtual {p0, p2}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 88
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->rewind()Ljava/nio/Buffer;

    .line 89
    invoke-interface {p1, p0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 90
    return-void
.end method


# virtual methods
.method public close()V
    .registers 1
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    .line 24
    return-void
.end method

.method public getController()Lcom/genymobile/scrcpy/Controller;
    .registers 2

    .line 107
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->controller:Lcom/genymobile/scrcpy/Controller;

    return-object v0
.end method

.method public getDevice()Lcom/genymobile/scrcpy/Device;
    .registers 2

    .line 111
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->device:Lcom/genymobile/scrcpy/Device;

    return-object v0
.end method

.method public getVideoSettings()Lcom/genymobile/scrcpy/VideoSettings;
    .registers 2

    .line 103
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    return-object v0
.end method

.method public hasConnections()Z
    .registers 2

    .line 99
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->sockets:Ljava/util/HashSet;

    invoke-virtual {v0}, Ljava/util/HashSet;->size()I

    move-result v0

    if-lez v0, :cond_a

    const/4 v0, 0x1

    goto :goto_b

    :cond_a
    const/4 v0, 0x0

    :goto_b
    return v0
.end method

.method public join(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/VideoSettings;)V
    .registers 4

    .line 33
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->sockets:Ljava/util/HashSet;

    invoke-virtual {v0, p1}, Ljava/util/HashSet;->add(Ljava/lang/Object;)Z

    .line 34
    invoke-virtual {p0, p2}, Lcom/genymobile/scrcpy/WebSocketConnection;->setVideoSettings(Lcom/genymobile/scrcpy/VideoSettings;)Z

    move-result p1

    .line 35
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->wsServer:Lcom/genymobile/scrcpy/WSServer;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/WSServer;->sendInitialInfoToAll()V

    .line 36
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->isScreenOn()Z

    move-result v0

    if-nez v0, :cond_19

    .line 37
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->controller:Lcom/genymobile/scrcpy/Controller;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Controller;->turnScreenOn()V

    .line 39
    :cond_19
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->screenEncoder:Lcom/genymobile/scrcpy/ScreenEncoder;

    .line 40
    if-eqz v0, :cond_32

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenEncoder;->isAlive()Z

    move-result v0

    if-nez v0, :cond_24

    goto :goto_32

    .line 48
    :cond_24
    if-nez p1, :cond_31

    iget-object p1, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->streamInvalidateListener:Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;

    if-nez p1, :cond_2b

    goto :goto_31

    .line 51
    :cond_2b
    iget-object p1, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->streamInvalidateListener:Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;

    invoke-interface {p1}, Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;->onStreamInvalidate()V

    .line 52
    return-void

    .line 49
    :cond_31
    :goto_31
    return-void

    .line 41
    :cond_32
    :goto_32
    const-string p1, "First connection. Start new encoder."

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 42
    iget-object p1, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {p1, p0}, Lcom/genymobile/scrcpy/Device;->setRotationListener(Lcom/genymobile/scrcpy/Device$RotationListener;)V

    .line 43
    new-instance p1, Lcom/genymobile/scrcpy/ScreenEncoder;

    invoke-direct {p1, p2}, Lcom/genymobile/scrcpy/ScreenEncoder;-><init>(Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 44
    iput-object p1, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->screenEncoder:Lcom/genymobile/scrcpy/ScreenEncoder;

    .line 45
    iget-object p2, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {p1, p2, p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->start(Lcom/genymobile/scrcpy/Device;Lcom/genymobile/scrcpy/Connection;)V

    .line 46
    return-void
.end method

.method public leave(Lorg/java_websocket/WebSocket;)V
    .registers 3

    .line 55
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->sockets:Ljava/util/HashSet;

    invoke-virtual {v0, p1}, Ljava/util/HashSet;->remove(Ljava/lang/Object;)Z

    .line 56
    iget-object p1, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->sockets:Ljava/util/HashSet;

    invoke-virtual {p1}, Ljava/util/HashSet;->isEmpty()Z

    move-result p1

    if-eqz p1, :cond_15

    .line 57
    const-string p1, "Last client has left"

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 58
    invoke-direct {p0}, Lcom/genymobile/scrcpy/WebSocketConnection;->release()V

    .line 60
    :cond_15
    iget-object p1, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->wsServer:Lcom/genymobile/scrcpy/WSServer;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/WSServer;->sendInitialInfoToAll()V

    .line 61
    return-void
.end method

.method public onRotationChanged(I)V
    .registers 2

    .line 189
    invoke-super {p0, p1}, Lcom/genymobile/scrcpy/Connection;->onRotationChanged(I)V

    .line 190
    iget-object p1, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->wsServer:Lcom/genymobile/scrcpy/WSServer;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/WSServer;->sendInitialInfoToAll()V

    .line 191
    return-void
.end method

.method send(Ljava/nio/ByteBuffer;)V
    .registers 7

    .line 72
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->sockets:Ljava/util/HashSet;

    invoke-virtual {v0}, Ljava/util/HashSet;->isEmpty()Z

    move-result v0

    if-eqz v0, :cond_9

    .line 73
    return-void

    .line 75
    :cond_9
    iget-object v0, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->sockets:Ljava/util/HashSet;

    monitor-enter v0

    .line 76
    :try_start_c
    iget-object v1, p0, Lcom/genymobile/scrcpy/WebSocketConnection;->sockets:Ljava/util/HashSet;

    invoke-virtual {v1}, Ljava/util/HashSet;->iterator()Ljava/util/Iterator;

    move-result-object v1

    :goto_12
    invoke-interface {v1}, Ljava/util/Iterator;->hasNext()Z

    move-result v2

    if-eqz v2, :cond_30

    invoke-interface {v1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lorg/java_websocket/WebSocket;

    .line 77
    invoke-interface {v2}, Lorg/java_websocket/WebSocket;->getAttachment()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Lcom/genymobile/scrcpy/WSServer$SocketInfo;

    .line 78
    invoke-interface {v2}, Lorg/java_websocket/WebSocket;->isOpen()Z

    move-result v4

    if-eqz v4, :cond_2f

    if-eqz v3, :cond_2f

    .line 79
    invoke-interface {v2, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 81
    :cond_2f
    goto :goto_12

    .line 82
    :cond_30
    monitor-exit v0

    .line 83
    return-void

    .line 82
    :catchall_32
    move-exception p1

    monitor-exit v0
    :try_end_34
    .catchall {:try_start_c .. :try_end_34} :catchall_32

    throw p1
.end method

.method public sendDeviceMessage(Lcom/genymobile/scrcpy/DeviceMessage;)V
    .registers 2

    .line 94
    invoke-static {p1}, Lcom/genymobile/scrcpy/WebSocketConnection;->deviceMessageToByteBuffer(Lcom/genymobile/scrcpy/DeviceMessage;)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/WebSocketConnection;->send(Ljava/nio/ByteBuffer;)V

    .line 95
    return-void
.end method
