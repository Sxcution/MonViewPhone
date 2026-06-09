.class public Lcom/genymobile/scrcpy/Pointer;
.super Ljava/lang/Object;
.source "Pointer.java"


# instance fields
.field private final id:J

.field private final localId:I

.field private point:Lcom/genymobile/scrcpy/Point;

.field private pressure:F

.field private up:Z


# direct methods
.method public constructor <init>(JI)V
    .registers 4

    .line 19
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 20
    iput-wide p1, p0, Lcom/genymobile/scrcpy/Pointer;->id:J

    .line 21
    iput p3, p0, Lcom/genymobile/scrcpy/Pointer;->localId:I

    return-void
.end method


# virtual methods
.method public getId()J
    .registers 3

    .line 25
    iget-wide v0, p0, Lcom/genymobile/scrcpy/Pointer;->id:J

    return-wide v0
.end method

.method public getLocalId()I
    .registers 2

    .line 29
    iget v0, p0, Lcom/genymobile/scrcpy/Pointer;->localId:I

    return v0
.end method

.method public getPoint()Lcom/genymobile/scrcpy/Point;
    .registers 2

    .line 33
    iget-object v0, p0, Lcom/genymobile/scrcpy/Pointer;->point:Lcom/genymobile/scrcpy/Point;

    return-object v0
.end method

.method public getPressure()F
    .registers 2

    .line 41
    iget v0, p0, Lcom/genymobile/scrcpy/Pointer;->pressure:F

    return v0
.end method

.method public isUp()Z
    .registers 2

    .line 49
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Pointer;->up:Z

    return v0
.end method

.method public setPoint(Lcom/genymobile/scrcpy/Point;)V
    .registers 2

    .line 37
    iput-object p1, p0, Lcom/genymobile/scrcpy/Pointer;->point:Lcom/genymobile/scrcpy/Point;

    return-void
.end method

.method public setPressure(F)V
    .registers 2

    .line 45
    iput p1, p0, Lcom/genymobile/scrcpy/Pointer;->pressure:F

    return-void
.end method

.method public setUp(Z)V
    .registers 2

    .line 53
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Pointer;->up:Z

    return-void
.end method
