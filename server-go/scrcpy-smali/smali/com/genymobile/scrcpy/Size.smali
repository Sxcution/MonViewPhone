.class public final Lcom/genymobile/scrcpy/Size;
.super Ljava/lang/Object;
.source "Size.java"


# instance fields
.field private final height:I

.field private final width:I


# direct methods
.method public constructor <init>(II)V
    .locals 0

    .line 11
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 12
    iput p1, p0, Lcom/genymobile/scrcpy/Size;->width:I

    .line 13
    iput p2, p0, Lcom/genymobile/scrcpy/Size;->height:I

    return-void
.end method


# virtual methods
.method public equals(Ljava/lang/Object;)Z
    .locals 4

    const/4 v0, 0x1

    if-ne p0, p1, :cond_0

    return v0

    :cond_0
    const/4 v1, 0x0

    if-eqz p1, :cond_3

    .line 37
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    invoke-virtual {p1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v3

    if-eq v2, v3, :cond_1

    goto :goto_1

    .line 40
    :cond_1
    check-cast p1, Lcom/genymobile/scrcpy/Size;

    .line 41
    iget v2, p0, Lcom/genymobile/scrcpy/Size;->width:I

    iget v3, p1, Lcom/genymobile/scrcpy/Size;->width:I

    if-ne v2, v3, :cond_2

    iget v2, p0, Lcom/genymobile/scrcpy/Size;->height:I

    iget p1, p1, Lcom/genymobile/scrcpy/Size;->height:I

    if-ne v2, p1, :cond_2

    goto :goto_0

    :cond_2
    const/4 v0, 0x0

    :goto_0
    return v0

    :cond_3
    :goto_1
    return v1
.end method

.method public getHeight()I
    .locals 1

    .line 21
    iget v0, p0, Lcom/genymobile/scrcpy/Size;->height:I

    return v0
.end method

.method public getWidth()I
    .locals 1

    .line 17
    iget v0, p0, Lcom/genymobile/scrcpy/Size;->width:I

    return v0
.end method

.method public hashCode()I
    .locals 3

    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    .line 46
    iget v1, p0, Lcom/genymobile/scrcpy/Size;->width:I

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/4 v2, 0x0

    aput-object v1, v0, v2

    iget v1, p0, Lcom/genymobile/scrcpy/Size;->height:I

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/4 v2, 0x1

    aput-object v1, v0, v2

    invoke-static {v0}, Ljava/util/Objects;->hash([Ljava/lang/Object;)I

    move-result v0

    return v0
.end method

.method public rotate()Lcom/genymobile/scrcpy/Size;
    .locals 3

    .line 25
    new-instance v0, Lcom/genymobile/scrcpy/Size;

    iget v1, p0, Lcom/genymobile/scrcpy/Size;->height:I

    iget v2, p0, Lcom/genymobile/scrcpy/Size;->width:I

    invoke-direct {v0, v1, v2}, Lcom/genymobile/scrcpy/Size;-><init>(II)V

    return-object v0
.end method

.method public toRect()Landroid/graphics/Rect;
    .locals 4

    .line 29
    new-instance v0, Landroid/graphics/Rect;

    iget v1, p0, Lcom/genymobile/scrcpy/Size;->width:I

    iget v2, p0, Lcom/genymobile/scrcpy/Size;->height:I

    const/4 v3, 0x0

    invoke-direct {v0, v3, v3, v1, v2}, Landroid/graphics/Rect;-><init>(IIII)V

    return-object v0
.end method

.method public toString()Ljava/lang/String;
    .locals 2

    .line 51
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Size{width="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v1, p0, Lcom/genymobile/scrcpy/Size;->width:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v1, ", height="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v1, p0, Lcom/genymobile/scrcpy/Size;->height:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const/16 v1, 0x7d

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
