.class public final Lcom/genymobile/scrcpy/FilePushHandler;
.super Ljava/lang/Object;
.source "FilePushHandler.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/genymobile/scrcpy/FilePushHandler$FilePush;
    }
.end annotation


# static fields
.field private static final ERROR_FAILED_TO_CREATE:I = -0x4

.field private static final ERROR_FAILED_TO_DELETE:I = -0x3

.field private static final ERROR_FAILED_TO_WRITE:I = -0x6

.field private static final ERROR_FILE_IS_BUSY:I = -0x7

.field private static final ERROR_FILE_NOT_FOUND:I = -0x5

.field private static final ERROR_INCORRECT_SIZE:I = -0xb

.field private static final ERROR_INVALID_NAME:I = -0x1

.field private static final ERROR_INVALID_STATE:I = -0x8

.field private static final ERROR_NO_FREE_ID:I = -0xa

.field private static final ERROR_NO_SPACE:I = -0x2

.field private static final ERROR_UNKNOWN_ID:I = -0x9

.field private static final NEW_PUSH_ID:I = 0x1

.field private static final NO_ERROR:I = 0x0

.field private static final PUSH_PATH:Ljava/lang/String; = "/data/local/tmp"


# direct methods
.method private constructor <init>()V
    .registers 1

    .line 29
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 30
    return-void
.end method

.method public static cancelAllForConnection(Lorg/java_websocket/WebSocket;)V
    .registers 1

    .line 218
    invoke-static {p0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->releaseByConnection(Lorg/java_websocket/WebSocket;)V

    .line 219
    return-void
.end method

.method private static checkPushId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;
    .registers 4

    .line 119
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result p1

    .line 120
    invoke-static {p1}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->getInstance(S)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    move-result-object v0

    .line 121
    if-nez v0, :cond_13

    .line 122
    const/16 v1, -0x9

    invoke-static {p1, v1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 124
    :cond_13
    return-object v0
.end method

.method private static handleAppend(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V
    .registers 5

    .line 166
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->checkPushId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    move-result-object v0

    .line 167
    if-nez v0, :cond_7

    .line 168
    return-void

    .line 170
    :cond_7
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result v1

    .line 172
    :try_start_b
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushChunk()[B

    move-result-object v2

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushChunkSize()I

    move-result p1

    invoke-virtual {v0, v2, p1}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->write([BI)V

    .line 173
    const/4 p1, 0x0

    invoke-static {v1, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V
    :try_end_1e
    .catch Ljava/io/IOException; {:try_start_b .. :try_end_1e} :catch_1f

    .line 181
    goto :goto_4d

    .line 174
    :catch_1f
    move-exception p1

    .line 175
    const/4 p1, -0x6

    invoke-static {v1, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 177
    :try_start_28
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->release()V
    :try_end_2b
    .catch Ljava/io/IOException; {:try_start_28 .. :try_end_2b} :catch_2c

    .line 180
    goto :goto_4d

    .line 178
    :catch_2c
    move-exception p0

    .line 179
    new-instance p0, Ljava/lang/StringBuilder;

    invoke-direct {p0}, Ljava/lang/StringBuilder;-><init>()V

    const-string p1, "Failed to release stream for file: \""

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->getFileName()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string p1, "\""

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 182
    :goto_4d
    return-void
.end method

.method private static handleCancel(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V
    .registers 3

    .line 204
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->checkPushId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    move-result-object v0

    .line 205
    if-nez v0, :cond_7

    .line 206
    return-void

    .line 208
    :cond_7
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result p1

    .line 210
    :try_start_b
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->release()V

    .line 211
    const/4 v0, 0x0

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object v0

    invoke-interface {p0, v0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V
    :try_end_16
    .catch Ljava/io/IOException; {:try_start_b .. :try_end_16} :catch_17

    .line 214
    goto :goto_20

    .line 212
    :catch_17
    move-exception v0

    .line 213
    const/4 v0, -0x6

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 215
    :goto_20
    return-void
.end method

.method private static handleFinish(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V
    .registers 4

    .line 185
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->checkPushId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    move-result-object v0

    .line 186
    if-nez v0, :cond_7

    .line 187
    return-void

    .line 189
    :cond_7
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result p1

    .line 190
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->isComplete()Z

    move-result v1

    if-eqz v1, :cond_27

    .line 192
    :try_start_11
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->release()V

    .line 193
    const/4 v0, 0x0

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object v0

    invoke-interface {p0, v0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V
    :try_end_1c
    .catch Ljava/io/IOException; {:try_start_11 .. :try_end_1c} :catch_1d

    .line 194
    return-void

    .line 195
    :catch_1d
    move-exception v0

    .line 196
    const/4 v0, -0x6

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 197
    return-void

    .line 200
    :cond_27
    const/16 v0, -0xb

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 201
    return-void
.end method

.method private static handleNew(Lorg/java_websocket/WebSocket;)V
    .registers 3

    .line 128
    invoke-static {}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->getNextPushId()S

    move-result v0

    .line 129
    const/4 v1, -0x1

    if-ne v0, v1, :cond_11

    .line 130
    const/16 v1, -0xa

    invoke-static {v0, v1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object v0

    invoke-interface {p0, v0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    goto :goto_19

    .line 132
    :cond_11
    const/4 v1, 0x1

    invoke-static {v0, v1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object v0

    invoke-interface {p0, v0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 134
    :goto_19
    return-void
.end method

.method public static handlePush(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V
    .registers 4

    .line 222
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushState()I

    move-result v0

    .line 223
    if-nez v0, :cond_a

    .line 224
    invoke-static {p0}, Lcom/genymobile/scrcpy/FilePushHandler;->handleNew(Lorg/java_websocket/WebSocket;)V

    .line 225
    return-void

    .line 227
    :cond_a
    const/4 v1, 0x1

    if-ne v0, v1, :cond_11

    .line 228
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->handleStart(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V

    .line 229
    return-void

    .line 231
    :cond_11
    const/4 v1, 0x2

    if-ne v0, v1, :cond_18

    .line 232
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->handleAppend(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V

    .line 233
    return-void

    .line 235
    :cond_18
    const/4 v1, 0x3

    if-ne v0, v1, :cond_1f

    .line 236
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->handleFinish(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V

    goto :goto_32

    .line 237
    :cond_1f
    const/4 v1, 0x4

    if-ne v0, v1, :cond_26

    .line 238
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->handleCancel(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V

    goto :goto_32

    .line 240
    :cond_26
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result p1

    const/4 v0, -0x8

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 242
    :goto_32
    return-void
.end method

.method private static handleStart(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V
    .registers 9

    .line 137
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result v1

    .line 138
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getFileName()Ljava/lang/String;

    move-result-object v4

    .line 139
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getFileSize()I

    move-result p1

    .line 140
    invoke-static {v4}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->getInstance(Ljava/lang/String;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    move-result-object v0

    if-eqz v0, :cond_1b

    .line 141
    const/4 p1, -0x7

    invoke-static {v1, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 142
    return-void

    .line 144
    :cond_1b
    const-string v0, "/"

    invoke-virtual {v4, v0}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v0

    if-eqz v0, :cond_2c

    .line 145
    const/4 p1, -0x1

    invoke-static {v1, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 146
    return-void

    .line 148
    :cond_2c
    new-instance v0, Ljava/io/File;

    const-string v2, "/data/local/tmp"

    invoke-direct {v0, v2, v4}, Ljava/io/File;-><init>(Ljava/lang/String;Ljava/lang/String;)V

    .line 150
    :try_start_33
    invoke-virtual {v0}, Ljava/io/File;->createNewFile()Z

    move-result v2

    if-nez v2, :cond_48

    invoke-virtual {v0}, Ljava/io/File;->delete()Z

    move-result v2

    if-nez v2, :cond_48

    .line 151
    const/4 p1, -0x3

    invoke-static {v1, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V
    :try_end_47
    .catch Ljava/io/IOException; {:try_start_33 .. :try_end_47} :catch_6f

    .line 152
    return-void

    .line 155
    :cond_48
    move-object v2, v0

    :try_start_49
    new-instance v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    int-to-long v5, p1

    move-object p1, v2

    move-wide v2, v5

    new-instance v5, Ljava/io/FileOutputStream;

    invoke-direct {v5, p1}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    :try_end_53
    .catch Ljava/io/FileNotFoundException; {:try_start_49 .. :try_end_53} :catch_62
    .catch Ljava/io/IOException; {:try_start_49 .. :try_end_53} :catch_6f

    move-object v6, p0

    :try_start_54
    invoke-direct/range {v0 .. v6}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;-><init>(SJLjava/lang/String;Ljava/io/FileOutputStream;Lorg/java_websocket/WebSocket;)V

    .line 156
    const/4 p0, 0x0

    invoke-static {v1, p0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p0

    invoke-interface {v6, p0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V
    :try_end_5f
    .catch Ljava/io/FileNotFoundException; {:try_start_54 .. :try_end_5f} :catch_60
    .catch Ljava/io/IOException; {:try_start_54 .. :try_end_5f} :catch_6d

    .line 159
    goto :goto_6c

    .line 157
    :catch_60
    move-exception v0

    goto :goto_64

    :catch_62
    move-exception v0

    move-object v6, p0

    .line 158
    :goto_64
    const/4 p0, -0x5

    :try_start_65
    invoke-static {v1, p0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p0

    invoke-interface {v6, p0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V
    :try_end_6c
    .catch Ljava/io/IOException; {:try_start_65 .. :try_end_6c} :catch_6d

    .line 162
    :goto_6c
    goto :goto_79

    .line 160
    :catch_6d
    move-exception v0

    goto :goto_71

    :catch_6f
    move-exception v0

    move-object v6, p0

    .line 161
    :goto_71
    const/4 p0, -0x4

    invoke-static {v1, p0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p0

    invoke-interface {v6, p0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 163
    :goto_79
    return-void
.end method

.method private static pushFilePushResponse(SI)Ljava/nio/ByteBuffer;
    .registers 2

    .line 115
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/DeviceMessage;->createPushResponse(SI)Lcom/genymobile/scrcpy/DeviceMessage;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/WebSocketConnection;->deviceMessageToByteBuffer(Lcom/genymobile/scrcpy/DeviceMessage;)Ljava/nio/ByteBuffer;

    move-result-object p0

    return-object p0
.end method
