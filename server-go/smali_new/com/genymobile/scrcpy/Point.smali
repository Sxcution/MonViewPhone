.class public Lcom/genymobile/scrcpy/Point;
.super Ljava/lang/Object;
.source "Point.java"


# instance fields
.field private final x:I

.field private final y:I


# direct methods
.method public constructor <init>(II)V
    .registers 3

    .line 10
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 11
    iput p1, p0, Lcom/genymobile/scrcpy/Point;->x:I

    .line 12
    iput p2, p0, Lcom/genymobile/scrcpy/Point;->y:I

    .line 13
    return-void
.end method


# virtual methods
.method public equals(Ljava/lang/Object;)Z
    .registers 6

    .line 24
    const/4 v0, 0x1

    if-ne p0, p1, :cond_4

    .line 25
    return v0

    .line 27
    :cond_4
    const/4 v1, 0x0

    if-eqz p1, :cond_23

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    invoke-virtual {p1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v3

    if-eq v2, v3, :cond_12

    goto :goto_23

    .line 30
    :cond_12
    check-cast p1, Lcom/genymobile/scrcpy/Point;

    .line 31
    iget v2, p0, Lcom/genymobile/scrcpy/Point;->x:I

    iget v3, p1, Lcom/genymobile/scrcpy/Point;->x:I

    if-ne v2, v3, :cond_21

    iget v2, p0, Lcom/genymobile/scrcpy/Point;->y:I

    iget p1, p1, Lcom/genymobile/scrcpy/Point;->y:I

    if-ne v2, p1, :cond_21

    goto :goto_22

    :cond_21
    const/4 v0, 0x0

    :goto_22
    return v0

    .line 28
    :cond_23
    :goto_23
    return v1
.end method

.method public getX()I
    .registers 2

    .line 16
    iget v0, p0, Lcom/genymobile/scrcpy/Point;->x:I

    return v0
.end method

.method public getY()I
    .registers 2

    .line 20
    iget v0, p0, Lcom/genymobile/scrcpy/Point;->y:I

    return v0
.end method

.method public hashCode()I
    .registers 5

    .line 35
    iget v0, p0, Lcom/genymobile/scrcpy/Point;->x:I

    invoke-static {v0}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v0

    iget v1, p0, Lcom/genymobile/scrcpy/Point;->y:I

    invoke-static {v1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    const/4 v2, 0x2

    new-array v2, v2, [Ljava/lang/Object;

    const/4 v3, 0x0

    aput-object v0, v2, v3

    const/4 v0, 0x1

    aput-object v1, v2, v0

    invoke-static {v2}, Ljava/util/Objects;->hash([Ljava/lang/Object;)I

    move-result v0

    return v0
.end method

.method public toString()Ljava/lang/String;
    .registers 3

    .line 39
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Point{x="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    iget v1, p0, Lcom/genymobile/scrcpy/Point;->x:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v1, ", y="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    iget v1, p0, Lcom/genymobile/scrcpy/Point;->y:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v0

    const/16 v1, 0x7d

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
