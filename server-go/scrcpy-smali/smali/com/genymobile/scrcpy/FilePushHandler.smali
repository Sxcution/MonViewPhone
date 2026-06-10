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
    .locals 0

    .line 30
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method public static cancelAllForConnection(Lorg/java_websocket/WebSocket;)V
    .locals 0

    .line 222
    invoke-static {p0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->releaseByConnection(Lorg/java_websocket/WebSocket;)V

    return-void
.end method

.method private static checkPushId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;
    .locals 2

    .line 112
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result p1

    .line 113
    invoke-static {p1}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->getInstance(S)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    move-result-object v0

    if-nez v0, :cond_0

    const/16 v1, -0x9

    .line 115
    invoke-static {p1, v1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    :cond_0
    return-object v0
.end method

.method private static handleAppend(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V
    .locals 3

    .line 173
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->checkPushId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    move-result-object v0

    if-nez v0, :cond_0

    return-void

    .line 177
    :cond_0
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result v1

    .line 179
    :try_start_0
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushChunk()[B

    move-result-object v2

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushChunkSize()I

    move-result p1

    invoke-virtual {v0, v2, p1}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->write([BI)V

    const/4 p1, 0x0

    .line 180
    invoke-static {v1, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    const/4 p1, -0x6

    .line 182
    invoke-static {v1, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    .line 184
    :try_start_1
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->release()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_1

    goto :goto_0

    .line 186
    :catch_1
    new-instance p0, Ljava/lang/StringBuilder;

    invoke-direct {p0}, Ljava/lang/StringBuilder;-><init>()V

    const-string p1, "Failed to release stream for file: \""

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->getFileName()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p1, "\""

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    :goto_0
    return-void
.end method

.method private static handleCancel(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V
    .locals 1

    .line 208
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->checkPushId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    move-result-object v0

    if-nez v0, :cond_0

    return-void

    .line 212
    :cond_0
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result p1

    .line 214
    :try_start_0
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->release()V

    const/4 v0, 0x0

    .line 215
    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object v0

    invoke-interface {p0, v0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    const/4 v0, -0x6

    .line 217
    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    :goto_0
    return-void
.end method

.method private static handleFinish(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V
    .locals 2

    .line 191
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->checkPushId(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    move-result-object v0

    if-nez v0, :cond_0

    return-void

    .line 195
    :cond_0
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result p1

    .line 196
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->isComplete()Z

    move-result v1

    if-eqz v1, :cond_1

    .line 198
    :try_start_0
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->release()V

    const/4 v0, 0x0

    .line 199
    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object v0

    invoke-interface {p0, v0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    const/4 v0, -0x6

    .line 201
    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    goto :goto_0

    :cond_1
    const/16 v0, -0xb

    .line 204
    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    :goto_0
    return-void
.end method

.method private static handleNew(Lorg/java_websocket/WebSocket;)V
    .locals 2

    .line 121
    invoke-static {}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->getNextPushId()S

    move-result v0

    const/4 v1, -0x1

    if-ne v0, v1, :cond_0

    const/16 v1, -0xa

    .line 123
    invoke-static {v0, v1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object v0

    invoke-interface {p0, v0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    goto :goto_0

    :cond_0
    const/4 v1, 0x1

    .line 125
    invoke-static {v0, v1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object v0

    invoke-interface {p0, v0}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    :goto_0
    return-void
.end method

.method public static handlePush(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V
    .locals 2

    .line 226
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushState()I

    move-result v0

    if-eqz v0, :cond_4

    const/4 v1, 0x1

    if-eq v0, v1, :cond_3

    const/4 v1, 0x2

    if-eq v0, v1, :cond_2

    const/4 v1, 0x3

    if-eq v0, v1, :cond_1

    const/4 v1, 0x4

    if-eq v0, v1, :cond_0

    .line 244
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result p1

    const/4 v0, -0x8

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    goto :goto_0

    .line 241
    :cond_0
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->handleCancel(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V

    goto :goto_0

    .line 238
    :cond_1
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->handleFinish(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V

    goto :goto_0

    .line 232
    :cond_2
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->handleAppend(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V

    goto :goto_0

    .line 235
    :cond_3
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->handleStart(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V

    goto :goto_0

    .line 229
    :cond_4
    invoke-static {p0}, Lcom/genymobile/scrcpy/FilePushHandler;->handleNew(Lorg/java_websocket/WebSocket;)V

    :goto_0
    return-void
.end method

.method private static handleStart(Lorg/java_websocket/WebSocket;Lcom/genymobile/scrcpy/ControlMessage;)V
    .locals 8

    .line 129
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPushId()S

    move-result v7

    .line 130
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getFileName()Ljava/lang/String;

    move-result-object v4

    .line 131
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getFileSize()I

    move-result p1

    .line 132
    invoke-static {v4}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->getInstance(Ljava/lang/String;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    move-result-object v0

    if-eqz v0, :cond_0

    const/4 p1, -0x7

    .line 133
    invoke-static {v7, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    return-void

    :cond_0
    const-string v0, "/"

    .line 136
    invoke-virtual {v4, v0}, Ljava/lang/String;->contains(Ljava/lang/CharSequence;)Z

    move-result v0

    if-eqz v0, :cond_1

    const/4 p1, -0x1

    .line 137
    invoke-static {v7, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    return-void

    .line 140
    :cond_1
    new-instance v0, Ljava/io/File;

    const-string v1, "/data/local/tmp"

    invoke-direct {v0, v1, v4}, Ljava/io/File;-><init>(Ljava/lang/String;Ljava/lang/String;)V

    .line 149
    :try_start_0
    invoke-virtual {v0}, Ljava/io/File;->createNewFile()Z

    move-result v1

    if-nez v1, :cond_2

    .line 150
    invoke-virtual {v0}, Ljava/io/File;->delete()Z

    move-result v1

    if-nez v1, :cond_2

    const/4 p1, -0x3

    .line 151
    invoke-static {v7, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1

    return-void

    .line 162
    :cond_2
    :try_start_1
    new-instance v5, Ljava/io/FileOutputStream;

    invoke-direct {v5, v0}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    :try_end_1
    .catch Ljava/io/FileNotFoundException; {:try_start_1 .. :try_end_1} :catch_0

    .line 168
    new-instance v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    int-to-long v2, p1

    move v1, v7

    move-object v6, p0

    invoke-direct/range {v0 .. v6}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;-><init>(SJLjava/lang/String;Ljava/io/FileOutputStream;Lorg/java_websocket/WebSocket;)V

    const/4 p1, 0x0

    .line 169
    invoke-static {v7, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    return-void

    :catch_0
    const/4 p1, -0x5

    .line 164
    invoke-static {v7, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    return-void

    :catch_1
    const/4 p1, -0x4

    .line 156
    invoke-static {v7, p1}, Lcom/genymobile/scrcpy/FilePushHandler;->pushFilePushResponse(SI)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-interface {p0, p1}, Lorg/java_websocket/WebSocket;->send(Ljava/nio/ByteBuffer;)V

    return-void
.end method

.method private static pushFilePushResponse(SI)Ljava/nio/ByteBuffer;
    .locals 0

    .line 107
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/DeviceMessage;->createPushResponse(SI)Lcom/genymobile/scrcpy/DeviceMessage;

    move-result-object p0

    .line 108
    invoke-static {p0}, Lcom/genymobile/scrcpy/WebSocketConnection;->deviceMessageToByteBuffer(Lcom/genymobile/scrcpy/DeviceMessage;)Ljava/nio/ByteBuffer;

    move-result-object p0

    return-object p0
.end method
