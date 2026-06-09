.class public Lcom/genymobile/scrcpy/InvalidDisplayIdException;
.super Ljava/lang/RuntimeException;
.source "InvalidDisplayIdException.java"


# instance fields
.field private final availableDisplayIds:[I

.field private final displayId:I


# direct methods
.method public constructor <init>(I[I)V
    .registers 5

    .line 9
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "There is no display having id "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-direct {p0, v0}, Ljava/lang/RuntimeException;-><init>(Ljava/lang/String;)V

    .line 10
    iput p1, p0, Lcom/genymobile/scrcpy/InvalidDisplayIdException;->displayId:I

    .line 11
    iput-object p2, p0, Lcom/genymobile/scrcpy/InvalidDisplayIdException;->availableDisplayIds:[I

    return-void
.end method


# virtual methods
.method public getAvailableDisplayIds()[I
    .registers 2

    .line 19
    iget-object v0, p0, Lcom/genymobile/scrcpy/InvalidDisplayIdException;->availableDisplayIds:[I

    return-object v0
.end method

.method public getDisplayId()I
    .registers 2

    .line 15
    iget v0, p0, Lcom/genymobile/scrcpy/InvalidDisplayIdException;->displayId:I

    return v0
.end method
