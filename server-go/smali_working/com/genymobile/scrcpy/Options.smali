.class public Lcom/genymobile/scrcpy/Options;
.super Ljava/lang/Object;
.source "Options.java"


# static fields
.field public static final TYPE_LOCAL_SOCKET:I = 0x1

.field public static final TYPE_WEB_SOCKET:I = 0x2


# instance fields
.field private bitRate:I

.field private codecOptions:Ljava/lang/String;

.field private control:Z

.field private crop:Landroid/graphics/Rect;

.field private displayId:I

.field private encoderName:Ljava/lang/String;

.field private listenOnAllInterfaces:Z

.field private lockedVideoOrientation:I

.field private logLevel:Lcom/genymobile/scrcpy/Ln$Level;

.field private maxFps:I

.field private maxSize:I

.field private portNumber:I

.field private powerOffScreenOnClose:Z

.field private sendFrameMeta:Z

.field private serverType:I

.field private showTouches:Z

.field private stayAwake:Z

.field private tunnelForward:Z


# direct methods
.method public constructor <init>()V
    .registers 3

    .line 5
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 9
    sget-object v0, Lcom/genymobile/scrcpy/Ln$Level;->ERROR:Lcom/genymobile/scrcpy/Ln$Level;

    iput-object v0, p0, Lcom/genymobile/scrcpy/Options;->logLevel:Lcom/genymobile/scrcpy/Ln$Level;

    const/4 v0, 0x0

    .line 14
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->tunnelForward:Z

    const/4 v1, 0x1

    .line 17
    iput-boolean v1, p0, Lcom/genymobile/scrcpy/Options;->control:Z

    .line 19
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->showTouches:Z

    .line 20
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->stayAwake:Z

    .line 24
    iput v1, p0, Lcom/genymobile/scrcpy/Options;->serverType:I

    const/16 v0, 0x22b6

    .line 25
    iput v0, p0, Lcom/genymobile/scrcpy/Options;->portNumber:I

    .line 26
    iput-boolean v1, p0, Lcom/genymobile/scrcpy/Options;->listenOnAllInterfaces:Z

    return-void
.end method


# virtual methods
.method public getBitRate()I
    .registers 2

    .line 45
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->bitRate:I

    return v0
.end method

.method public getCodecOptions()Ljava/lang/String;
    .registers 2

    .line 125
    iget-object v0, p0, Lcom/genymobile/scrcpy/Options;->codecOptions:Ljava/lang/String;

    return-object v0
.end method

.method public getControl()Z
    .registers 2

    .line 93
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->control:Z

    return v0
.end method

.method public getCrop()Landroid/graphics/Rect;
    .registers 2

    .line 77
    iget-object v0, p0, Lcom/genymobile/scrcpy/Options;->crop:Landroid/graphics/Rect;

    return-object v0
.end method

.method public getDisplayId()I
    .registers 2

    .line 101
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->displayId:I

    return v0
.end method

.method public getEncoderName()Ljava/lang/String;
    .registers 2

    .line 133
    iget-object v0, p0, Lcom/genymobile/scrcpy/Options;->encoderName:Ljava/lang/String;

    return-object v0
.end method

.method public getListenOnAllInterfaces()Z
    .registers 2

    .line 167
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->listenOnAllInterfaces:Z

    return v0
.end method

.method public getLockedVideoOrientation()I
    .registers 2

    .line 61
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->lockedVideoOrientation:I

    return v0
.end method

.method public getLogLevel()Lcom/genymobile/scrcpy/Ln$Level;
    .registers 2

    .line 29
    iget-object v0, p0, Lcom/genymobile/scrcpy/Options;->logLevel:Lcom/genymobile/scrcpy/Ln$Level;

    return-object v0
.end method

.method public getMaxFps()I
    .registers 2

    .line 53
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->maxFps:I

    return v0
.end method

.method public getMaxSize()I
    .registers 2

    .line 37
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->maxSize:I

    return v0
.end method

.method public getPortNumber()I
    .registers 2

    .line 163
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->portNumber:I

    return v0
.end method

.method public getPowerOffScreenOnClose()Z
    .registers 2

    .line 145
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->powerOffScreenOnClose:Z

    return v0
.end method

.method public getSendFrameMeta()Z
    .registers 2

    .line 85
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->sendFrameMeta:Z

    return v0
.end method

.method public getServerType()I
    .registers 2

    .line 149
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->serverType:I

    return v0
.end method

.method public getShowTouches()Z
    .registers 2

    .line 109
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->showTouches:Z

    return v0
.end method

.method public getStayAwake()Z
    .registers 2

    .line 117
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->stayAwake:Z

    return v0
.end method

.method public isTunnelForward()Z
    .registers 2

    .line 69
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->tunnelForward:Z

    return v0
.end method

.method public setBitRate(I)V
    .registers 2

    .line 49
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->bitRate:I

    return-void
.end method

.method public setCodecOptions(Ljava/lang/String;)V
    .registers 2

    .line 129
    iput-object p1, p0, Lcom/genymobile/scrcpy/Options;->codecOptions:Ljava/lang/String;

    return-void
.end method

.method public setControl(Z)V
    .registers 2

    .line 97
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->control:Z

    return-void
.end method

.method public setCrop(Landroid/graphics/Rect;)V
    .registers 2

    .line 81
    iput-object p1, p0, Lcom/genymobile/scrcpy/Options;->crop:Landroid/graphics/Rect;

    return-void
.end method

.method public setDisplayId(I)V
    .registers 2

    .line 105
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->displayId:I

    return-void
.end method

.method public setEncoderName(Ljava/lang/String;)V
    .registers 2

    .line 137
    iput-object p1, p0, Lcom/genymobile/scrcpy/Options;->encoderName:Ljava/lang/String;

    return-void
.end method

.method public setListenOnAllInterfaces(Z)V
    .registers 2

    .line 171
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->listenOnAllInterfaces:Z

    return-void
.end method

.method public setLockedVideoOrientation(I)V
    .registers 2

    .line 65
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->lockedVideoOrientation:I

    return-void
.end method

.method public setLogLevel(Lcom/genymobile/scrcpy/Ln$Level;)V
    .registers 2

    .line 33
    iput-object p1, p0, Lcom/genymobile/scrcpy/Options;->logLevel:Lcom/genymobile/scrcpy/Ln$Level;

    return-void
.end method

.method public setMaxFps(I)V
    .registers 2

    .line 57
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->maxFps:I

    return-void
.end method

.method public setMaxSize(I)V
    .registers 2

    .line 41
    div-int/lit8 p1, p1, 0x8

    mul-int/lit8 p1, p1, 0x8

    iput p1, p0, Lcom/genymobile/scrcpy/Options;->maxSize:I

    return-void
.end method

.method public setPortNumber(I)V
    .registers 2

    .line 159
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->portNumber:I

    return-void
.end method

.method public setPowerOffScreenOnClose(Z)V
    .registers 2

    .line 141
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->powerOffScreenOnClose:Z

    return-void
.end method

.method public setSendFrameMeta(Z)V
    .registers 2

    .line 89
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->sendFrameMeta:Z

    return-void
.end method

.method public setServerType(I)V
    .registers 3

    const/4 v0, 0x1

    if-eq p1, v0, :cond_6

    const/4 v0, 0x2

    if-ne p1, v0, :cond_8

    .line 154
    :cond_6
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->serverType:I

    :cond_8
    return-void
.end method

.method public setShowTouches(Z)V
    .registers 2

    .line 113
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->showTouches:Z

    return-void
.end method

.method public setStayAwake(Z)V
    .registers 2

    .line 121
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->stayAwake:Z

    return-void
.end method

.method public setTunnelForward(Z)V
    .registers 2

    .line 73
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->tunnelForward:Z

    return-void
.end method

.method public toString()Ljava/lang/String;
    .registers 4

    .line 176
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Options{maxSize="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v1, p0, Lcom/genymobile/scrcpy/Options;->maxSize:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v1, ", bitRate="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v1, p0, Lcom/genymobile/scrcpy/Options;->bitRate:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v1, ", maxFps="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v1, p0, Lcom/genymobile/scrcpy/Options;->maxFps:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v1, ", tunnelForward="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-boolean v1, p0, Lcom/genymobile/scrcpy/Options;->tunnelForward:Z

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    const-string v1, ", crop="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-object v1, p0, Lcom/genymobile/scrcpy/Options;->crop:Landroid/graphics/Rect;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    const-string v1, ", sendFrameMeta="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-boolean v1, p0, Lcom/genymobile/scrcpy/Options;->sendFrameMeta:Z

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    const-string v1, ", serverType="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v1, p0, Lcom/genymobile/scrcpy/Options;->serverType:I

    const/4 v2, 0x1

    if-ne v1, v2, :cond_4e

    const-string v1, "local"

    goto :goto_50

    :cond_4e
    const-string v1, "web"

    :goto_50
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v1, ", listenOnAllInterfaces="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget-boolean v1, p0, Lcom/genymobile/scrcpy/Options;->listenOnAllInterfaces:Z

    if-eqz v1, :cond_5f

    const-string v1, "true"

    goto :goto_61

    :cond_5f
    const-string v1, "false"

    :goto_61
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/16 v1, 0x7d

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
