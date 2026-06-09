.class public Lcom/genymobile/scrcpy/VideoSettings;
.super Ljava/lang/Object;
.source "VideoSettings.java"


# static fields
.field private static final DEFAULT_BIT_RATE:I = 0x7a1200

.field private static final DEFAULT_I_FRAME_INTERVAL:B = 0xat

.field private static final DEFAULT_MAX_FPS:B = 0x3ct


# instance fields
.field private bitRate:I

.field private bounds:Lcom/genymobile/scrcpy/Size;

.field private codecOptions:Ljava/util/List;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/List<",
            "Lcom/genymobile/scrcpy/CodecOption;",
            ">;"
        }
    .end annotation
.end field

.field private codecOptionsString:Ljava/lang/String;

.field private crop:Landroid/graphics/Rect;

.field private displayId:I

.field private encoderName:Ljava/lang/String;

.field private iFrameInterval:B

.field private lockedVideoOrientation:I

.field private maxFps:I

.field private sendFrameMeta:Z


# direct methods
.method public constructor <init>()V
    .registers 2

    .line 10
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const v0, 0x7a1200

    .line 16
    iput v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    const/16 v0, 0xa

    .line 19
    iput-byte v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    return-void
.end method

.method public static fromByteArray([B)Lcom/genymobile/scrcpy/VideoSettings;
    .registers 2

    .line 189
    new-instance v0, Lcom/genymobile/scrcpy/VideoSettings;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/VideoSettings;-><init>()V

    .line 190
    invoke-static {v0, p0}, Lcom/genymobile/scrcpy/VideoSettings;->mergeFromByteArray(Lcom/genymobile/scrcpy/VideoSettings;[B)V

    return-object v0
.end method

.method public static mergeFromByteArray(Lcom/genymobile/scrcpy/VideoSettings;[B)V
    .registers 20

    move-object/from16 v0, p0

    .line 195
    invoke-static/range {p1 .. p1}, Ljava/nio/ByteBuffer;->wrap([B)Ljava/nio/ByteBuffer;

    move-result-object v1

    .line 196
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v2

    .line 197
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v3

    .line 198
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->get()B

    move-result v4

    .line 199
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v5

    .line 200
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v6

    .line 201
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v7

    .line 202
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v8

    .line 203
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v9

    .line 204
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v10

    .line 205
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->get()B

    move-result v11

    const/4 v12, 0x0

    if-eqz v11, :cond_33

    const/4 v11, 0x1

    goto :goto_34

    :cond_33
    const/4 v11, 0x0

    .line 206
    :goto_34
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->get()B

    move-result v13

    .line 207
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v14

    .line 208
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v15

    if-lez v15, :cond_64

    .line 209
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v15

    if-lez v15, :cond_64

    move/from16 p1, v14

    .line 211
    new-array v14, v15, [B

    .line 212
    invoke-virtual {v1, v14, v12, v15}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    move/from16 v16, v13

    .line 213
    new-instance v13, Ljava/lang/String;

    move/from16 v17, v11

    sget-object v11, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-direct {v13, v14, v12, v15, v11}, Ljava/lang/String;-><init>([BIILjava/nio/charset/Charset;)V

    .line 214
    invoke-virtual {v13}, Ljava/lang/String;->isEmpty()Z

    move-result v11

    if-nez v11, :cond_6a

    .line 215
    invoke-virtual {v0, v13}, Lcom/genymobile/scrcpy/VideoSettings;->setCodecOptions(Ljava/lang/String;)V

    goto :goto_6a

    :cond_64
    move/from16 v17, v11

    move/from16 v16, v13

    move/from16 p1, v14

    .line 219
    :cond_6a
    :goto_6a
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v11

    if-lez v11, :cond_8b

    .line 220
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v11

    if-lez v11, :cond_8b

    .line 222
    new-array v13, v11, [B

    .line 223
    invoke-virtual {v1, v13, v12, v11}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 224
    new-instance v1, Ljava/lang/String;

    sget-object v14, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-direct {v1, v13, v12, v11, v14}, Ljava/lang/String;-><init>([BIILjava/nio/charset/Charset;)V

    .line 225
    invoke-virtual {v1}, Ljava/lang/String;->isEmpty()Z

    move-result v11

    if-nez v11, :cond_8b

    .line 226
    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/VideoSettings;->setEncoderName(Ljava/lang/String;)V

    .line 230
    :cond_8b
    invoke-virtual {v0, v2}, Lcom/genymobile/scrcpy/VideoSettings;->setBitRate(I)V

    .line 231
    invoke-virtual {v0, v3}, Lcom/genymobile/scrcpy/VideoSettings;->setMaxFps(I)V

    .line 232
    invoke-virtual {v0, v4}, Lcom/genymobile/scrcpy/VideoSettings;->setIFrameInterval(B)V

    .line 233
    invoke-virtual {v0, v5, v6}, Lcom/genymobile/scrcpy/VideoSettings;->setBounds(II)V

    if-nez v7, :cond_a4

    if-nez v9, :cond_a4

    if-nez v8, :cond_a4

    if-nez v10, :cond_a4

    const/4 v1, 0x0

    .line 235
    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/VideoSettings;->setCrop(Landroid/graphics/Rect;)V

    goto :goto_ac

    .line 237
    :cond_a4
    new-instance v1, Landroid/graphics/Rect;

    invoke-direct {v1, v7, v8, v9, v10}, Landroid/graphics/Rect;-><init>(IIII)V

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/VideoSettings;->setCrop(Landroid/graphics/Rect;)V

    :goto_ac
    move/from16 v11, v17

    .line 239
    invoke-virtual {v0, v11}, Lcom/genymobile/scrcpy/VideoSettings;->setSendFrameMeta(Z)V

    move/from16 v1, v16

    .line 240
    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/VideoSettings;->setLockedVideoOrientation(I)V

    if-lez p1, :cond_bd

    move/from16 v1, p1

    .line 242
    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/VideoSettings;->setDisplayId(I)V

    :cond_bd
    return-void
.end method


# virtual methods
.method public equals(Ljava/lang/Object;)Z
    .registers 6

    const/4 v0, 0x1

    if-ne p0, p1, :cond_4

    return v0

    :cond_4
    const/4 v1, 0x0

    if-eqz p1, :cond_63

    .line 251
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    invoke-virtual {p1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v3

    if-eq v2, v3, :cond_12

    goto :goto_63

    .line 255
    :cond_12
    check-cast p1, Lcom/genymobile/scrcpy/VideoSettings;

    .line 256
    iget v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    iget v3, p1, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    if-ne v2, v3, :cond_63

    iget v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    iget v3, p1, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    if-ne v2, v3, :cond_63

    iget v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    iget v3, p1, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    if-ne v2, v3, :cond_63

    iget-byte v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    iget-byte v3, p1, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    if-ne v2, v3, :cond_63

    iget-boolean v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    iget-boolean v3, p1, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    if-ne v2, v3, :cond_63

    iget v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    iget v3, p1, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    if-eq v2, v3, :cond_39

    goto :goto_63

    .line 260
    :cond_39
    iget-object v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    iget-object v3, p1, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    invoke-static {v2, v3}, Ljava/util/Objects;->equals(Ljava/lang/Object;Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_63

    iget-object v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    iget-object v3, p1, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    invoke-static {v2, v3}, Ljava/util/Objects;->equals(Ljava/lang/Object;Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_63

    iget-object v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    iget-object v3, p1, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    .line 261
    invoke-static {v2, v3}, Ljava/util/Objects;->equals(Ljava/lang/Object;Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_63

    iget-object v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    iget-object p1, p1, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    invoke-static {v2, p1}, Ljava/util/Objects;->equals(Ljava/lang/Object;Ljava/lang/Object;)Z

    move-result p1

    if-nez p1, :cond_62

    goto :goto_63

    :cond_62
    return v0

    :cond_63
    :goto_63
    return v1
.end method

.method public getBitRate()I
    .registers 2

    .line 28
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    return v0
.end method

.method public getBounds()Lcom/genymobile/scrcpy/Size;
    .registers 2

    .line 84
    iget-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    return-object v0
.end method

.method public getCodecOptions()Ljava/util/List;
    .registers 2
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()",
            "Ljava/util/List<",
            "Lcom/genymobile/scrcpy/CodecOption;",
            ">;"
        }
    .end annotation

    .line 96
    iget-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptions:Ljava/util/List;

    return-object v0
.end method

.method public getCrop()Landroid/graphics/Rect;
    .registers 2

    .line 44
    iget-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    return-object v0
.end method

.method public getDisplayId()I
    .registers 2

    .line 60
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    return v0
.end method

.method public getEncoderName()Ljava/lang/String;
    .registers 2

    .line 109
    iget-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    return-object v0
.end method

.method public getIFrameInterval()I
    .registers 2

    .line 36
    iget-byte v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    return v0
.end method

.method public getLockedVideoOrientation()I
    .registers 2

    .line 76
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    return v0
.end method

.method public getMaxFps()I
    .registers 2

    .line 68
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    return v0
.end method

.method public getSendFrameMeta()Z
    .registers 2

    .line 52
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    return v0
.end method

.method public hashCode()I
    .registers 4

    const/16 v0, 0xa

    new-array v0, v0, [Ljava/lang/Object;

    .line 269
    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/4 v2, 0x0

    aput-object v1, v0, v2

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/4 v2, 0x1

    aput-object v1, v0, v2

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/4 v2, 0x2

    aput-object v1, v0, v2

    iget-byte v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    invoke-static {v1}, Ljava/lang/Byte;->valueOf(B)Ljava/lang/Byte;

    move-result-object v1

    const/4 v2, 0x3

    aput-object v1, v0, v2

    iget-boolean v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    invoke-static {v1}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v1

    const/4 v2, 0x4

    aput-object v1, v0, v2

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    .line 270
    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/4 v2, 0x5

    aput-object v1, v0, v2

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    invoke-static {v1}, Ljava/util/Objects;->hashCode(Ljava/lang/Object;)I

    move-result v1

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/4 v2, 0x6

    aput-object v1, v0, v2

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    invoke-static {v1}, Ljava/util/Objects;->hashCode(Ljava/lang/Object;)I

    move-result v1

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/4 v2, 0x7

    aput-object v1, v0, v2

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    .line 271
    invoke-static {v1}, Ljava/util/Objects;->hashCode(Ljava/lang/Object;)I

    move-result v1

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/16 v2, 0x8

    aput-object v1, v0, v2

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    invoke-static {v1}, Ljava/util/Objects;->hashCode(Ljava/lang/Object;)I

    move-result v1

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/16 v2, 0x9

    aput-object v1, v0, v2

    .line 269
    invoke-static {v0}, Ljava/util/Objects;->hash([Ljava/lang/Object;)I

    move-result v0

    return v0
.end method

.method public merge(Lcom/genymobile/scrcpy/VideoSettings;)V
    .registers 3

    .line 175
    iget-object v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->codecOptions:Ljava/util/List;

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptions:Ljava/util/List;

    .line 176
    iget-object v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    .line 177
    iget-object v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    .line 178
    iget v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    iput v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    .line 179
    iget v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    iput v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    .line 180
    iget-byte v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    iput-byte v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    .line 181
    iget-object v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    .line 182
    iget-object v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    .line 183
    iget-boolean v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    iput-boolean v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    .line 184
    iget v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    iput v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    .line 185
    iget p1, p1, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    iput p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    return-void
.end method

.method public setBitRate(I)V
    .registers 2

    .line 32
    iput p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    return-void
.end method

.method public setBounds(II)V
    .registers 4

    .line 92
    new-instance v0, Lcom/genymobile/scrcpy/Size;

    and-int/lit8 p1, p1, -0x10

    and-int/lit8 p2, p2, -0x10

    invoke-direct {v0, p1, p2}, Lcom/genymobile/scrcpy/Size;-><init>(II)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    return-void
.end method

.method public setBounds(Lcom/genymobile/scrcpy/Size;)V
    .registers 2

    .line 88
    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    return-void
.end method

.method public setCodecOptions(Ljava/lang/String;)V
    .registers 3

    .line 100
    invoke-static {p1}, Lcom/genymobile/scrcpy/CodecOption;->parse(Ljava/lang/String;)Ljava/util/List;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptions:Ljava/util/List;

    const-string v0, "-"

    .line 101
    invoke-virtual {p1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_12

    const/4 p1, 0x0

    .line 102
    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    goto :goto_14

    .line 104
    :cond_12
    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    :goto_14
    return-void
.end method

.method public setCrop(Landroid/graphics/Rect;)V
    .registers 2

    .line 48
    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    return-void
.end method

.method public setDisplayId(I)V
    .registers 2

    .line 64
    iput p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    return-void
.end method

.method public setEncoderName(Ljava/lang/String;)V
    .registers 3

    if-eqz p1, :cond_e

    const-string v0, "-"

    .line 113
    invoke-virtual {p1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_e

    const/4 p1, 0x0

    .line 114
    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    goto :goto_10

    .line 116
    :cond_e
    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    :goto_10
    return-void
.end method

.method public setIFrameInterval(B)V
    .registers 2

    .line 40
    iput-byte p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    return-void
.end method

.method public setLockedVideoOrientation(I)V
    .registers 2

    .line 80
    iput p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    return-void
.end method

.method public setMaxFps(I)V
    .registers 2

    .line 72
    iput p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    return-void
.end method

.method public setSendFrameMeta(Z)V
    .registers 2

    .line 56
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    return-void
.end method

.method public toByteArray()[B
    .registers 8

    const/4 v0, 0x0

    new-array v1, v0, [B

    .line 125
    iget-object v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    if-eqz v2, :cond_10

    .line 126
    sget-object v1, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v2, v1}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v1

    .line 127
    array-length v2, v1

    add-int/2addr v2, v0

    goto :goto_11

    :cond_10
    const/4 v2, 0x0

    :goto_11
    new-array v3, v0, [B

    .line 130
    iget-object v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    if-eqz v4, :cond_1f

    .line 131
    sget-object v3, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v4, v3}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v3

    .line 132
    array-length v4, v3

    add-int/2addr v2, v4

    :cond_1f
    const/16 v4, 0x23

    add-int/2addr v4, v2

    .line 134
    invoke-static {v4}, Ljava/nio/ByteBuffer;->allocate(I)Ljava/nio/ByteBuffer;

    move-result-object v2

    .line 135
    iget v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    invoke-virtual {v2, v4}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 136
    iget v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    invoke-virtual {v2, v4}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 137
    iget-byte v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    invoke-virtual {v2, v4}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 140
    iget-object v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    if-eqz v4, :cond_44

    .line 141
    invoke-virtual {v4}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v4

    .line 142
    iget-object v5, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v5}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v5

    goto :goto_46

    :cond_44
    const/4 v4, 0x0

    const/4 v5, 0x0

    :goto_46
    int-to-short v4, v4

    .line 144
    invoke-virtual {v2, v4}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    int-to-short v4, v5

    .line 145
    invoke-virtual {v2, v4}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    .line 150
    iget-object v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    if-eqz v4, :cond_61

    .line 151
    iget v0, v4, Landroid/graphics/Rect;->left:I

    .line 152
    iget-object v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    iget v4, v4, Landroid/graphics/Rect;->top:I

    .line 153
    iget-object v5, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    iget v5, v5, Landroid/graphics/Rect;->right:I

    .line 154
    iget-object v6, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    iget v6, v6, Landroid/graphics/Rect;->bottom:I

    goto :goto_64

    :cond_61
    const/4 v4, 0x0

    const/4 v5, 0x0

    const/4 v6, 0x0

    :goto_64
    int-to-short v0, v0

    .line 156
    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    int-to-short v0, v4

    .line 157
    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    int-to-short v0, v5

    .line 158
    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    int-to-short v0, v6

    .line 159
    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    .line 160
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    int-to-byte v0, v0

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 161
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    int-to-byte v0, v0

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 162
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 163
    array-length v0, v1

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 164
    array-length v0, v1

    if-eqz v0, :cond_8f

    .line 165
    invoke-virtual {v2, v1}, Ljava/nio/ByteBuffer;->put([B)Ljava/nio/ByteBuffer;

    .line 167
    :cond_8f
    array-length v0, v3

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 168
    array-length v0, v3

    if-eqz v0, :cond_99

    .line 169
    invoke-virtual {v2, v3}, Ljava/nio/ByteBuffer;->put([B)Ljava/nio/ByteBuffer;

    .line 171
    :cond_99
    invoke-virtual {v2}, Ljava/nio/ByteBuffer;->array()[B

    move-result-object v0

    return-object v0
.end method

.method public toString()Ljava/lang/String;
    .registers 4

    .line 276
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "VideoSettings{bitRate="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v1, ", maxFps="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v1, ", iFrameInterval="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-byte v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v1, ", bounds="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    const-string v1, ", crop="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    const-string v1, ", metaFrame="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-boolean v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    const-string v1, ", lockedVideoOrientation="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v1, ", displayId="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v1, ", codecOptions="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    const-string v2, "-"

    if-nez v1, :cond_61

    move-object v1, v2

    :cond_61
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v1, ", encoderName="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    if-nez v1, :cond_6e

    goto :goto_6f

    :cond_6e
    move-object v2, v1

    :goto_6f
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v1, "}"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
