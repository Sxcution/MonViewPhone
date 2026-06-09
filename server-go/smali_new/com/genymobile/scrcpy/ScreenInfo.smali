.class public final Lcom/genymobile/scrcpy/ScreenInfo;
.super Ljava/lang/Object;
.source "ScreenInfo.java"


# instance fields
.field private final contentRect:Landroid/graphics/Rect;

.field private final deviceRotation:I

.field private final lockedVideoOrientation:I

.field private final unlockedVideoSize:Lcom/genymobile/scrcpy/Size;


# direct methods
.method public constructor <init>(Landroid/graphics/Rect;Lcom/genymobile/scrcpy/Size;II)V
    .registers 5

    .line 13
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 14
    iput-object p1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    .line 15
    iput-object p2, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    .line 16
    iput p3, p0, Lcom/genymobile/scrcpy/ScreenInfo;->deviceRotation:I

    .line 17
    iput p4, p0, Lcom/genymobile/scrcpy/ScreenInfo;->lockedVideoOrientation:I

    .line 18
    return-void
.end method

.method public static computeScreenInfo(Lcom/genymobile/scrcpy/DisplayInfo;Lcom/genymobile/scrcpy/VideoSettings;)Lcom/genymobile/scrcpy/ScreenInfo;
    .registers 9

    .line 57
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/VideoSettings;->getLockedVideoOrientation()I

    move-result v0

    .line 58
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/VideoSettings;->getCrop()Landroid/graphics/Rect;

    move-result-object v1

    .line 59
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/DisplayInfo;->getRotation()I

    move-result v2

    .line 60
    const/4 v3, -0x2

    if-ne v0, v3, :cond_10

    .line 61
    move v0, v2

    .line 63
    :cond_10
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/DisplayInfo;->getSize()Lcom/genymobile/scrcpy/Size;

    move-result-object p0

    .line 64
    new-instance v3, Landroid/graphics/Rect;

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v4

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v5

    const/4 v6, 0x0

    invoke-direct {v3, v6, v6, v4, v5}, Landroid/graphics/Rect;-><init>(IIII)V

    .line 65
    if-eqz v1, :cond_69

    .line 66
    rem-int/lit8 v4, v2, 0x2

    if-eqz v4, :cond_2c

    .line 67
    invoke-static {v1}, Lcom/genymobile/scrcpy/ScreenInfo;->flipRect(Landroid/graphics/Rect;)Landroid/graphics/Rect;

    move-result-object v1

    .line 69
    :cond_2c
    invoke-virtual {v3, v1}, Landroid/graphics/Rect;->intersect(Landroid/graphics/Rect;)Z

    move-result v4

    if-nez v4, :cond_69

    .line 70
    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "Crop rectangle ("

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-static {v1}, Lcom/genymobile/scrcpy/ScreenInfo;->formatCrop(Landroid/graphics/Rect;)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v3, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    const-string v3, ") does not intersect device screen ("

    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/Size;->toRect()Landroid/graphics/Rect;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/ScreenInfo;->formatCrop(Landroid/graphics/Rect;)Ljava/lang/String;

    move-result-object p0

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string v1, ")"

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 71
    new-instance v3, Landroid/graphics/Rect;

    invoke-direct {v3}, Landroid/graphics/Rect;-><init>()V

    .line 74
    :cond_69
    new-instance p0, Lcom/genymobile/scrcpy/ScreenInfo;

    invoke-virtual {v3}, Landroid/graphics/Rect;->width()I

    move-result v1

    invoke-virtual {v3}, Landroid/graphics/Rect;->height()I

    move-result v4

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/VideoSettings;->getBounds()Lcom/genymobile/scrcpy/Size;

    move-result-object p1

    invoke-static {v1, v4, p1}, Lcom/genymobile/scrcpy/ScreenInfo;->computeVideoSize(IILcom/genymobile/scrcpy/Size;)Lcom/genymobile/scrcpy/Size;

    move-result-object p1

    invoke-direct {p0, v3, p1, v2, v0}, Lcom/genymobile/scrcpy/ScreenInfo;-><init>(Landroid/graphics/Rect;Lcom/genymobile/scrcpy/Size;II)V

    return-object p0
.end method

.method private static computeVideoSize(IILcom/genymobile/scrcpy/Size;)Lcom/genymobile/scrcpy/Size;
    .registers 5

    .line 82
    if-nez p2, :cond_c

    .line 83
    new-instance p2, Lcom/genymobile/scrcpy/Size;

    and-int/lit8 p0, p0, -0x10

    and-int/lit8 p1, p1, -0x10

    invoke-direct {p2, p0, p1}, Lcom/genymobile/scrcpy/Size;-><init>(II)V

    return-object p2

    .line 85
    :cond_c
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v0

    .line 86
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result p2

    .line 87
    if-le v0, p0, :cond_18

    move v1, p1

    goto :goto_1b

    :cond_18
    mul-int v1, v0, p1

    div-int/2addr v1, p0

    .line 88
    :goto_1b
    if-le p2, v1, :cond_1e

    .line 89
    move p2, v1

    .line 91
    :cond_1e
    if-eq p2, p1, :cond_23

    .line 92
    mul-int p0, p0, p2

    div-int/2addr p0, p1

    .line 94
    :cond_23
    if-le v0, p0, :cond_26

    .line 95
    move v0, p0

    .line 97
    :cond_26
    new-instance p0, Lcom/genymobile/scrcpy/Size;

    and-int/lit8 p1, v0, -0x10

    and-int/lit8 p2, p2, -0x10

    invoke-direct {p0, p1, p2}, Lcom/genymobile/scrcpy/Size;-><init>(II)V

    return-object p0
.end method

.method private static flipRect(Landroid/graphics/Rect;)Landroid/graphics/Rect;
    .registers 5

    .line 101
    new-instance v0, Landroid/graphics/Rect;

    iget v1, p0, Landroid/graphics/Rect;->top:I

    iget v2, p0, Landroid/graphics/Rect;->left:I

    iget v3, p0, Landroid/graphics/Rect;->bottom:I

    iget p0, p0, Landroid/graphics/Rect;->right:I

    invoke-direct {v0, v1, v2, v3, p0}, Landroid/graphics/Rect;-><init>(IIII)V

    return-object v0
.end method

.method private static formatCrop(Landroid/graphics/Rect;)Ljava/lang/String;
    .registers 4

    .line 78
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {p0}, Landroid/graphics/Rect;->width()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v1, ":"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {p0}, Landroid/graphics/Rect;->height()I

    move-result v2

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    iget v2, p0, Landroid/graphics/Rect;->left:I

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    iget p0, p0, Landroid/graphics/Rect;->top:I

    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    return-object p0
.end method


# virtual methods
.method public getContentRect()Landroid/graphics/Rect;
    .registers 2

    .line 21
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    return-object v0
.end method

.method public getDeviceRotation()I
    .registers 2

    .line 36
    iget v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->deviceRotation:I

    return v0
.end method

.method public getReverseVideoRotation()I
    .registers 3

    .line 113
    iget v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->lockedVideoOrientation:I

    .line 114
    const/4 v1, -0x1

    if-ne v0, v1, :cond_7

    .line 115
    const/4 v0, 0x0

    return v0

    .line 117
    :cond_7
    add-int/lit8 v0, v0, 0x4

    iget v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->deviceRotation:I

    sub-int/2addr v0, v1

    rem-int/lit8 v0, v0, 0x4

    return v0
.end method

.method public getUnlockedVideoSize()Lcom/genymobile/scrcpy/Size;
    .registers 2

    .line 25
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    return-object v0
.end method

.method public getVideoRotation()I
    .registers 3

    .line 105
    iget v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->lockedVideoOrientation:I

    .line 106
    const/4 v1, -0x1

    if-ne v0, v1, :cond_7

    .line 107
    const/4 v0, 0x0

    return v0

    .line 109
    :cond_7
    iget v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->deviceRotation:I

    add-int/lit8 v1, v1, 0x4

    sub-int/2addr v1, v0

    rem-int/lit8 v1, v1, 0x4

    return v1
.end method

.method public getVideoSize()Lcom/genymobile/scrcpy/Size;
    .registers 2

    .line 29
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ScreenInfo;->getVideoRotation()I

    move-result v0

    rem-int/lit8 v0, v0, 0x2

    if-nez v0, :cond_b

    .line 30
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    return-object v0

    .line 32
    :cond_b
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Size;->rotate()Lcom/genymobile/scrcpy/Size;

    move-result-object v0

    return-object v0
.end method

.method public toByteArray()[B
    .registers 3

    .line 121
    const/16 v0, 0x19

    invoke-static {v0}, Ljava/nio/ByteBuffer;->allocate(I)Ljava/nio/ByteBuffer;

    move-result-object v0

    .line 122
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    iget v1, v1, Landroid/graphics/Rect;->left:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 123
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    iget v1, v1, Landroid/graphics/Rect;->top:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 124
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    iget v1, v1, Landroid/graphics/Rect;->right:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 125
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    iget v1, v1, Landroid/graphics/Rect;->bottom:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 126
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 127
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 128
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ScreenInfo;->getVideoRotation()I

    move-result v1

    int-to-byte v1, v1

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 129
    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->array()[B

    move-result-object v0

    return-object v0
.end method

.method public withDeviceRotation(I)Lcom/genymobile/scrcpy/ScreenInfo;
    .registers 6

    .line 42
    iget v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->deviceRotation:I

    .line 43
    if-ne p1, v0, :cond_5

    .line 44
    return-object p0

    .line 46
    :cond_5
    add-int/2addr v0, p1

    rem-int/lit8 v0, v0, 0x2

    if-eqz v0, :cond_17

    .line 47
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    invoke-static {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->flipRect(Landroid/graphics/Rect;)Landroid/graphics/Rect;

    move-result-object v0

    .line 48
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->rotate()Lcom/genymobile/scrcpy/Size;

    move-result-object v1

    goto :goto_1b

    .line 50
    :cond_17
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    .line 51
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    .line 53
    :goto_1b
    new-instance v2, Lcom/genymobile/scrcpy/ScreenInfo;

    iget v3, p0, Lcom/genymobile/scrcpy/ScreenInfo;->lockedVideoOrientation:I

    invoke-direct {v2, v0, v1, p1, v3}, Lcom/genymobile/scrcpy/ScreenInfo;-><init>(Landroid/graphics/Rect;Lcom/genymobile/scrcpy/Size;II)V

    return-object v2
.end method
