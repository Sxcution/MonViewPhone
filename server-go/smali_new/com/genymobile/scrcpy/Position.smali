.class public Lcom/genymobile/scrcpy/Position;
.super Ljava/lang/Object;
.source "Position.java"


# instance fields
.field private point:Lcom/genymobile/scrcpy/Point;

.field private screenSize:Lcom/genymobile/scrcpy/Size;


# direct methods
.method public constructor <init>(IIII)V
    .registers 6

    .line 16
    new-instance v0, Lcom/genymobile/scrcpy/Point;

    invoke-direct {v0, p1, p2}, Lcom/genymobile/scrcpy/Point;-><init>(II)V

    new-instance p1, Lcom/genymobile/scrcpy/Size;

    invoke-direct {p1, p3, p4}, Lcom/genymobile/scrcpy/Size;-><init>(II)V

    invoke-direct {p0, v0, p1}, Lcom/genymobile/scrcpy/Position;-><init>(Lcom/genymobile/scrcpy/Point;Lcom/genymobile/scrcpy/Size;)V

    .line 17
    return-void
.end method

.method public constructor <init>(Lcom/genymobile/scrcpy/Point;Lcom/genymobile/scrcpy/Size;)V
    .registers 3

    .line 10
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 11
    iput-object p1, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    .line 12
    iput-object p2, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    .line 13
    return-void
.end method


# virtual methods
.method public equals(Ljava/lang/Object;)Z
    .registers 6

    .line 38
    const/4 v0, 0x1

    if-ne p0, p1, :cond_4

    .line 39
    return v0

    .line 41
    :cond_4
    const/4 v1, 0x0

    if-eqz p1, :cond_2b

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    invoke-virtual {p1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v3

    if-eq v2, v3, :cond_12

    goto :goto_2b

    .line 44
    :cond_12
    check-cast p1, Lcom/genymobile/scrcpy/Position;

    .line 45
    iget-object v2, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    iget-object v3, p1, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    invoke-static {v2, v3}, Ljava/util/Objects;->equals(Ljava/lang/Object;Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_29

    iget-object v2, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    iget-object p1, p1, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    invoke-static {v2, p1}, Ljava/util/Objects;->equals(Ljava/lang/Object;Ljava/lang/Object;)Z

    move-result p1

    if-eqz p1, :cond_29

    goto :goto_2a

    :cond_29
    const/4 v0, 0x0

    :goto_2a
    return v0

    .line 42
    :cond_2b
    :goto_2b
    return v1
.end method

.method public getPoint()Lcom/genymobile/scrcpy/Point;
    .registers 2

    .line 20
    iget-object v0, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    return-object v0
.end method

.method public getScreenSize()Lcom/genymobile/scrcpy/Size;
    .registers 2

    .line 24
    iget-object v0, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    return-object v0
.end method

.method public hashCode()I
    .registers 5

    .line 49
    iget-object v0, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    iget-object v1, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

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

.method public rotate(I)Lcom/genymobile/scrcpy/Position;
    .registers 6

    .line 28
    const/4 v0, 0x1

    if-ne p1, v0, :cond_27

    .line 29
    new-instance p1, Lcom/genymobile/scrcpy/Position;

    new-instance v0, Lcom/genymobile/scrcpy/Point;

    iget-object v1, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v1

    iget-object v2, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Point;->getY()I

    move-result v2

    sub-int/2addr v1, v2

    iget-object v2, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Point;->getX()I

    move-result v2

    invoke-direct {v0, v1, v2}, Lcom/genymobile/scrcpy/Point;-><init>(II)V

    iget-object v1, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->rotate()Lcom/genymobile/scrcpy/Size;

    move-result-object v1

    invoke-direct {p1, v0, v1}, Lcom/genymobile/scrcpy/Position;-><init>(Lcom/genymobile/scrcpy/Point;Lcom/genymobile/scrcpy/Size;)V

    return-object p1

    .line 31
    :cond_27
    const/4 v0, 0x2

    if-eq p1, v0, :cond_53

    .line 32
    const/4 v0, 0x3

    if-eq p1, v0, :cond_2f

    move-object p1, p0

    goto :goto_52

    :cond_2f
    new-instance p1, Lcom/genymobile/scrcpy/Position;

    new-instance v0, Lcom/genymobile/scrcpy/Point;

    iget-object v1, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Point;->getY()I

    move-result v1

    iget-object v2, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v2

    iget-object v3, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    invoke-virtual {v3}, Lcom/genymobile/scrcpy/Point;->getX()I

    move-result v3

    sub-int/2addr v2, v3

    invoke-direct {v0, v1, v2}, Lcom/genymobile/scrcpy/Point;-><init>(II)V

    iget-object v1, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->rotate()Lcom/genymobile/scrcpy/Size;

    move-result-object v1

    invoke-direct {p1, v0, v1}, Lcom/genymobile/scrcpy/Position;-><init>(Lcom/genymobile/scrcpy/Point;Lcom/genymobile/scrcpy/Size;)V

    :goto_52
    return-object p1

    .line 34
    :cond_53
    new-instance p1, Lcom/genymobile/scrcpy/Position;

    new-instance v0, Lcom/genymobile/scrcpy/Point;

    iget-object v1, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v1

    iget-object v2, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Point;->getX()I

    move-result v2

    sub-int/2addr v1, v2

    iget-object v2, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v2

    iget-object v3, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    invoke-virtual {v3}, Lcom/genymobile/scrcpy/Point;->getY()I

    move-result v3

    sub-int/2addr v2, v3

    invoke-direct {v0, v1, v2}, Lcom/genymobile/scrcpy/Point;-><init>(II)V

    iget-object v1, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    invoke-direct {p1, v0, v1}, Lcom/genymobile/scrcpy/Position;-><init>(Lcom/genymobile/scrcpy/Point;Lcom/genymobile/scrcpy/Size;)V

    return-object p1
.end method

.method public toString()Ljava/lang/String;
    .registers 3

    .line 53
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Position{point="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/Position;->point:Lcom/genymobile/scrcpy/Point;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v1, ", screenSize="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/Position;->screenSize:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    move-result-object v0

    const/16 v1, 0x7d

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
