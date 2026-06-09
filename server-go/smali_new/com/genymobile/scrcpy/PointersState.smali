.class public Lcom/genymobile/scrcpy/PointersState;
.super Ljava/lang/Object;
.source "PointersState.java"


# static fields
.field public static final MAX_POINTERS:I = 0xa


# instance fields
.field private final pointers:Ljava/util/List;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/List<",
            "Lcom/genymobile/scrcpy/Pointer;",
            ">;"
        }
    .end annotation
.end field


# direct methods
.method public constructor <init>()V
    .registers 2

    .line 8
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 10
    new-instance v0, Ljava/util/ArrayList;

    invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    return-void
.end method

.method private cleanUp()V
    .registers 3

    .line 74
    iget-object v0, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v0}, Ljava/util/List;->size()I

    move-result v0

    add-int/lit8 v0, v0, -0x1

    :goto_8
    if-ltz v0, :cond_20

    .line 75
    iget-object v1, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v1, v0}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Lcom/genymobile/scrcpy/Pointer;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Pointer;->isUp()Z

    move-result v1

    if-eqz v1, :cond_1d

    .line 76
    iget-object v1, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v1, v0}, Ljava/util/List;->remove(I)Ljava/lang/Object;

    .line 74
    :cond_1d
    add-int/lit8 v0, v0, -0x1

    goto :goto_8

    .line 79
    :cond_20
    return-void
.end method

.method private indexOf(J)I
    .registers 7

    .line 13
    const/4 v0, 0x0

    :goto_1
    iget-object v1, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v1}, Ljava/util/List;->size()I

    move-result v1

    if-ge v0, v1, :cond_1d

    .line 14
    iget-object v1, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v1, v0}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Lcom/genymobile/scrcpy/Pointer;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Pointer;->getId()J

    move-result-wide v1

    cmp-long v3, v1, p1

    if-nez v3, :cond_1a

    .line 15
    return v0

    .line 13
    :cond_1a
    add-int/lit8 v0, v0, 0x1

    goto :goto_1

    .line 18
    :cond_1d
    const/4 p1, -0x1

    return p1
.end method

.method private isLocalIdAvailable(I)Z
    .registers 5

    .line 22
    const/4 v0, 0x0

    const/4 v1, 0x0

    :goto_2
    iget-object v2, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v2}, Ljava/util/List;->size()I

    move-result v2

    if-ge v1, v2, :cond_1c

    .line 23
    iget-object v2, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v2, v1}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/genymobile/scrcpy/Pointer;

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Pointer;->getLocalId()I

    move-result v2

    if-ne v2, p1, :cond_19

    .line 24
    return v0

    .line 22
    :cond_19
    add-int/lit8 v1, v1, 0x1

    goto :goto_2

    .line 27
    :cond_1c
    const/4 p1, 0x1

    return p1
.end method

.method private nextUnusedLocalId()I
    .registers 3

    .line 31
    const/4 v0, 0x0

    :goto_1
    const/16 v1, 0xa

    if-ge v0, v1, :cond_f

    .line 32
    invoke-direct {p0, v0}, Lcom/genymobile/scrcpy/PointersState;->isLocalIdAvailable(I)Z

    move-result v1

    if-eqz v1, :cond_c

    .line 33
    return v0

    .line 31
    :cond_c
    add-int/lit8 v0, v0, 0x1

    goto :goto_1

    .line 36
    :cond_f
    const/4 v0, -0x1

    return v0
.end method


# virtual methods
.method public get(I)Lcom/genymobile/scrcpy/Pointer;
    .registers 3

    .line 40
    iget-object v0, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v0, p1}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Lcom/genymobile/scrcpy/Pointer;

    return-object p1
.end method

.method public getPointerIndex(J)I
    .registers 6

    .line 44
    invoke-direct {p0, p1, p2}, Lcom/genymobile/scrcpy/PointersState;->indexOf(J)I

    move-result v0

    .line 45
    const/4 v1, -0x1

    if-eq v0, v1, :cond_8

    .line 46
    return v0

    .line 48
    :cond_8
    iget-object v0, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v0}, Ljava/util/List;->size()I

    move-result v0

    const/16 v2, 0xa

    if-lt v0, v2, :cond_13

    .line 49
    return v1

    .line 51
    :cond_13
    invoke-direct {p0}, Lcom/genymobile/scrcpy/PointersState;->nextUnusedLocalId()I

    move-result v0

    .line 52
    if-eq v0, v1, :cond_2c

    .line 55
    iget-object v1, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    new-instance v2, Lcom/genymobile/scrcpy/Pointer;

    invoke-direct {v2, p1, p2, v0}, Lcom/genymobile/scrcpy/Pointer;-><init>(JI)V

    invoke-interface {v1, v2}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    .line 56
    iget-object p1, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {p1}, Ljava/util/List;->size()I

    move-result p1

    add-int/lit8 p1, p1, -0x1

    return p1

    .line 53
    :cond_2c
    new-instance p1, Ljava/lang/AssertionError;

    const-string p2, "pointers.size() < maxFingers implies that a local id is available"

    invoke-direct {p1, p2}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw p1
.end method

.method public update([Landroid/view/MotionEvent$PointerProperties;[Landroid/view/MotionEvent$PointerCoords;)I
    .registers 9

    .line 60
    iget-object v0, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v0}, Ljava/util/List;->size()I

    move-result v0

    .line 61
    const/4 v1, 0x0

    :goto_7
    if-ge v1, v0, :cond_3a

    .line 62
    iget-object v2, p0, Lcom/genymobile/scrcpy/PointersState;->pointers:Ljava/util/List;

    invoke-interface {v2, v1}, Ljava/util/List;->get(I)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/genymobile/scrcpy/Pointer;

    .line 63
    aget-object v3, p1, v1

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Pointer;->getLocalId()I

    move-result v4

    iput v4, v3, Landroid/view/MotionEvent$PointerProperties;->id:I

    .line 64
    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Pointer;->getPoint()Lcom/genymobile/scrcpy/Point;

    move-result-object v3

    .line 65
    aget-object v4, p2, v1

    invoke-virtual {v3}, Lcom/genymobile/scrcpy/Point;->getX()I

    move-result v5

    int-to-float v5, v5

    iput v5, v4, Landroid/view/MotionEvent$PointerCoords;->x:F

    .line 66
    aget-object v4, p2, v1

    invoke-virtual {v3}, Lcom/genymobile/scrcpy/Point;->getY()I

    move-result v3

    int-to-float v3, v3

    iput v3, v4, Landroid/view/MotionEvent$PointerCoords;->y:F

    .line 67
    aget-object v3, p2, v1

    invoke-virtual {v2}, Lcom/genymobile/scrcpy/Pointer;->getPressure()F

    move-result v2

    iput v2, v3, Landroid/view/MotionEvent$PointerCoords;->pressure:F

    .line 61
    add-int/lit8 v1, v1, 0x1

    goto :goto_7

    .line 69
    :cond_3a
    invoke-direct {p0}, Lcom/genymobile/scrcpy/PointersState;->cleanUp()V

    .line 70
    return v0
.end method
