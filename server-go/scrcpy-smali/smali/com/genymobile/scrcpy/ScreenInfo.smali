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
    .locals 0

    .line 30
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 31
    iput-object p1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    .line 32
    iput-object p2, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    .line 33
    iput p3, p0, Lcom/genymobile/scrcpy/ScreenInfo;->deviceRotation:I

    .line 34
    iput p4, p0, Lcom/genymobile/scrcpy/ScreenInfo;->lockedVideoOrientation:I

    return-void
.end method

.method public static computeScreenInfo(Lcom/genymobile/scrcpy/DisplayInfo;Lcom/genymobile/scrcpy/VideoSettings;)Lcom/genymobile/scrcpy/ScreenInfo;
    .locals 7

    .line 86
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/VideoSettings;->getLockedVideoOrientation()I

    move-result v0

    .line 87
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/VideoSettings;->getCrop()Landroid/graphics/Rect;

    move-result-object v1

    .line 88
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/DisplayInfo;->getRotation()I

    move-result v2

    const/4 v3, -0x2

    if-ne v0, v3, :cond_0

    move v0, v2

    .line 95
    :cond_0
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/DisplayInfo;->getSize()Lcom/genymobile/scrcpy/Size;

    move-result-object p0

    .line 96
    new-instance v3, Landroid/graphics/Rect;

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v4

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v5

    const/4 v6, 0x0

    invoke-direct {v3, v6, v6, v4, v5}, Landroid/graphics/Rect;-><init>(IIII)V

    if-eqz v1, :cond_2

    .line 98
    rem-int/lit8 v4, v2, 0x2

    if-eqz v4, :cond_1

    .line 100
    invoke-static {v1}, Lcom/genymobile/scrcpy/ScreenInfo;->flipRect(Landroid/graphics/Rect;)Landroid/graphics/Rect;

    move-result-object v1

    .line 102
    :cond_1
    invoke-virtual {v3, v1}, Landroid/graphics/Rect;->intersect(Landroid/graphics/Rect;)Z

    move-result v4

    if-nez v4, :cond_2

    .line 104
    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "Crop rectangle ("

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-static {v1}, Lcom/genymobile/scrcpy/ScreenInfo;->formatCrop(Landroid/graphics/Rect;)Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v3, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v1, ") does not intersect device screen ("

    invoke-virtual {v3, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/Size;->toRect()Landroid/graphics/Rect;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/ScreenInfo;->formatCrop(Landroid/graphics/Rect;)Ljava/lang/String;

    move-result-object p0

    invoke-virtual {v3, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p0, ")"

    invoke-virtual {v3, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 105
    new-instance v3, Landroid/graphics/Rect;

    invoke-direct {v3}, Landroid/graphics/Rect;-><init>()V

    .line 109
    :cond_2
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/VideoSettings;->getBounds()Lcom/genymobile/scrcpy/Size;

    move-result-object p0

    .line 110
    invoke-virtual {v3}, Landroid/graphics/Rect;->width()I

    move-result p1

    invoke-virtual {v3}, Landroid/graphics/Rect;->height()I

    move-result v1

    invoke-static {p1, v1, p0}, Lcom/genymobile/scrcpy/ScreenInfo;->computeVideoSize(IILcom/genymobile/scrcpy/Size;)Lcom/genymobile/scrcpy/Size;

    move-result-object p0

    .line 111
    new-instance p1, Lcom/genymobile/scrcpy/ScreenInfo;

    invoke-direct {p1, v3, p0, v2, v0}, Lcom/genymobile/scrcpy/ScreenInfo;-><init>(Landroid/graphics/Rect;Lcom/genymobile/scrcpy/Size;II)V

    return-object p1
.end method

.method private static computeVideoSize(IILcom/genymobile/scrcpy/Size;)Lcom/genymobile/scrcpy/Size;
    .locals 2

    if-nez p2, :cond_0

    and-int/lit8 p0, p0, -0x10

    and-int/lit8 p1, p1, -0x10

    .line 122
    new-instance p2, Lcom/genymobile/scrcpy/Size;

    invoke-direct {p2, p0, p1}, Lcom/genymobile/scrcpy/Size;-><init>(II)V

    return-object p2

    .line 124
    :cond_0
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v0

    .line 125
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result p2

    if-le v0, p0, :cond_1

    move v1, p1

    goto :goto_0

    :cond_1
    mul-int v1, v0, p1

    .line 131
    div-int/2addr v1, p0

    :goto_0
    if-le p2, v1, :cond_2

    move p2, v1

    :cond_2
    if-ne p2, p1, :cond_3

    goto :goto_1

    :cond_3
    mul-int p0, p0, p2

    .line 139
    div-int/2addr p0, p1

    :goto_1
    if-le v0, p0, :cond_4

    move v0, p0

    :cond_4
    and-int/lit8 p0, v0, -0x10

    and-int/lit8 p1, p2, -0x10

    .line 146
    new-instance p2, Lcom/genymobile/scrcpy/Size;

    invoke-direct {p2, p0, p1}, Lcom/genymobile/scrcpy/Size;-><init>(II)V

    return-object p2
.end method

.method private static flipRect(Landroid/graphics/Rect;)Landroid/graphics/Rect;
    .locals 4

    .line 150
    new-instance v0, Landroid/graphics/Rect;

    iget v1, p0, Landroid/graphics/Rect;->top:I

    iget v2, p0, Landroid/graphics/Rect;->left:I

    iget v3, p0, Landroid/graphics/Rect;->bottom:I

    iget p0, p0, Landroid/graphics/Rect;->right:I

    invoke-direct {v0, v1, v2, v3, p0}, Landroid/graphics/Rect;-><init>(IIII)V

    return-object v0
.end method

.method private static formatCrop(Landroid/graphics/Rect;)Ljava/lang/String;
    .locals 3

    .line 115
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {p0}, Landroid/graphics/Rect;->width()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v1, ":"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Landroid/graphics/Rect;->height()I

    move-result v2

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v2, p0, Landroid/graphics/Rect;->left:I

    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget p0, p0, Landroid/graphics/Rect;->top:I

    invoke-virtual {v0, p0}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    return-object p0
.end method


# virtual methods
.method public getContentRect()Landroid/graphics/Rect;
    .locals 1

    .line 38
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    return-object v0
.end method

.method public getDeviceRotation()I
    .locals 1

    .line 64
    iget v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->deviceRotation:I

    return v0
.end method

.method public getReverseVideoRotation()I
    .locals 2

    .line 172
    iget v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->lockedVideoOrientation:I

    const/4 v1, -0x1

    if-ne v0, v1, :cond_0

    const/4 v0, 0x0

    return v0

    :cond_0
    add-int/lit8 v0, v0, 0x4

    .line 176
    iget v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->deviceRotation:I

    sub-int/2addr v0, v1

    rem-int/lit8 v0, v0, 0x4

    return v0
.end method

.method public getUnlockedVideoSize()Lcom/genymobile/scrcpy/Size;
    .locals 1

    .line 47
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    return-object v0
.end method

.method public getVideoRotation()I
    .locals 2

    .line 159
    iget v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->lockedVideoOrientation:I

    const/4 v1, -0x1

    if-ne v0, v1, :cond_0

    const/4 v0, 0x0

    return v0

    .line 163
    :cond_0
    iget v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->deviceRotation:I

    add-int/lit8 v1, v1, 0x4

    sub-int/2addr v1, v0

    rem-int/lit8 v1, v1, 0x4

    return v1
.end method

.method public getVideoSize()Lcom/genymobile/scrcpy/Size;
    .locals 1

    .line 56
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ScreenInfo;->getVideoRotation()I

    move-result v0

    rem-int/lit8 v0, v0, 0x2

    if-nez v0, :cond_0

    .line 57
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    return-object v0

    .line 60
    :cond_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Size;->rotate()Lcom/genymobile/scrcpy/Size;

    move-result-object v0

    return-object v0
.end method

.method public toByteArray()[B
    .locals 2

    const/16 v0, 0x19

    .line 180
    invoke-static {v0}, Ljava/nio/ByteBuffer;->allocate(I)Ljava/nio/ByteBuffer;

    move-result-object v0

    .line 181
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    iget v1, v1, Landroid/graphics/Rect;->left:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 182
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    iget v1, v1, Landroid/graphics/Rect;->top:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 183
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    iget v1, v1, Landroid/graphics/Rect;->right:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 184
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    iget v1, v1, Landroid/graphics/Rect;->bottom:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 185
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 186
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 187
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ScreenInfo;->getVideoRotation()I

    move-result v1

    int-to-byte v1, v1

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 188
    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->array()[B

    move-result-object v0

    return-object v0
.end method

.method public withDeviceRotation(I)Lcom/genymobile/scrcpy/ScreenInfo;
    .locals 4

    .line 68
    iget v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->deviceRotation:I

    if-ne p1, v0, :cond_0

    return-object p0

    :cond_0
    add-int/2addr v0, p1

    .line 72
    rem-int/lit8 v0, v0, 0x2

    if-eqz v0, :cond_1

    const/4 v0, 0x1

    goto :goto_0

    :cond_1
    const/4 v0, 0x0

    :goto_0
    if-eqz v0, :cond_2

    .line 76
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    invoke-static {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->flipRect(Landroid/graphics/Rect;)Landroid/graphics/Rect;

    move-result-object v0

    .line 77
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->rotate()Lcom/genymobile/scrcpy/Size;

    move-result-object v1

    goto :goto_1

    .line 79
    :cond_2
    iget-object v0, p0, Lcom/genymobile/scrcpy/ScreenInfo;->contentRect:Landroid/graphics/Rect;

    .line 80
    iget-object v1, p0, Lcom/genymobile/scrcpy/ScreenInfo;->unlockedVideoSize:Lcom/genymobile/scrcpy/Size;

    .line 82
    :goto_1
    new-instance v2, Lcom/genymobile/scrcpy/ScreenInfo;

    iget v3, p0, Lcom/genymobile/scrcpy/ScreenInfo;->lockedVideoOrientation:I

    invoke-direct {v2, v0, v1, p1, v3}, Lcom/genymobile/scrcpy/ScreenInfo;-><init>(Landroid/graphics/Rect;Lcom/genymobile/scrcpy/Size;II)V

    return-object v2
.end method
