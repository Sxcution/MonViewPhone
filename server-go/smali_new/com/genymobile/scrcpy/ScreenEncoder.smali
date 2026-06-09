.class public Lcom/genymobile/scrcpy/ScreenEncoder;
.super Ljava/lang/Object;
.source "ScreenEncoder.java"

# interfaces
.implements Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;
.implements Ljava/lang/Runnable;


# static fields
.field private static final DEFAULT_I_FRAME_INTERVAL:I = 0xa

.field private static final KEY_MAX_FPS_TO_ENCODER:Ljava/lang/String; = "max-fps-to-encoder"

.field private static final NO_PTS:I = -0x1

.field private static final REPEAT_FRAME_DELAY_US:I = 0x186a0


# instance fields
.field private connection:Lcom/genymobile/scrcpy/Connection;

.field private device:Lcom/genymobile/scrcpy/Device;

.field private display:Landroid/os/IBinder;

.field private format:Landroid/media/MediaFormat;

.field private final headerBuffer:Ljava/nio/ByteBuffer;

.field private ptsOrigin:J

.field private selectorThread:Ljava/lang/Thread;

.field private final streamIsInvalide:Ljava/util/concurrent/atomic/AtomicBoolean;

.field private timeout:I

.field private videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

.field private virtualDisplay:Landroid/hardware/display/VirtualDisplay;


# direct methods
.method public constructor <init>(Lcom/genymobile/scrcpy/VideoSettings;)V
    .registers 3

    .line 42
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 38
    new-instance v0, Ljava/util/concurrent/atomic/AtomicBoolean;

    invoke-direct {v0}, Ljava/util/concurrent/atomic/AtomicBoolean;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->streamIsInvalide:Ljava/util/concurrent/atomic/AtomicBoolean;

    .line 39
    const/16 v0, 0xc

    invoke-static {v0}, Ljava/nio/ByteBuffer;->allocate(I)Ljava/nio/ByteBuffer;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->headerBuffer:Ljava/nio/ByteBuffer;

    .line 40
    const/4 v0, -0x1

    iput v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->timeout:I

    .line 43
    iput-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    .line 44
    invoke-direct {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->updateFormat()V

    .line 45
    return-void
.end method

.method private static configure(Landroid/media/MediaCodec;Landroid/media/MediaFormat;)V
    .registers 4

    .line 283
    const/4 v0, 0x0

    move-object v1, v0

    check-cast v1, Landroid/view/Surface;

    move-object v1, v0

    check-cast v1, Landroid/media/MediaCrypto;

    const/4 v1, 0x1

    invoke-virtual {p0, p1, v0, v0, v1}, Landroid/media/MediaCodec;->configure(Landroid/media/MediaFormat;Landroid/view/Surface;Landroid/media/MediaCrypto;I)V

    .line 284
    return-void
.end method

.method private static createCodec(Ljava/lang/String;)Landroid/media/MediaCodec;
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 226
    const-string v0, "\'"

    if-eqz p0, :cond_2e

    .line 227
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Creating encoder by name: \'"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 229
    :try_start_1e
    invoke-static {p0}, Landroid/media/MediaCodec;->createByCodecName(Ljava/lang/String;)Landroid/media/MediaCodec;

    move-result-object p0
    :try_end_22
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1e .. :try_end_22} :catch_23

    return-object p0

    .line 230
    :catch_23
    move-exception v0

    .line 231
    new-instance v0, Lcom/genymobile/scrcpy/InvalidEncoderException;

    invoke-static {}, Lcom/genymobile/scrcpy/ScreenEncoder;->listEncoders()[Landroid/media/MediaCodecInfo;

    move-result-object v1

    invoke-direct {v0, p0, v1}, Lcom/genymobile/scrcpy/InvalidEncoderException;-><init>(Ljava/lang/String;[Landroid/media/MediaCodecInfo;)V

    throw v0

    .line 234
    :cond_2e
    const-string p0, "video/avc"

    invoke-static {p0}, Landroid/media/MediaCodec;->createEncoderByType(Ljava/lang/String;)Landroid/media/MediaCodec;

    move-result-object p0

    .line 235
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Using encoder: \'"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {p0}, Landroid/media/MediaCodec;->getName()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 236
    return-object p0
.end method

.method private static createDisplay()Landroid/os/IBinder;
    .registers 2
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    .line 279
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x1e

    if-lt v0, v1, :cond_17

    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    if-ne v0, v1, :cond_15

    const-string v0, "S"

    sget-object v1, Landroid/os/Build$VERSION;->CODENAME:Ljava/lang/String;

    invoke-virtual {v0, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-nez v0, :cond_15

    goto :goto_17

    :cond_15
    const/4 v0, 0x0

    goto :goto_18

    :cond_17
    :goto_17
    const/4 v0, 0x1

    :goto_18
    const-string v1, "scrcpy"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->createDisplay(Ljava/lang/String;Z)Landroid/os/IBinder;

    move-result-object v0

    return-object v0
.end method

.method private static createFormat(Lcom/genymobile/scrcpy/VideoSettings;)Landroid/media/MediaFormat;
    .registers 7

    .line 255
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/VideoSettings;->getBitRate()I

    move-result v0

    .line 256
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/VideoSettings;->getMaxFps()I

    move-result v1

    .line 257
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/VideoSettings;->getIFrameInterval()I

    move-result v2

    .line 258
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/VideoSettings;->getCodecOptions()Ljava/util/List;

    move-result-object p0

    .line 259
    new-instance v3, Landroid/media/MediaFormat;

    invoke-direct {v3}, Landroid/media/MediaFormat;-><init>()V

    .line 260
    const-string v4, "mime"

    const-string v5, "video/avc"

    invoke-virtual {v3, v4, v5}, Landroid/media/MediaFormat;->setString(Ljava/lang/String;Ljava/lang/String;)V

    .line 261
    const-string v4, "bitrate"

    invoke-virtual {v3, v4, v0}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    .line 262
    const-string v0, "frame-rate"

    const/16 v4, 0x3c

    invoke-virtual {v3, v0, v4}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    .line 263
    const-string v0, "color-format"

    const v4, 0x7f000789

    invoke-virtual {v3, v0, v4}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    .line 264
    const-string v0, "i-frame-interval"

    invoke-virtual {v3, v0, v2}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    .line 265
    const-string v0, "repeat-previous-frame-after"

    const-wide/32 v4, 0x186a0

    invoke-virtual {v3, v0, v4, v5}, Landroid/media/MediaFormat;->setLong(Ljava/lang/String;J)V

    .line 266
    if-lez v1, :cond_45

    .line 267
    const-string v0, "max-fps-to-encoder"

    int-to-float v1, v1

    invoke-virtual {v3, v0, v1}, Landroid/media/MediaFormat;->setFloat(Ljava/lang/String;F)V

    .line 269
    :cond_45
    if-eqz p0, :cond_5b

    .line 270
    invoke-interface {p0}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    move-result-object p0

    .line 271
    :goto_4b
    invoke-interface {p0}, Ljava/util/Iterator;->hasNext()Z

    move-result v0

    if-eqz v0, :cond_5b

    .line 272
    invoke-interface {p0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Lcom/genymobile/scrcpy/CodecOption;

    invoke-static {v3, v0}, Lcom/genymobile/scrcpy/ScreenEncoder;->setCodecOption(Landroid/media/MediaFormat;Lcom/genymobile/scrcpy/CodecOption;)V

    goto :goto_4b

    .line 275
    :cond_5b
    return-object v3
.end method

.method private static destroyDisplay(Landroid/os/IBinder;)V
    .registers 1

    .line 303
    invoke-static {p0}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->destroyDisplay(Landroid/os/IBinder;)V

    .line 304
    return-void
.end method

.method private encode(Landroid/media/MediaCodec;)Z
    .registers 8
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 165
    new-instance v0, Landroid/media/MediaCodec$BufferInfo;

    invoke-direct {v0}, Landroid/media/MediaCodec$BufferInfo;-><init>()V

    .line 166
    const/4 v1, 0x0

    const/4 v2, 0x0

    .line 168
    :goto_7
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->consumeStreamInvalidation()Z

    move-result v3

    const/4 v4, 0x1

    if-nez v3, :cond_5d

    if-nez v2, :cond_5d

    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v3}, Lcom/genymobile/scrcpy/Connection;->hasConnections()Z

    move-result v3

    if-nez v3, :cond_19

    .line 169
    goto :goto_5d

    .line 171
    :cond_19
    iget v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->timeout:I

    int-to-long v2, v2

    invoke-virtual {p1, v0, v2, v3}, Landroid/media/MediaCodec;->dequeueOutputBuffer(Landroid/media/MediaCodec$BufferInfo;J)I

    move-result v2

    .line 172
    iget v3, v0, Landroid/media/MediaCodec$BufferInfo;->flags:I

    and-int/lit8 v3, v3, 0x4

    if-eqz v3, :cond_27

    goto :goto_28

    :cond_27
    const/4 v4, 0x0

    .line 174
    :goto_28
    :try_start_28
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->consumeStreamInvalidation()Z

    move-result v3

    if-eqz v3, :cond_2f

    .line 175
    goto :goto_4f

    .line 177
    :cond_2f
    if-ltz v2, :cond_49

    .line 178
    invoke-virtual {p1, v2}, Landroid/media/MediaCodec;->getOutputBuffer(I)Ljava/nio/ByteBuffer;

    move-result-object v3

    .line 179
    iget-object v5, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v5}, Lcom/genymobile/scrcpy/VideoSettings;->getSendFrameMeta()Z

    move-result v5

    if-eqz v5, :cond_44

    .line 180
    invoke-virtual {v3}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v5

    invoke-direct {p0, v0, v5}, Lcom/genymobile/scrcpy/ScreenEncoder;->writeFrameMeta(Landroid/media/MediaCodec$BufferInfo;I)V

    .line 182
    :cond_44
    iget-object v5, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v5, v3}, Lcom/genymobile/scrcpy/Connection;->send(Ljava/nio/ByteBuffer;)V

    .line 184
    :cond_49
    if-ltz v2, :cond_4e

    .line 185
    invoke-virtual {p1, v2, v1}, Landroid/media/MediaCodec;->releaseOutputBuffer(IZ)V
    :try_end_4e
    .catchall {:try_start_28 .. :try_end_4e} :catchall_56

    .line 187
    :cond_4e
    nop

    .line 190
    :goto_4f
    if-ltz v2, :cond_54

    .line 191
    invoke-virtual {p1, v2, v1}, Landroid/media/MediaCodec;->releaseOutputBuffer(IZ)V

    .line 194
    :cond_54
    move v2, v4

    goto :goto_7

    .line 190
    :catchall_56
    move-exception v0

    if-ltz v2, :cond_5c

    .line 191
    invoke-virtual {p1, v2, v1}, Landroid/media/MediaCodec;->releaseOutputBuffer(IZ)V

    .line 193
    :cond_5c
    throw v0

    .line 195
    :cond_5d
    :goto_5d
    if-nez v2, :cond_68

    iget-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Connection;->hasConnections()Z

    move-result p1

    if-eqz p1, :cond_68

    const/4 v1, 0x1

    :cond_68
    return v1
.end method

.method private internalStreamScreen()V
    .registers 16
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 105
    invoke-direct {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->updateFormat()V

    .line 106
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v0, p0}, Lcom/genymobile/scrcpy/Connection;->setStreamInvalidateListener(Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;)V

    .line 109
    :cond_8
    const/4 v1, 0x0

    :try_start_9
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/VideoSettings;->getEncoderName()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/ScreenEncoder;->createCodec(Ljava/lang/String;)Landroid/media/MediaCodec;

    move-result-object v2

    .line 110
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    if-eqz v0, :cond_1e

    .line 111
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    invoke-static {v0}, Lcom/genymobile/scrcpy/ScreenEncoder;->destroyDisplay(Landroid/os/IBinder;)V

    .line 112
    iput-object v1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    .line 114
    :cond_1e
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    if-eqz v0, :cond_29

    .line 115
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    invoke-virtual {v0}, Landroid/hardware/display/VirtualDisplay;->release()V

    .line 116
    iput-object v1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    .line 118
    :cond_29
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->getScreenInfo()Lcom/genymobile/scrcpy/ScreenInfo;

    move-result-object v0

    .line 119
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->getContentRect()Landroid/graphics/Rect;

    move-result-object v6

    .line 120
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->getVideoSize()Lcom/genymobile/scrcpy/Size;

    move-result-object v3

    invoke-virtual {v3}, Lcom/genymobile/scrcpy/Size;->toRect()Landroid/graphics/Rect;

    move-result-object v3

    .line 121
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->getUnlockedVideoSize()Lcom/genymobile/scrcpy/Size;

    move-result-object v4

    invoke-virtual {v4}, Lcom/genymobile/scrcpy/Size;->toRect()Landroid/graphics/Rect;

    move-result-object v7

    .line 122
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->getVideoRotation()I

    move-result v5

    .line 123
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->getLayerStack()I

    move-result v8

    .line 124
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->format:Landroid/media/MediaFormat;

    invoke-virtual {v3}, Landroid/graphics/Rect;->width()I

    move-result v4

    invoke-virtual {v3}, Landroid/graphics/Rect;->height()I

    move-result v9

    invoke-static {v0, v4, v9}, Lcom/genymobile/scrcpy/ScreenEncoder;->setSize(Landroid/media/MediaFormat;II)V

    .line 125
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->format:Landroid/media/MediaFormat;

    invoke-static {v2, v0}, Lcom/genymobile/scrcpy/ScreenEncoder;->configure(Landroid/media/MediaCodec;Landroid/media/MediaFormat;)V

    .line 126
    invoke-virtual {v2}, Landroid/media/MediaCodec;->createInputSurface()Landroid/view/Surface;

    move-result-object v4
    :try_end_63
    .catchall {:try_start_9 .. :try_end_63} :catchall_fe

    .line 128
    :try_start_63
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;-><init>()V

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getDisplayManager()Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    move-result-object v9

    const-string v10, "scrcpy"

    invoke-virtual {v3}, Landroid/graphics/Rect;->width()I

    move-result v11

    invoke-virtual {v3}, Landroid/graphics/Rect;->height()I

    move-result v12

    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->getDisplayId()I

    move-result v13
    :try_end_7c
    .catch Ljava/lang/Exception; {:try_start_63 .. :try_end_7c} :catch_8c
    .catchall {:try_start_63 .. :try_end_7c} :catchall_fe

    move-object v14, v4

    :try_start_7d
    invoke-virtual/range {v9 .. v14}, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->createVirtualDisplay(Ljava/lang/String;IIILandroid/view/Surface;)Landroid/hardware/display/VirtualDisplay;

    move-result-object v0
    :try_end_81
    .catch Ljava/lang/Exception; {:try_start_7d .. :try_end_81} :catch_89
    .catchall {:try_start_7d .. :try_end_81} :catchall_fe

    :try_start_81
    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    .line 129
    const-string v0, "Display: using DisplayManager API"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V
    :try_end_88
    .catch Ljava/lang/Exception; {:try_start_81 .. :try_end_88} :catch_8c
    .catchall {:try_start_81 .. :try_end_88} :catchall_fe

    .line 141
    goto :goto_9d

    .line 130
    :catch_89
    move-exception v0

    move-object v4, v14

    goto :goto_8d

    :catch_8c
    move-exception v0

    :goto_8d
    move-object v9, v0

    .line 132
    :try_start_8e
    invoke-static {}, Lcom/genymobile/scrcpy/ScreenEncoder;->createDisplay()Landroid/os/IBinder;

    move-result-object v3

    .line 133
    iput-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    .line 134
    invoke-static/range {v3 .. v8}, Lcom/genymobile/scrcpy/ScreenEncoder;->setDisplaySurface(Landroid/os/IBinder;Landroid/view/Surface;ILandroid/graphics/Rect;Landroid/graphics/Rect;I)V

    .line 135
    const-string v0, "Display: using SurfaceControl API"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V
    :try_end_9c
    .catch Ljava/lang/Exception; {:try_start_8e .. :try_end_9c} :catch_eb
    .catchall {:try_start_8e .. :try_end_9c} :catchall_fe

    .line 140
    nop

    .line 142
    :goto_9d
    :try_start_9d
    invoke-virtual {v2}, Landroid/media/MediaCodec;->start()V
    :try_end_a0
    .catchall {:try_start_9d .. :try_end_a0} :catchall_fe

    .line 144
    :try_start_a0
    invoke-direct {p0, v2}, Lcom/genymobile/scrcpy/ScreenEncoder;->encode(Landroid/media/MediaCodec;)Z

    move-result v0

    .line 145
    invoke-virtual {v2}, Landroid/media/MediaCodec;->stop()V
    :try_end_a7
    .catchall {:try_start_a0 .. :try_end_a7} :catchall_cd

    .line 147
    :try_start_a7
    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    if-eqz v3, :cond_b2

    .line 148
    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    invoke-static {v3}, Lcom/genymobile/scrcpy/ScreenEncoder;->destroyDisplay(Landroid/os/IBinder;)V

    .line 149
    iput-object v1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    .line 151
    :cond_b2
    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    if-eqz v3, :cond_bd

    .line 152
    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    invoke-virtual {v3}, Landroid/hardware/display/VirtualDisplay;->release()V

    .line 153
    iput-object v1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    .line 155
    :cond_bd
    invoke-virtual {v2}, Landroid/media/MediaCodec;->release()V

    .line 156
    invoke-virtual {v4}, Landroid/view/Surface;->release()V
    :try_end_c3
    .catchall {:try_start_a7 .. :try_end_c3} :catchall_fe

    .line 157
    nop

    .line 159
    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v2, v1}, Lcom/genymobile/scrcpy/Connection;->setStreamInvalidateListener(Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;)V

    .line 160
    nop

    .line 161
    if-nez v0, :cond_8

    .line 162
    return-void

    .line 147
    :catchall_cd
    move-exception v0

    :try_start_ce
    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    if-eqz v3, :cond_d9

    .line 148
    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    invoke-static {v3}, Lcom/genymobile/scrcpy/ScreenEncoder;->destroyDisplay(Landroid/os/IBinder;)V

    .line 149
    iput-object v1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    .line 151
    :cond_d9
    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    if-eqz v3, :cond_e4

    .line 152
    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    invoke-virtual {v3}, Landroid/hardware/display/VirtualDisplay;->release()V

    .line 153
    iput-object v1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    .line 155
    :cond_e4
    invoke-virtual {v2}, Landroid/media/MediaCodec;->release()V

    .line 156
    invoke-virtual {v4}, Landroid/view/Surface;->release()V

    .line 157
    throw v0

    .line 136
    :catch_eb
    move-exception v0

    .line 137
    const-string v2, "Could not create display using DisplayManager"

    invoke-static {v2, v9}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 138
    const-string v2, "Could not create display using SurfaceControl"

    invoke-static {v2, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 139
    new-instance v0, Ljava/lang/AssertionError;

    const-string v2, "Could not create display"

    invoke-direct {v0, v2}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw v0
    :try_end_fe
    .catchall {:try_start_ce .. :try_end_fe} :catchall_fe

    .line 159
    :catchall_fe
    move-exception v0

    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v2, v1}, Lcom/genymobile/scrcpy/Connection;->setStreamInvalidateListener(Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;)V

    .line 160
    throw v0
.end method

.method public static listEncoders()[Landroid/media/MediaCodecInfo;
    .registers 7

    .line 216
    new-instance v0, Ljava/util/ArrayList;

    invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V

    .line 217
    new-instance v1, Landroid/media/MediaCodecList;

    const/4 v2, 0x0

    invoke-direct {v1, v2}, Landroid/media/MediaCodecList;-><init>(I)V

    invoke-virtual {v1}, Landroid/media/MediaCodecList;->getCodecInfos()[Landroid/media/MediaCodecInfo;

    move-result-object v1

    array-length v3, v1

    :goto_10
    if-ge v2, v3, :cond_30

    aget-object v4, v1, v2

    .line 218
    invoke-virtual {v4}, Landroid/media/MediaCodecInfo;->isEncoder()Z

    move-result v5

    if-eqz v5, :cond_2d

    invoke-virtual {v4}, Landroid/media/MediaCodecInfo;->getSupportedTypes()[Ljava/lang/String;

    move-result-object v5

    invoke-static {v5}, Ljava/util/Arrays;->asList([Ljava/lang/Object;)Ljava/util/List;

    move-result-object v5

    const-string v6, "video/avc"

    invoke-interface {v5, v6}, Ljava/util/List;->contains(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_2d

    .line 219
    invoke-virtual {v0, v4}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    .line 217
    :cond_2d
    add-int/lit8 v2, v2, 0x1

    goto :goto_10

    .line 222
    :cond_30
    invoke-virtual {v0}, Ljava/util/ArrayList;->size()I

    move-result v1

    new-array v1, v1, [Landroid/media/MediaCodecInfo;

    invoke-virtual {v0, v1}, Ljava/util/ArrayList;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [Landroid/media/MediaCodecInfo;

    return-object v0
.end method

.method private static setCodecOption(Landroid/media/MediaFormat;Lcom/genymobile/scrcpy/CodecOption;)V
    .registers 5

    .line 240
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/CodecOption;->getKey()Ljava/lang/String;

    move-result-object v0

    .line 241
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/CodecOption;->getValue()Ljava/lang/Object;

    move-result-object p1

    .line 242
    instance-of v1, p1, Ljava/lang/Integer;

    if-eqz v1, :cond_17

    .line 243
    move-object v1, p1

    check-cast v1, Ljava/lang/Integer;

    invoke-virtual {v1}, Ljava/lang/Integer;->intValue()I

    move-result v1

    invoke-virtual {p0, v0, v1}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    goto :goto_3f

    .line 244
    :cond_17
    instance-of v1, p1, Ljava/lang/Long;

    if-eqz v1, :cond_26

    .line 245
    move-object v1, p1

    check-cast v1, Ljava/lang/Long;

    invoke-virtual {v1}, Ljava/lang/Long;->longValue()J

    move-result-wide v1

    invoke-virtual {p0, v0, v1, v2}, Landroid/media/MediaFormat;->setLong(Ljava/lang/String;J)V

    goto :goto_3f

    .line 246
    :cond_26
    instance-of v1, p1, Ljava/lang/Float;

    if-eqz v1, :cond_35

    .line 247
    move-object v1, p1

    check-cast v1, Ljava/lang/Float;

    invoke-virtual {v1}, Ljava/lang/Float;->floatValue()F

    move-result v1

    invoke-virtual {p0, v0, v1}, Landroid/media/MediaFormat;->setFloat(Ljava/lang/String;F)V

    goto :goto_3f

    .line 248
    :cond_35
    instance-of v1, p1, Ljava/lang/String;

    if-eqz v1, :cond_3f

    .line 249
    move-object v1, p1

    check-cast v1, Ljava/lang/String;

    invoke-virtual {p0, v0, v1}, Landroid/media/MediaFormat;->setString(Ljava/lang/String;Ljava/lang/String;)V

    .line 251
    :cond_3f
    :goto_3f
    new-instance p0, Ljava/lang/StringBuilder;

    invoke-direct {p0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Codec option set: "

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string v0, " ("

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Class;->getSimpleName()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string v0, ") = "

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 252
    return-void
.end method

.method private static setDisplaySurface(Landroid/os/IBinder;Landroid/view/Surface;ILandroid/graphics/Rect;Landroid/graphics/Rect;I)V
    .registers 6

    .line 292
    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->openTransaction()V

    .line 294
    :try_start_3
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->setDisplaySurface(Landroid/os/IBinder;Landroid/view/Surface;)V

    .line 295
    invoke-static {p0, p2, p3, p4}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->setDisplayProjection(Landroid/os/IBinder;ILandroid/graphics/Rect;Landroid/graphics/Rect;)V

    .line 296
    invoke-static {p0, p5}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->setDisplayLayerStack(Landroid/os/IBinder;I)V
    :try_end_c
    .catchall {:try_start_3 .. :try_end_c} :catchall_11

    .line 298
    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->closeTransaction()V

    .line 299
    nop

    .line 300
    return-void

    .line 298
    :catchall_11
    move-exception p0

    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->closeTransaction()V

    .line 299
    throw p0
.end method

.method private static setSize(Landroid/media/MediaFormat;II)V
    .registers 4

    .line 287
    const-string v0, "width"

    invoke-virtual {p0, v0, p1}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    .line 288
    const-string p1, "height"

    invoke-virtual {p0, p1, p2}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    .line 289
    return-void
.end method

.method private updateFormat()V
    .registers 3

    .line 48
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-static {v0}, Lcom/genymobile/scrcpy/ScreenEncoder;->createFormat(Lcom/genymobile/scrcpy/VideoSettings;)Landroid/media/MediaFormat;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->format:Landroid/media/MediaFormat;

    .line 49
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/VideoSettings;->getMaxFps()I

    move-result v0

    .line 50
    if-lez v0, :cond_17

    .line 51
    const v1, 0xf4240

    div-int/2addr v1, v0

    iput v1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->timeout:I

    goto :goto_1a

    .line 53
    :cond_17
    const/4 v0, -0x1

    iput v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->timeout:I

    .line 55
    :goto_1a
    return-void
.end method

.method private writeFrameMeta(Landroid/media/MediaCodec$BufferInfo;I)V
    .registers 8
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 200
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->headerBuffer:Ljava/nio/ByteBuffer;

    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->clear()Ljava/nio/Buffer;

    .line 201
    iget v0, p1, Landroid/media/MediaCodec$BufferInfo;->flags:I

    and-int/lit8 v0, v0, 0x2

    if-eqz v0, :cond_e

    .line 202
    const-wide/16 v0, -0x1

    goto :goto_1f

    .line 204
    :cond_e
    iget-wide v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->ptsOrigin:J

    const-wide/16 v2, 0x0

    cmp-long v4, v0, v2

    if-nez v4, :cond_1a

    .line 205
    iget-wide v0, p1, Landroid/media/MediaCodec$BufferInfo;->presentationTimeUs:J

    iput-wide v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->ptsOrigin:J

    .line 207
    :cond_1a
    iget-wide v0, p1, Landroid/media/MediaCodec$BufferInfo;->presentationTimeUs:J

    iget-wide v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->ptsOrigin:J

    sub-long/2addr v0, v2

    .line 209
    :goto_1f
    iget-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->headerBuffer:Ljava/nio/ByteBuffer;

    invoke-virtual {p1, v0, v1}, Ljava/nio/ByteBuffer;->putLong(J)Ljava/nio/ByteBuffer;

    .line 210
    iget-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->headerBuffer:Ljava/nio/ByteBuffer;

    invoke-virtual {p1, p2}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 211
    iget-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->headerBuffer:Ljava/nio/ByteBuffer;

    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->flip()Ljava/nio/Buffer;

    .line 212
    iget-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    iget-object p2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->headerBuffer:Ljava/nio/ByteBuffer;

    invoke-virtual {p1, p2}, Lcom/genymobile/scrcpy/Connection;->send(Ljava/nio/ByteBuffer;)V

    .line 213
    return-void
.end method


# virtual methods
.method public consumeStreamInvalidation()Z
    .registers 3

    .line 73
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->streamIsInvalide:Ljava/util/concurrent/atomic/AtomicBoolean;

    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Ljava/util/concurrent/atomic/AtomicBoolean;->getAndSet(Z)Z

    move-result v0

    return v0
.end method

.method public isAlive()Z
    .registers 2

    .line 77
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->selectorThread:Ljava/lang/Thread;

    .line 78
    if-eqz v0, :cond_c

    invoke-virtual {v0}, Ljava/lang/Thread;->isAlive()Z

    move-result v0

    if-eqz v0, :cond_c

    const/4 v0, 0x1

    goto :goto_d

    :cond_c
    const/4 v0, 0x0

    :goto_d
    return v0
.end method

.method public onStreamInvalidate()V
    .registers 3

    .line 67
    const-string v0, "invalidate stream"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 68
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->streamIsInvalide:Ljava/util/concurrent/atomic/AtomicBoolean;

    const/4 v1, 0x1

    invoke-virtual {v0, v1}, Ljava/util/concurrent/atomic/AtomicBoolean;->set(Z)V

    .line 69
    invoke-direct {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->updateFormat()V

    .line 70
    return-void
.end method

.method public run()V
    .registers 4

    .line 308
    monitor-enter p0

    .line 309
    :try_start_1
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->selectorThread:Ljava/lang/Thread;

    if-eqz v0, :cond_2f

    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->selectorThread:Ljava/lang/Thread;

    invoke-virtual {v0}, Ljava/lang/Thread;->isAlive()Z

    move-result v0

    if-nez v0, :cond_e

    goto :goto_2f

    .line 310
    :cond_e
    new-instance v0, Ljava/lang/IllegalStateException;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    const-string v2, " can only be started once."

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-direct {v0, v1}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/String;)V

    throw v0

    .line 312
    :cond_2f
    :goto_2f
    invoke-static {}, Ljava/lang/Thread;->currentThread()Ljava/lang/Thread;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->selectorThread:Ljava/lang/Thread;

    .line 313
    monitor-exit p0
    :try_end_36
    .catchall {:try_start_1 .. :try_end_36} :catchall_41

    .line 315
    :try_start_36
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->streamScreen()V
    :try_end_39
    .catch Ljava/io/IOException; {:try_start_36 .. :try_end_39} :catch_3a

    .line 318
    goto :goto_40

    .line 316
    :catch_3a
    move-exception v0

    .line 317
    const-string v1, "Failed to start screen recorder"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 319
    :goto_40
    return-void

    .line 313
    :catchall_41
    move-exception v0

    :try_start_42
    monitor-exit p0
    :try_end_43
    .catchall {:try_start_42 .. :try_end_43} :catchall_41

    throw v0
.end method

.method public setConnection(Lcom/genymobile/scrcpy/Connection;)V
    .registers 2

    .line 58
    iput-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    .line 59
    return-void
.end method

.method public setDevice(Lcom/genymobile/scrcpy/Device;)V
    .registers 2

    .line 62
    iput-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->device:Lcom/genymobile/scrcpy/Device;

    .line 63
    return-void
.end method

.method public start(Lcom/genymobile/scrcpy/Device;Lcom/genymobile/scrcpy/Connection;)V
    .registers 4

    .line 322
    iput-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->device:Lcom/genymobile/scrcpy/Device;

    .line 323
    iput-object p2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    .line 324
    iget-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->selectorThread:Ljava/lang/Thread;

    .line 325
    if-eqz p1, :cond_30

    invoke-virtual {p1}, Ljava/lang/Thread;->isAlive()Z

    move-result p1

    if-nez p1, :cond_f

    goto :goto_30

    .line 326
    :cond_f
    new-instance p1, Ljava/lang/IllegalStateException;

    new-instance p2, Ljava/lang/StringBuilder;

    invoke-direct {p2}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p2

    const-string v0, " can only be started once."

    invoke-virtual {p2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p2

    invoke-virtual {p2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-direct {p1, p2}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/String;)V

    throw p1

    .line 328
    :cond_30
    :goto_30
    new-instance p1, Ljava/lang/Thread;

    invoke-direct {p1, p0}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;)V

    invoke-virtual {p1}, Ljava/lang/Thread;->start()V

    .line 329
    return-void
.end method

.method public streamScreen()V
    .registers 2
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 82
    invoke-static {}, Lcom/genymobile/scrcpy/Workarounds;->prepareMainLooper()V

    .line 84
    :try_start_3
    invoke-direct {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->internalStreamScreen()V
    :try_end_6
    .catch Ljava/lang/NullPointerException; {:try_start_3 .. :try_end_6} :catch_7

    .line 89
    goto :goto_13

    .line 85
    :catch_7
    move-exception v0

    .line 86
    const-string v0, "Applying workarounds to avoid NullPointerException"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 87
    invoke-static {}, Lcom/genymobile/scrcpy/Workarounds;->fillAppInfo()V

    .line 88
    invoke-direct {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->internalStreamScreen()V

    .line 90
    :goto_13
    return-void
.end method
