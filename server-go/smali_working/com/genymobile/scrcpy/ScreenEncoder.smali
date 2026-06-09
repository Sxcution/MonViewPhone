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

    .line 45
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 31
    new-instance v0, Ljava/util/concurrent/atomic/AtomicBoolean;

    invoke-direct {v0}, Ljava/util/concurrent/atomic/AtomicBoolean;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->streamIsInvalide:Ljava/util/concurrent/atomic/AtomicBoolean;

    const/16 v0, 0xc

    .line 32
    invoke-static {v0}, Ljava/nio/ByteBuffer;->allocate(I)Ljava/nio/ByteBuffer;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->headerBuffer:Ljava/nio/ByteBuffer;

    const/4 v0, -0x1

    .line 40
    iput v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->timeout:I

    .line 46
    iput-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    .line 47
    invoke-direct {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->updateFormat()V

    return-void
.end method

.method private static configure(Landroid/media/MediaCodec;Landroid/media/MediaFormat;)V
    .registers 4

    const/4 v0, 0x0

    const/4 v1, 0x1

    .line 297
    invoke-virtual {p0, p1, v0, v0, v1}, Landroid/media/MediaCodec;->configure(Landroid/media/MediaFormat;Landroid/view/Surface;Landroid/media/MediaCrypto;I)V

    return-void
.end method

.method private static createCodec(Ljava/lang/String;)Landroid/media/MediaCodec;
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    const-string v0, "\'"

    if-eqz p0, :cond_2a

    .line 228
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Creating encoder by name: \'"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 230
    :try_start_1b
    invoke-static {p0}, Landroid/media/MediaCodec;->createByCodecName(Ljava/lang/String;)Landroid/media/MediaCodec;

    move-result-object p0
    :try_end_1f
    .catch Ljava/lang/IllegalArgumentException; {:try_start_1b .. :try_end_1f} :catch_20

    return-object p0

    .line 232
    :catch_20
    invoke-static {}, Lcom/genymobile/scrcpy/ScreenEncoder;->listEncoders()[Landroid/media/MediaCodecInfo;

    move-result-object v0

    .line 233
    new-instance v1, Lcom/genymobile/scrcpy/InvalidEncoderException;

    invoke-direct {v1, p0, v0}, Lcom/genymobile/scrcpy/InvalidEncoderException;-><init>(Ljava/lang/String;[Landroid/media/MediaCodecInfo;)V

    throw v1

    :cond_2a
    const-string p0, "video/avc"

    .line 236
    invoke-static {p0}, Landroid/media/MediaCodec;->createEncoderByType(Ljava/lang/String;)Landroid/media/MediaCodec;

    move-result-object p0

    .line 237
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Using encoder: \'"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Landroid/media/MediaCodec;->getName()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    return-object p0
.end method

.method private static createDisplay()Landroid/os/IBinder;
    .registers 2
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    .line 291
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x1e

    if-lt v0, v1, :cond_17

    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    if-ne v0, v1, :cond_15

    sget-object v0, Landroid/os/Build$VERSION;->CODENAME:Ljava/lang/String;

    const-string v1, "S"

    .line 292
    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

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

    .line 293
    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->createDisplay(Ljava/lang/String;Z)Landroid/os/IBinder;

    move-result-object v0

    return-object v0
.end method

.method private static createFormat(Lcom/genymobile/scrcpy/VideoSettings;)Landroid/media/MediaFormat;
    .registers 7

    .line 259
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/VideoSettings;->getBitRate()I

    move-result v0

    .line 260
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/VideoSettings;->getMaxFps()I

    move-result v1

    .line 261
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/VideoSettings;->getIFrameInterval()I

    move-result v2

    .line 262
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/VideoSettings;->getCodecOptions()Ljava/util/List;

    move-result-object p0

    .line 263
    new-instance v3, Landroid/media/MediaFormat;

    invoke-direct {v3}, Landroid/media/MediaFormat;-><init>()V

    const-string v4, "mime"

    const-string v5, "video/avc"

    .line 264
    invoke-virtual {v3, v4, v5}, Landroid/media/MediaFormat;->setString(Ljava/lang/String;Ljava/lang/String;)V

    const-string v4, "bitrate"

    .line 265
    invoke-virtual {v3, v4, v0}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    const-string v0, "frame-rate"

    const/16 v4, 0x3c

    .line 267
    invoke-virtual {v3, v0, v4}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    const-string v0, "color-format"

    const v4, 0x7f000789

    .line 268
    invoke-virtual {v3, v0, v4}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    const-string v0, "i-frame-interval"

    .line 269
    invoke-virtual {v3, v0, v2}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    const-string v0, "repeat-previous-frame-after"

    const-wide/32 v4, 0x186a0

    .line 271
    invoke-virtual {v3, v0, v4, v5}, Landroid/media/MediaFormat;->setLong(Ljava/lang/String;J)V

    if-lez v1, :cond_45

    int-to-float v0, v1

    const-string v1, "max-fps-to-encoder"

    .line 276
    invoke-virtual {v3, v1, v0}, Landroid/media/MediaFormat;->setFloat(Ljava/lang/String;F)V

    :cond_45
    if-eqz p0, :cond_5b

    .line 280
    invoke-interface {p0}, Ljava/util/List;->iterator()Ljava/util/Iterator;

    move-result-object p0

    :goto_4b
    invoke-interface {p0}, Ljava/util/Iterator;->hasNext()Z

    move-result v0

    if-eqz v0, :cond_5b

    invoke-interface {p0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Lcom/genymobile/scrcpy/CodecOption;

    .line 281
    invoke-static {v3, v0}, Lcom/genymobile/scrcpy/ScreenEncoder;->setCodecOption(Landroid/media/MediaFormat;Lcom/genymobile/scrcpy/CodecOption;)V

    goto :goto_4b

    :cond_5b
    return-object v3
.end method

.method private static destroyDisplay(Landroid/os/IBinder;)V
    .registers 1

    .line 317
    invoke-static {p0}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->destroyDisplay(Landroid/os/IBinder;)V

    return-void
.end method

.method private encode(Landroid/media/MediaCodec;)Z
    .registers 8
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 167
    new-instance v0, Landroid/media/MediaCodec$BufferInfo;

    invoke-direct {v0}, Landroid/media/MediaCodec$BufferInfo;-><init>()V

    const/4 v1, 0x0

    const/4 v2, 0x0

    .line 169
    :goto_7
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->consumeStreamInvalidation()Z

    move-result v3

    const/4 v4, 0x1

    if-nez v3, :cond_5d

    if-nez v2, :cond_5d

    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v3}, Lcom/genymobile/scrcpy/Connection;->hasConnections()Z

    move-result v3

    if-eqz v3, :cond_5d

    .line 170
    iget v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->timeout:I

    int-to-long v2, v2

    invoke-virtual {p1, v0, v2, v3}, Landroid/media/MediaCodec;->dequeueOutputBuffer(Landroid/media/MediaCodec$BufferInfo;J)I

    move-result v2

    .line 171
    iget v3, v0, Landroid/media/MediaCodec$BufferInfo;->flags:I

    and-int/lit8 v3, v3, 0x4

    if-eqz v3, :cond_27

    const/4 v3, 0x1

    goto :goto_28

    :cond_27
    const/4 v3, 0x0

    .line 173
    :goto_28
    :try_start_28
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->consumeStreamInvalidation()Z

    move-result v5
    :try_end_2c
    .catchall {:try_start_28 .. :try_end_2c} :catchall_56

    if-eqz v5, :cond_35

    if-ltz v2, :cond_33

    .line 188
    invoke-virtual {p1, v2, v1}, Landroid/media/MediaCodec;->releaseOutputBuffer(IZ)V

    :cond_33
    move v2, v3

    goto :goto_5d

    :cond_35
    if-ltz v2, :cond_4f

    .line 178
    :try_start_37
    invoke-virtual {p1, v2}, Landroid/media/MediaCodec;->getOutputBuffer(I)Ljava/nio/ByteBuffer;

    move-result-object v4

    .line 180
    iget-object v5, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v5}, Lcom/genymobile/scrcpy/VideoSettings;->getSendFrameMeta()Z

    move-result v5

    if-eqz v5, :cond_4a

    .line 181
    invoke-virtual {v4}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v5

    invoke-direct {p0, v0, v5}, Lcom/genymobile/scrcpy/ScreenEncoder;->writeFrameMeta(Landroid/media/MediaCodec$BufferInfo;I)V

    .line 184
    :cond_4a
    iget-object v5, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v5, v4}, Lcom/genymobile/scrcpy/Connection;->send(Ljava/nio/ByteBuffer;)V
    :try_end_4f
    .catchall {:try_start_37 .. :try_end_4f} :catchall_56

    :cond_4f
    if-ltz v2, :cond_54

    .line 188
    invoke-virtual {p1, v2, v1}, Landroid/media/MediaCodec;->releaseOutputBuffer(IZ)V

    :cond_54
    move v2, v3

    goto :goto_7

    :catchall_56
    move-exception v0

    if-ltz v2, :cond_5c

    invoke-virtual {p1, v2, v1}, Landroid/media/MediaCodec;->releaseOutputBuffer(IZ)V

    .line 190
    :cond_5c
    throw v0

    :cond_5d
    :goto_5d
    if-nez v2, :cond_68

    .line 193
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

    .line 99
    invoke-direct {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->updateFormat()V

    .line 100
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v0, p0}, Lcom/genymobile/scrcpy/Connection;->setStreamInvalidateListener(Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;)V

    :cond_8
    const/4 v0, 0x0

    .line 104
    :try_start_9
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/VideoSettings;->getEncoderName()Ljava/lang/String;

    move-result-object v1

    invoke-static {v1}, Lcom/genymobile/scrcpy/ScreenEncoder;->createCodec(Ljava/lang/String;)Landroid/media/MediaCodec;

    move-result-object v1

    .line 105
    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    if-eqz v2, :cond_1e

    .line 106
    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    invoke-static {v2}, Lcom/genymobile/scrcpy/ScreenEncoder;->destroyDisplay(Landroid/os/IBinder;)V

    .line 107
    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    .line 109
    :cond_1e
    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    if-eqz v2, :cond_29

    .line 110
    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    invoke-virtual {v2}, Landroid/hardware/display/VirtualDisplay;->release()V

    .line 111
    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    .line 114
    :cond_29
    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Device;->getScreenInfo()Lcom/genymobile/scrcpy/ScreenInfo;

    move-result-object v2

    .line 115
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/ScreenInfo;->getContentRect()Landroid/graphics/Rect;

    move-result-object v6

    .line 117
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/ScreenInfo;->getVideoSize()Lcom/genymobile/scrcpy/Size;

    move-result-object v3

    invoke-virtual {v3}, Lcom/genymobile/scrcpy/Size;->toRect()Landroid/graphics/Rect;

    move-result-object v3

    .line 119
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/ScreenInfo;->getUnlockedVideoSize()Lcom/genymobile/scrcpy/Size;

    move-result-object v4

    invoke-virtual {v4}, Lcom/genymobile/scrcpy/Size;->toRect()Landroid/graphics/Rect;

    move-result-object v7

    .line 120
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/ScreenInfo;->getVideoRotation()I

    move-result v5

    .line 121
    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Device;->getLayerStack()I

    move-result v8

    .line 123
    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->format:Landroid/media/MediaFormat;

    invoke-virtual {v3}, Landroid/graphics/Rect;->width()I

    move-result v4

    invoke-virtual {v3}, Landroid/graphics/Rect;->height()I

    move-result v9

    invoke-static {v2, v4, v9}, Lcom/genymobile/scrcpy/ScreenEncoder;->setSize(Landroid/media/MediaFormat;II)V

    .line 124
    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->format:Landroid/media/MediaFormat;

    invoke-static {v1, v2}, Lcom/genymobile/scrcpy/ScreenEncoder;->configure(Landroid/media/MediaCodec;Landroid/media/MediaFormat;)V

    .line 125
    invoke-virtual {v1}, Landroid/media/MediaCodec;->createInputSurface()Landroid/view/Surface;

    move-result-object v2
    :try_end_63
    .catchall {:try_start_9 .. :try_end_63} :catchall_f9

    .line 127
    :try_start_63
    new-instance v4, Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-direct {v4}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;-><init>()V

    .line 128
    invoke-virtual {v4}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getDisplayManager()Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    move-result-object v9

    const-string v10, "scrcpy"

    .line 129
    invoke-virtual {v3}, Landroid/graphics/Rect;->width()I

    move-result v11

    invoke-virtual {v3}, Landroid/graphics/Rect;->height()I

    move-result v12

    iget-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v3}, Lcom/genymobile/scrcpy/Device;->getDisplayId()I

    move-result v13

    move-object v14, v2

    invoke-virtual/range {v9 .. v14}, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->createVirtualDisplay(Ljava/lang/String;IIILandroid/view/Surface;)Landroid/hardware/display/VirtualDisplay;

    move-result-object v3

    iput-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    const-string v3, "Display: using DisplayManager API"

    .line 130
    invoke-static {v3}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V
    :try_end_88
    .catch Ljava/lang/Exception; {:try_start_63 .. :try_end_88} :catch_89
    .catchall {:try_start_63 .. :try_end_88} :catchall_f9

    goto :goto_9a

    :catch_89
    move-exception v3

    move-object v9, v3

    .line 133
    :try_start_8b
    invoke-static {}, Lcom/genymobile/scrcpy/ScreenEncoder;->createDisplay()Landroid/os/IBinder;

    move-result-object v3

    iput-object v3, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    move-object v4, v2

    .line 134
    invoke-static/range {v3 .. v8}, Lcom/genymobile/scrcpy/ScreenEncoder;->setDisplaySurface(Landroid/os/IBinder;Landroid/view/Surface;ILandroid/graphics/Rect;Landroid/graphics/Rect;I)V

    const-string v3, "Display: using SurfaceControl API"

    .line 135
    invoke-static {v3}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V
    :try_end_9a
    .catch Ljava/lang/Exception; {:try_start_8b .. :try_end_9a} :catch_e6
    .catchall {:try_start_8b .. :try_end_9a} :catchall_f9

    .line 142
    :goto_9a
    :try_start_9a
    invoke-virtual {v1}, Landroid/media/MediaCodec;->start()V
    :try_end_9d
    .catchall {:try_start_9a .. :try_end_9d} :catchall_f9

    .line 144
    :try_start_9d
    invoke-direct {p0, v1}, Lcom/genymobile/scrcpy/ScreenEncoder;->encode(Landroid/media/MediaCodec;)Z

    move-result v3

    .line 146
    invoke-virtual {v1}, Landroid/media/MediaCodec;->stop()V
    :try_end_a4
    .catchall {:try_start_9d .. :try_end_a4} :catchall_c8

    .line 148
    :try_start_a4
    iget-object v4, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    if-eqz v4, :cond_af

    .line 149
    iget-object v4, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    invoke-static {v4}, Lcom/genymobile/scrcpy/ScreenEncoder;->destroyDisplay(Landroid/os/IBinder;)V

    .line 150
    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    .line 152
    :cond_af
    iget-object v4, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    if-eqz v4, :cond_ba

    .line 153
    iget-object v4, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    invoke-virtual {v4}, Landroid/hardware/display/VirtualDisplay;->release()V

    .line 154
    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    .line 156
    :cond_ba
    invoke-virtual {v1}, Landroid/media/MediaCodec;->release()V

    .line 157
    invoke-virtual {v2}, Landroid/view/Surface;->release()V
    :try_end_c0
    .catchall {:try_start_a4 .. :try_end_c0} :catchall_f9

    if-nez v3, :cond_8

    .line 161
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v1, v0}, Lcom/genymobile/scrcpy/Connection;->setStreamInvalidateListener(Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;)V

    return-void

    :catchall_c8
    move-exception v3

    .line 148
    :try_start_c9
    iget-object v4, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    if-eqz v4, :cond_d4

    .line 149
    iget-object v4, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    invoke-static {v4}, Lcom/genymobile/scrcpy/ScreenEncoder;->destroyDisplay(Landroid/os/IBinder;)V

    .line 150
    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->display:Landroid/os/IBinder;

    .line 152
    :cond_d4
    iget-object v4, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    if-eqz v4, :cond_df

    .line 153
    iget-object v4, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    invoke-virtual {v4}, Landroid/hardware/display/VirtualDisplay;->release()V

    .line 154
    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->virtualDisplay:Landroid/hardware/display/VirtualDisplay;

    .line 156
    :cond_df
    invoke-virtual {v1}, Landroid/media/MediaCodec;->release()V

    .line 157
    invoke-virtual {v2}, Landroid/view/Surface;->release()V

    .line 158
    throw v3

    :catch_e6
    move-exception v1

    const-string v2, "Could not create display using DisplayManager"

    .line 137
    invoke-static {v2, v9}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    const-string v2, "Could not create display using SurfaceControl"

    .line 138
    invoke-static {v2, v1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 139
    new-instance v1, Ljava/lang/AssertionError;

    const-string v2, "Could not create display"

    invoke-direct {v1, v2}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw v1
    :try_end_f9
    .catchall {:try_start_c9 .. :try_end_f9} :catchall_f9

    :catchall_f9
    move-exception v1

    .line 161
    iget-object v2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v2, v0}, Lcom/genymobile/scrcpy/Connection;->setStreamInvalidateListener(Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;)V

    .line 162
    throw v1
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

    .line 218
    invoke-virtual {v1}, Landroid/media/MediaCodecList;->getCodecInfos()[Landroid/media/MediaCodecInfo;

    move-result-object v1

    array-length v3, v1

    :goto_10
    if-ge v2, v3, :cond_30

    aget-object v4, v1, v2

    .line 219
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

    .line 220
    invoke-interface {v0, v4}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    :cond_2d
    add-int/lit8 v2, v2, 0x1

    goto :goto_10

    .line 223
    :cond_30
    invoke-interface {v0}, Ljava/util/List;->size()I

    move-result v1

    new-array v1, v1, [Landroid/media/MediaCodecInfo;

    invoke-interface {v0, v1}, Ljava/util/List;->toArray([Ljava/lang/Object;)[Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [Landroid/media/MediaCodecInfo;

    return-object v0
.end method

.method private static setCodecOption(Landroid/media/MediaFormat;Lcom/genymobile/scrcpy/CodecOption;)V
    .registers 5

    .line 242
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/CodecOption;->getKey()Ljava/lang/String;

    move-result-object v0

    .line 243
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/CodecOption;->getValue()Ljava/lang/Object;

    move-result-object p1

    .line 245
    instance-of v1, p1, Ljava/lang/Integer;

    if-eqz v1, :cond_17

    .line 246
    move-object v1, p1

    check-cast v1, Ljava/lang/Integer;

    invoke-virtual {v1}, Ljava/lang/Integer;->intValue()I

    move-result v1

    invoke-virtual {p0, v0, v1}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    goto :goto_3f

    .line 247
    :cond_17
    instance-of v1, p1, Ljava/lang/Long;

    if-eqz v1, :cond_26

    .line 248
    move-object v1, p1

    check-cast v1, Ljava/lang/Long;

    invoke-virtual {v1}, Ljava/lang/Long;->longValue()J

    move-result-wide v1

    invoke-virtual {p0, v0, v1, v2}, Landroid/media/MediaFormat;->setLong(Ljava/lang/String;J)V

    goto :goto_3f

    .line 249
    :cond_26
    instance-of v1, p1, Ljava/lang/Float;

    if-eqz v1, :cond_35

    .line 250
    move-object v1, p1

    check-cast v1, Ljava/lang/Float;

    invoke-virtual {v1}, Ljava/lang/Float;->floatValue()F

    move-result v1

    invoke-virtual {p0, v0, v1}, Landroid/media/MediaFormat;->setFloat(Ljava/lang/String;F)V

    goto :goto_3f

    .line 251
    :cond_35
    instance-of v1, p1, Ljava/lang/String;

    if-eqz v1, :cond_3f

    .line 252
    move-object v1, p1

    check-cast v1, Ljava/lang/String;

    invoke-virtual {p0, v0, v1}, Landroid/media/MediaFormat;->setString(Ljava/lang/String;Ljava/lang/String;)V

    .line 255
    :cond_3f
    :goto_3f
    new-instance p0, Ljava/lang/StringBuilder;

    invoke-direct {p0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Codec option set: "

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, " ("

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Class;->getSimpleName()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, ") = "

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    return-void
.end method

.method private static setDisplaySurface(Landroid/os/IBinder;Landroid/view/Surface;ILandroid/graphics/Rect;Landroid/graphics/Rect;I)V
    .registers 6

    .line 306
    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->openTransaction()V

    .line 308
    :try_start_3
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->setDisplaySurface(Landroid/os/IBinder;Landroid/view/Surface;)V

    .line 309
    invoke-static {p0, p2, p3, p4}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->setDisplayProjection(Landroid/os/IBinder;ILandroid/graphics/Rect;Landroid/graphics/Rect;)V

    .line 310
    invoke-static {p0, p5}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->setDisplayLayerStack(Landroid/os/IBinder;I)V
    :try_end_c
    .catchall {:try_start_3 .. :try_end_c} :catchall_10

    .line 312
    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->closeTransaction()V

    return-void

    :catchall_10
    move-exception p0

    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->closeTransaction()V

    .line 313
    throw p0
.end method

.method private static setSize(Landroid/media/MediaFormat;II)V
    .registers 4

    const-string v0, "width"

    .line 301
    invoke-virtual {p0, v0, p1}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    const-string p1, "height"

    .line 302
    invoke-virtual {p0, p1, p2}, Landroid/media/MediaFormat;->setInteger(Ljava/lang/String;I)V

    return-void
.end method

.method private updateFormat()V
    .registers 3

    .line 51
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-static {v0}, Lcom/genymobile/scrcpy/ScreenEncoder;->createFormat(Lcom/genymobile/scrcpy/VideoSettings;)Landroid/media/MediaFormat;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->format:Landroid/media/MediaFormat;

    .line 52
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/VideoSettings;->getMaxFps()I

    move-result v0

    if-lez v0, :cond_17

    const v1, 0xf4240

    .line 54
    div-int/2addr v1, v0

    iput v1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->timeout:I

    goto :goto_1a

    :cond_17
    const/4 v0, -0x1

    .line 56
    iput v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->timeout:I

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

    .line 197
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->headerBuffer:Ljava/nio/ByteBuffer;

    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->clear()Ljava/nio/Buffer;

    .line 200
    iget v0, p1, Landroid/media/MediaCodec$BufferInfo;->flags:I

    and-int/lit8 v0, v0, 0x2

    if-eqz v0, :cond_e

    const-wide/16 v0, -0x1

    goto :goto_1f

    .line 203
    :cond_e
    iget-wide v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->ptsOrigin:J

    const-wide/16 v2, 0x0

    cmp-long v4, v0, v2

    if-nez v4, :cond_1a

    .line 204
    iget-wide v0, p1, Landroid/media/MediaCodec$BufferInfo;->presentationTimeUs:J

    iput-wide v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->ptsOrigin:J

    .line 206
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

    return-void
.end method


# virtual methods
.method public consumeStreamInvalidation()Z
    .registers 3

    .line 76
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->streamIsInvalide:Ljava/util/concurrent/atomic/AtomicBoolean;

    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Ljava/util/concurrent/atomic/AtomicBoolean;->getAndSet(Z)Z

    move-result v0

    return v0
.end method

.method public isAlive()Z
    .registers 2

    .line 80
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->selectorThread:Ljava/lang/Thread;

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

    const-string v0, "invalidate stream"

    .line 70
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 71
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->streamIsInvalide:Ljava/util/concurrent/atomic/AtomicBoolean;

    const/4 v1, 0x1

    invoke-virtual {v0, v1}, Ljava/util/concurrent/atomic/AtomicBoolean;->set(Z)V

    .line 72
    invoke-direct {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->updateFormat()V

    return-void
.end method

.method public run()V
    .registers 4

    .line 322
    monitor-enter p0

    .line 323
    :try_start_1
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->selectorThread:Ljava/lang/Thread;

    if-eqz v0, :cond_2d

    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->selectorThread:Ljava/lang/Thread;

    invoke-virtual {v0}, Ljava/lang/Thread;->isAlive()Z

    move-result v0

    if-nez v0, :cond_e

    goto :goto_2d

    .line 324
    :cond_e
    new-instance v0, Ljava/lang/IllegalStateException;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v2, " can only be started once."

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-direct {v0, v1}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/String;)V

    throw v0

    .line 326
    :cond_2d
    :goto_2d
    invoke-static {}, Ljava/lang/Thread;->currentThread()Ljava/lang/Thread;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->selectorThread:Ljava/lang/Thread;

    .line 327
    monitor-exit p0
    :try_end_34
    .catchall {:try_start_1 .. :try_end_34} :catchall_3f

    .line 329
    :try_start_34
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->streamScreen()V
    :try_end_37
    .catch Ljava/io/IOException; {:try_start_34 .. :try_end_37} :catch_38

    goto :goto_3e

    :catch_38
    move-exception v0

    const-string v1, "Failed to start screen recorder"

    .line 331
    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :goto_3e
    return-void

    :catchall_3f
    move-exception v0

    .line 327
    :try_start_40
    monitor-exit p0
    :try_end_41
    .catchall {:try_start_40 .. :try_end_41} :catchall_3f

    throw v0
.end method

.method public setConnection(Lcom/genymobile/scrcpy/Connection;)V
    .registers 2

    .line 61
    iput-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    return-void
.end method

.method public setDevice(Lcom/genymobile/scrcpy/Device;)V
    .registers 2

    .line 65
    iput-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->device:Lcom/genymobile/scrcpy/Device;

    return-void
.end method

.method public start(Lcom/genymobile/scrcpy/Device;Lcom/genymobile/scrcpy/Connection;)V
    .registers 4

    .line 336
    iput-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->device:Lcom/genymobile/scrcpy/Device;

    .line 337
    iput-object p2, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->connection:Lcom/genymobile/scrcpy/Connection;

    .line 338
    iget-object p1, p0, Lcom/genymobile/scrcpy/ScreenEncoder;->selectorThread:Ljava/lang/Thread;

    if-eqz p1, :cond_2e

    invoke-virtual {p1}, Ljava/lang/Thread;->isAlive()Z

    move-result p1

    if-nez p1, :cond_f

    goto :goto_2e

    .line 339
    :cond_f
    new-instance p1, Ljava/lang/IllegalStateException;

    new-instance p2, Ljava/lang/StringBuilder;

    invoke-direct {p2}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, " can only be started once."

    invoke-virtual {p2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-direct {p1, p2}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/String;)V

    throw p1

    .line 341
    :cond_2e
    :goto_2e
    new-instance p1, Ljava/lang/Thread;

    invoke-direct {p1, p0}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;)V

    invoke-virtual {p1}, Ljava/lang/Thread;->start()V

    return-void
.end method

.method public streamScreen()V
    .registers 2
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 84
    invoke-static {}, Lcom/genymobile/scrcpy/Workarounds;->prepareMainLooper()V

    .line 87
    :try_start_3
    invoke-direct {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->internalStreamScreen()V
    :try_end_6
    .catch Ljava/lang/NullPointerException; {:try_start_3 .. :try_end_6} :catch_7

    goto :goto_12

    :catch_7
    const-string v0, "Applying workarounds to avoid NullPointerException"

    .line 92
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 93
    invoke-static {}, Lcom/genymobile/scrcpy/Workarounds;->fillAppInfo()V

    .line 94
    invoke-direct {p0}, Lcom/genymobile/scrcpy/ScreenEncoder;->internalStreamScreen()V

    :goto_12
    return-void
.end method
