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

    .line 23
    const v0, 0x7a1200

    iput v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    .line 24
    const/16 v0, 0xa

    iput-byte v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    return-void
.end method

.method public static fromByteArray([B)Lcom/genymobile/scrcpy/VideoSettings;
    .registers 2

    .line 199
    new-instance v0, Lcom/genymobile/scrcpy/VideoSettings;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/VideoSettings;-><init>()V

    .line 200
    invoke-static {v0, p0}, Lcom/genymobile/scrcpy/VideoSettings;->mergeFromByteArray(Lcom/genymobile/scrcpy/VideoSettings;[B)V

    .line 201
    return-object v0
.end method

.method public static mergeFromByteArray(Lcom/genymobile/scrcpy/VideoSettings;[B)V
    .registers 20

    .line 210
    move-object/from16 v0, p0

    invoke-static/range {p1 .. p1}, Ljava/nio/ByteBuffer;->wrap([B)Ljava/nio/ByteBuffer;

    move-result-object v1

    .line 211
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v2

    .line 212
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v3

    .line 213
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->get()B

    move-result v4

    .line 214
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v5

    .line 215
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v6

    .line 216
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v7

    .line 217
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v8

    .line 218
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v9

    .line 219
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v10

    .line 220
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->get()B

    move-result v11

    const/4 v12, 0x0

    if-eqz v11, :cond_33

    const/4 v11, 0x1

    goto :goto_34

    :cond_33
    const/4 v11, 0x0

    .line 221
    :goto_34
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->get()B

    move-result v13

    .line 222
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v14

    .line 223
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v15

    if-lez v15, :cond_6e

    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v15

    if-gtz v15, :cond_4f

    move/from16 v17, v11

    move/from16 v16, v13

    move/from16 p1, v14

    goto :goto_74

    .line 228
    :cond_4f
    nop

    .line 229
    move/from16 p1, v14

    new-array v14, v15, [B

    .line 230
    invoke-virtual {v1, v14, v12, v15}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 231
    nop

    .line 232
    nop

    .line 233
    move/from16 v16, v13

    new-instance v13, Ljava/lang/String;

    move/from16 v17, v11

    sget-object v11, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-direct {v13, v14, v12, v15, v11}, Ljava/lang/String;-><init>([BIILjava/nio/charset/Charset;)V

    .line 234
    invoke-virtual {v13}, Ljava/lang/String;->isEmpty()Z

    move-result v11

    if-nez v11, :cond_77

    .line 235
    invoke-virtual {v0, v13}, Lcom/genymobile/scrcpy/VideoSettings;->setCodecOptions(Ljava/lang/String;)V

    goto :goto_77

    .line 223
    :cond_6e
    move/from16 v17, v11

    move/from16 v16, v13

    move/from16 p1, v14

    .line 224
    :goto_74
    nop

    .line 225
    nop

    .line 226
    nop

    .line 238
    :cond_77
    :goto_77
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v11

    if-lez v11, :cond_98

    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v11

    if-lez v11, :cond_98

    .line 239
    new-array v13, v11, [B

    .line 240
    invoke-virtual {v1, v13, v12, v11}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 241
    new-instance v1, Ljava/lang/String;

    sget-object v14, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-direct {v1, v13, v12, v11, v14}, Ljava/lang/String;-><init>([BIILjava/nio/charset/Charset;)V

    .line 242
    invoke-virtual {v1}, Ljava/lang/String;->isEmpty()Z

    move-result v11

    if-nez v11, :cond_98

    .line 243
    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/VideoSettings;->setEncoderName(Ljava/lang/String;)V

    .line 246
    :cond_98
    invoke-virtual {v0, v2}, Lcom/genymobile/scrcpy/VideoSettings;->setBitRate(I)V

    .line 247
    invoke-virtual {v0, v3}, Lcom/genymobile/scrcpy/VideoSettings;->setMaxFps(I)V

    .line 248
    invoke-virtual {v0, v4}, Lcom/genymobile/scrcpy/VideoSettings;->setIFrameInterval(B)V

    .line 249
    invoke-virtual {v0, v5, v6}, Lcom/genymobile/scrcpy/VideoSettings;->setBounds(II)V

    .line 250
    if-nez v7, :cond_b1

    if-nez v9, :cond_b1

    if-nez v8, :cond_b1

    if-nez v10, :cond_b1

    .line 251
    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/VideoSettings;->setCrop(Landroid/graphics/Rect;)V

    goto :goto_b9

    .line 253
    :cond_b1
    new-instance v1, Landroid/graphics/Rect;

    invoke-direct {v1, v7, v8, v9, v10}, Landroid/graphics/Rect;-><init>(IIII)V

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/VideoSettings;->setCrop(Landroid/graphics/Rect;)V

    .line 255
    :goto_b9
    move/from16 v11, v17

    invoke-virtual {v0, v11}, Lcom/genymobile/scrcpy/VideoSettings;->setSendFrameMeta(Z)V

    .line 256
    move/from16 v1, v16

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/VideoSettings;->setLockedVideoOrientation(I)V

    .line 257
    if-lez p1, :cond_ca

    .line 258
    move/from16 v1, p1

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/VideoSettings;->setDisplayId(I)V

    .line 260
    :cond_ca
    return-void
.end method


# virtual methods
.method public equals(Ljava/lang/Object;)Z
    .registers 5

    .line 263
    const/4 v0, 0x1

    if-ne p0, p1, :cond_4

    .line 264
    return v0

    .line 266
    :cond_4
    if-eqz p1, :cond_5f

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    invoke-virtual {p1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    if-ne v1, v2, :cond_5f

    .line 267
    check-cast p1, Lcom/genymobile/scrcpy/VideoSettings;

    .line 268
    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    iget v2, p1, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    if-ne v1, v2, :cond_5f

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    iget v2, p1, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    if-ne v1, v2, :cond_5f

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    iget v2, p1, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    if-ne v1, v2, :cond_5f

    iget-byte v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    iget-byte v2, p1, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    if-ne v1, v2, :cond_5f

    iget-boolean v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    iget-boolean v2, p1, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    if-ne v1, v2, :cond_5f

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    iget v2, p1, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    if-ne v1, v2, :cond_5f

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    iget-object v2, p1, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    invoke-static {v1, v2}, Ljava/util/Objects;->equals(Ljava/lang/Object;Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_5f

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    iget-object v2, p1, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    invoke-static {v1, v2}, Ljava/util/Objects;->equals(Ljava/lang/Object;Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_5f

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    iget-object v2, p1, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    invoke-static {v1, v2}, Ljava/util/Objects;->equals(Ljava/lang/Object;Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_5f

    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    iget-object p1, p1, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    invoke-static {v1, p1}, Ljava/util/Objects;->equals(Ljava/lang/Object;Ljava/lang/Object;)Z

    move-result p1

    if-eqz p1, :cond_5f

    .line 269
    return v0

    .line 272
    :cond_5f
    const/4 p1, 0x0

    return p1
.end method

.method public getBitRate()I
    .registers 2

    .line 27
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    return v0
.end method

.method public getBounds()Lcom/genymobile/scrcpy/Size;
    .registers 2

    .line 83
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

    .line 95
    iget-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptions:Ljava/util/List;

    return-object v0
.end method

.method public getCrop()Landroid/graphics/Rect;
    .registers 2

    .line 43
    iget-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    return-object v0
.end method

.method public getDisplayId()I
    .registers 2

    .line 59
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    return v0
.end method

.method public getEncoderName()Ljava/lang/String;
    .registers 2

    .line 108
    iget-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    return-object v0
.end method

.method public getIFrameInterval()I
    .registers 2

    .line 35
    iget-byte v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    return v0
.end method

.method public getLockedVideoOrientation()I
    .registers 2

    .line 75
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    return v0
.end method

.method public getMaxFps()I
    .registers 2

    .line 67
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    return v0
.end method

.method public getSendFrameMeta()Z
    .registers 2

    .line 51
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    return v0
.end method

.method public hashCode()I
    .registers 13

    .line 276
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    invoke-static {v0}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v0

    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    iget v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v2

    iget-byte v3, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    invoke-static {v3}, Ljava/lang/Byte;->valueOf(B)Ljava/lang/Byte;

    move-result-object v3

    iget-boolean v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    invoke-static {v4}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v4

    iget v5, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    invoke-static {v5}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v5

    iget-object v6, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    invoke-static {v6}, Ljava/util/Objects;->hashCode(Ljava/lang/Object;)I

    move-result v6

    invoke-static {v6}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v6

    iget-object v7, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    invoke-static {v7}, Ljava/util/Objects;->hashCode(Ljava/lang/Object;)I

    move-result v7

    invoke-static {v7}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v7

    iget-object v8, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    invoke-static {v8}, Ljava/util/Objects;->hashCode(Ljava/lang/Object;)I

    move-result v8

    invoke-static {v8}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v8

    iget-object v9, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    invoke-static {v9}, Ljava/util/Objects;->hashCode(Ljava/lang/Object;)I

    move-result v9

    invoke-static {v9}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v9

    const/16 v10, 0xa

    new-array v10, v10, [Ljava/lang/Object;

    const/4 v11, 0x0

    aput-object v0, v10, v11

    const/4 v0, 0x1

    aput-object v1, v10, v0

    const/4 v0, 0x2

    aput-object v2, v10, v0

    const/4 v0, 0x3

    aput-object v3, v10, v0

    const/4 v0, 0x4

    aput-object v4, v10, v0

    const/4 v0, 0x5

    aput-object v5, v10, v0

    const/4 v0, 0x6

    aput-object v6, v10, v0

    const/4 v0, 0x7

    aput-object v7, v10, v0

    const/16 v0, 0x8

    aput-object v8, v10, v0

    const/16 v0, 0x9

    aput-object v9, v10, v0

    invoke-static {v10}, Ljava/util/Objects;->hash([Ljava/lang/Object;)I

    move-result v0

    return v0
.end method

.method public merge(Lcom/genymobile/scrcpy/VideoSettings;)V
    .registers 3

    .line 185
    iget-object v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->codecOptions:Ljava/util/List;

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptions:Ljava/util/List;

    .line 186
    iget-object v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    .line 187
    iget-object v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    .line 188
    iget v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    iput v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    .line 189
    iget v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    iput v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    .line 190
    iget-byte v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    iput-byte v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    .line 191
    iget-object v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    .line 192
    iget-object v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    .line 193
    iget-boolean v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    iput-boolean v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    .line 194
    iget v0, p1, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    iput v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    .line 195
    iget p1, p1, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    iput p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    .line 196
    return-void
.end method

.method public setBitRate(I)V
    .registers 2

    .line 31
    iput p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    .line 32
    return-void
.end method

.method public setBounds(II)V
    .registers 4

    .line 91
    new-instance v0, Lcom/genymobile/scrcpy/Size;

    and-int/lit8 p1, p1, -0x10

    and-int/lit8 p2, p2, -0x10

    invoke-direct {v0, p1, p2}, Lcom/genymobile/scrcpy/Size;-><init>(II)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    .line 92
    return-void
.end method

.method public setBounds(Lcom/genymobile/scrcpy/Size;)V
    .registers 2

    .line 87
    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    .line 88
    return-void
.end method

.method public setCodecOptions(Ljava/lang/String;)V
    .registers 3

    .line 99
    invoke-static {p1}, Lcom/genymobile/scrcpy/CodecOption;->parse(Ljava/lang/String;)Ljava/util/List;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptions:Ljava/util/List;

    .line 100
    const-string v0, "-"

    invoke-virtual {p1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_12

    .line 101
    const/4 p1, 0x0

    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    goto :goto_14

    .line 103
    :cond_12
    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    .line 105
    :goto_14
    return-void
.end method

.method public setCrop(Landroid/graphics/Rect;)V
    .registers 2

    .line 47
    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    .line 48
    return-void
.end method

.method public setDisplayId(I)V
    .registers 2

    .line 63
    iput p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    .line 64
    return-void
.end method

.method public setEncoderName(Ljava/lang/String;)V
    .registers 3

    .line 112
    if-eqz p1, :cond_e

    const-string v0, "-"

    invoke-virtual {p1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_e

    .line 113
    const/4 p1, 0x0

    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    goto :goto_10

    .line 115
    :cond_e
    iput-object p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    .line 117
    :goto_10
    return-void
.end method

.method public setIFrameInterval(B)V
    .registers 2

    .line 39
    iput-byte p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    .line 40
    return-void
.end method

.method public setLockedVideoOrientation(I)V
    .registers 2

    .line 79
    iput p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    .line 80
    return-void
.end method

.method public setMaxFps(I)V
    .registers 2

    .line 71
    iput p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    .line 72
    return-void
.end method

.method public setSendFrameMeta(Z)V
    .registers 2

    .line 55
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    .line 56
    return-void
.end method

.method public toByteArray()[B
    .registers 8

    .line 126
    nop

    .line 127
    const/4 v0, 0x0

    new-array v1, v0, [B

    .line 128
    iget-object v2, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    .line 129
    if-eqz v2, :cond_11

    .line 130
    sget-object v1, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v2, v1}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v1

    .line 131
    array-length v2, v1

    add-int/2addr v2, v0

    goto :goto_12

    .line 133
    :cond_11
    const/4 v2, 0x0

    .line 135
    :goto_12
    new-array v3, v0, [B

    .line 136
    iget-object v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    .line 137
    if-eqz v4, :cond_20

    .line 138
    sget-object v3, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v4, v3}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v3

    .line 139
    array-length v4, v3

    add-int/2addr v2, v4

    .line 141
    :cond_20
    add-int/lit8 v2, v2, 0x23

    invoke-static {v2}, Ljava/nio/ByteBuffer;->allocate(I)Ljava/nio/ByteBuffer;

    move-result-object v2

    .line 142
    iget v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    invoke-virtual {v2, v4}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 143
    iget v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    invoke-virtual {v2, v4}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 144
    iget-byte v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    invoke-virtual {v2, v4}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 145
    iget-object v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    .line 146
    if-eqz v4, :cond_44

    .line 147
    invoke-virtual {v4}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v4

    .line 148
    iget-object v5, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v5}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v5

    goto :goto_47

    .line 150
    :cond_44
    nop

    .line 151
    const/4 v4, 0x0

    const/4 v5, 0x0

    .line 153
    :goto_47
    int-to-short v4, v4

    invoke-virtual {v2, v4}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    .line 154
    int-to-short v4, v5

    invoke-virtual {v2, v4}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    .line 155
    iget-object v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    .line 156
    if-eqz v4, :cond_62

    .line 157
    iget v0, v4, Landroid/graphics/Rect;->left:I

    .line 158
    iget-object v4, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    iget v4, v4, Landroid/graphics/Rect;->top:I

    .line 159
    iget-object v5, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    iget v5, v5, Landroid/graphics/Rect;->right:I

    .line 160
    iget-object v6, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    iget v6, v6, Landroid/graphics/Rect;->bottom:I

    goto :goto_67

    .line 162
    :cond_62
    nop

    .line 163
    nop

    .line 164
    const/4 v4, 0x0

    const/4 v5, 0x0

    const/4 v6, 0x0

    .line 166
    :goto_67
    int-to-short v0, v0

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    .line 167
    int-to-short v0, v4

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    .line 168
    int-to-short v0, v5

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    .line 169
    int-to-short v0, v6

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    .line 170
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 171
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    int-to-byte v0, v0

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 172
    iget v0, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 173
    array-length v0, v1

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 174
    array-length v0, v1

    if-eqz v0, :cond_91

    .line 175
    invoke-virtual {v2, v1}, Ljava/nio/ByteBuffer;->put([B)Ljava/nio/ByteBuffer;

    .line 177
    :cond_91
    array-length v0, v3

    invoke-virtual {v2, v0}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 178
    array-length v0, v3

    if-eqz v0, :cond_9b

    .line 179
    invoke-virtual {v2, v3}, Ljava/nio/ByteBuffer;->put([B)Ljava/nio/ByteBuffer;

    .line 181
    :cond_9b
    invoke-virtual {v2}, Ljava/nio/ByteBuffer;->array()[B

    move-result-object v0

    return-object v0
.end method

.method public toString()Ljava/lang/String;
    .registers 4

    .line 280
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    .line 281
    const-string v1, "VideoSettings{bitRate="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 282
    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bitRate:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    .line 283
    const-string v1, ", maxFps="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 284
    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->maxFps:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    .line 285
    const-string v1, ", iFrameInterval="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 286
    iget-byte v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->iFrameInterval:B

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    .line 287
    const-string v1, ", bounds="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 288
    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->bounds:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    .line 289
    const-string v1, ", crop="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 290
    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->crop:Landroid/graphics/Rect;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    .line 291
    const-string v1, ", metaFrame="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 292
    iget-boolean v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->sendFrameMeta:Z

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    .line 293
    const-string v1, ", lockedVideoOrientation="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 294
    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->lockedVideoOrientation:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    .line 295
    const-string v1, ", displayId="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 296
    iget v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->displayId:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    .line 297
    const-string v1, ", codecOptions="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 298
    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->codecOptionsString:Ljava/lang/String;

    .line 299
    const-string v2, "-"

    if-nez v1, :cond_61

    .line 300
    move-object v1, v2

    .line 302
    :cond_61
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 303
    const-string v1, ", encoderName="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 304
    iget-object v1, p0, Lcom/genymobile/scrcpy/VideoSettings;->encoderName:Ljava/lang/String;

    .line 305
    if-eqz v1, :cond_6e

    move-object v2, v1

    :cond_6e
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 306
    const-string v1, "}"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 307
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
