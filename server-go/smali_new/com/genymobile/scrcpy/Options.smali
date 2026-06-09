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

    .line 7
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 20
    sget-object v0, Lcom/genymobile/scrcpy/Ln$Level;->ERROR:Lcom/genymobile/scrcpy/Ln$Level;

    iput-object v0, p0, Lcom/genymobile/scrcpy/Options;->logLevel:Lcom/genymobile/scrcpy/Ln$Level;

    .line 21
    const/4 v0, 0x0

    iput-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->tunnelForward:Z

    .line 22
    const/4 v1, 0x1

    iput-boolean v1, p0, Lcom/genymobile/scrcpy/Options;->control:Z

    .line 23
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->showTouches:Z

    .line 24
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->stayAwake:Z

    .line 25
    iput v1, p0, Lcom/genymobile/scrcpy/Options;->serverType:I

    .line 26
    const/16 v0, 0x22b6

    iput v0, p0, Lcom/genymobile/scrcpy/Options;->portNumber:I

    .line 27
    iput-boolean v1, p0, Lcom/genymobile/scrcpy/Options;->listenOnAllInterfaces:Z

    return-void
.end method


# virtual methods
.method public getBitRate()I
    .registers 2

    .line 46
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->bitRate:I

    return v0
.end method

.method public getCodecOptions()Ljava/lang/String;
    .registers 2

    .line 126
    iget-object v0, p0, Lcom/genymobile/scrcpy/Options;->codecOptions:Ljava/lang/String;

    return-object v0
.end method

.method public getControl()Z
    .registers 2

    .line 94
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->control:Z

    return v0
.end method

.method public getCrop()Landroid/graphics/Rect;
    .registers 2

    .line 78
    iget-object v0, p0, Lcom/genymobile/scrcpy/Options;->crop:Landroid/graphics/Rect;

    return-object v0
.end method

.method public getDisplayId()I
    .registers 2

    .line 102
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->displayId:I

    return v0
.end method

.method public getEncoderName()Ljava/lang/String;
    .registers 2

    .line 134
    iget-object v0, p0, Lcom/genymobile/scrcpy/Options;->encoderName:Ljava/lang/String;

    return-object v0
.end method

.method public getListenOnAllInterfaces()Z
    .registers 2

    .line 168
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->listenOnAllInterfaces:Z

    return v0
.end method

.method public getLockedVideoOrientation()I
    .registers 2

    .line 62
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->lockedVideoOrientation:I

    return v0
.end method

.method public getLogLevel()Lcom/genymobile/scrcpy/Ln$Level;
    .registers 2

    .line 30
    iget-object v0, p0, Lcom/genymobile/scrcpy/Options;->logLevel:Lcom/genymobile/scrcpy/Ln$Level;

    return-object v0
.end method

.method public getMaxFps()I
    .registers 2

    .line 54
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->maxFps:I

    return v0
.end method

.method public getMaxSize()I
    .registers 2

    .line 38
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->maxSize:I

    return v0
.end method

.method public getPortNumber()I
    .registers 2

    .line 164
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->portNumber:I

    return v0
.end method

.method public getPowerOffScreenOnClose()Z
    .registers 2

    .line 146
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->powerOffScreenOnClose:Z

    return v0
.end method

.method public getSendFrameMeta()Z
    .registers 2

    .line 86
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->sendFrameMeta:Z

    return v0
.end method

.method public getServerType()I
    .registers 2

    .line 150
    iget v0, p0, Lcom/genymobile/scrcpy/Options;->serverType:I

    return v0
.end method

.method public getShowTouches()Z
    .registers 2

    .line 110
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->showTouches:Z

    return v0
.end method

.method public getStayAwake()Z
    .registers 2

    .line 118
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->stayAwake:Z

    return v0
.end method

.method public isTunnelForward()Z
    .registers 2

    .line 70
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Options;->tunnelForward:Z

    return v0
.end method

.method public setBitRate(I)V
    .registers 2

    .line 50
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->bitRate:I

    .line 51
    return-void
.end method

.method public setCodecOptions(Ljava/lang/String;)V
    .registers 2

    .line 130
    iput-object p1, p0, Lcom/genymobile/scrcpy/Options;->codecOptions:Ljava/lang/String;

    .line 131
    return-void
.end method

.method public setControl(Z)V
    .registers 2

    .line 98
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->control:Z

    .line 99
    return-void
.end method

.method public setCrop(Landroid/graphics/Rect;)V
    .registers 2

    .line 82
    iput-object p1, p0, Lcom/genymobile/scrcpy/Options;->crop:Landroid/graphics/Rect;

    .line 83
    return-void
.end method

.method public setDisplayId(I)V
    .registers 2

    .line 106
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->displayId:I

    .line 107
    return-void
.end method

.method public setEncoderName(Ljava/lang/String;)V
    .registers 2

    .line 138
    iput-object p1, p0, Lcom/genymobile/scrcpy/Options;->encoderName:Ljava/lang/String;

    .line 139
    return-void
.end method

.method public setListenOnAllInterfaces(Z)V
    .registers 2

    .line 172
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->listenOnAllInterfaces:Z

    .line 173
    return-void
.end method

.method public setLockedVideoOrientation(I)V
    .registers 2

    .line 66
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->lockedVideoOrientation:I

    .line 67
    return-void
.end method

.method public setLogLevel(Lcom/genymobile/scrcpy/Ln$Level;)V
    .registers 2

    .line 34
    iput-object p1, p0, Lcom/genymobile/scrcpy/Options;->logLevel:Lcom/genymobile/scrcpy/Ln$Level;

    .line 35
    return-void
.end method

.method public setMaxFps(I)V
    .registers 2

    .line 58
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->maxFps:I

    .line 59
    return-void
.end method

.method public setMaxSize(I)V
    .registers 2

    .line 42
    div-int/lit8 p1, p1, 0x8

    mul-int/lit8 p1, p1, 0x8

    iput p1, p0, Lcom/genymobile/scrcpy/Options;->maxSize:I

    .line 43
    return-void
.end method

.method public setPortNumber(I)V
    .registers 2

    .line 160
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->portNumber:I

    .line 161
    return-void
.end method

.method public setPowerOffScreenOnClose(Z)V
    .registers 2

    .line 142
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->powerOffScreenOnClose:Z

    .line 143
    return-void
.end method

.method public setSendFrameMeta(Z)V
    .registers 2

    .line 90
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->sendFrameMeta:Z

    .line 91
    return-void
.end method

.method public setServerType(I)V
    .registers 3

    .line 154
    const/4 v0, 0x1

    if-eq p1, v0, :cond_6

    const/4 v0, 0x2

    if-ne p1, v0, :cond_8

    .line 155
    :cond_6
    iput p1, p0, Lcom/genymobile/scrcpy/Options;->serverType:I

    .line 157
    :cond_8
    return-void
.end method

.method public setShowTouches(Z)V
    .registers 2

    .line 114
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->showTouches:Z

    .line 115
    return-void
.end method

.method public setStayAwake(Z)V
    .registers 2

    .line 122
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->stayAwake:Z

    .line 123
    return-void
.end method

.method public setTunnelForward(Z)V
    .registers 2

    .line 74
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Options;->tunnelForward:Z

    .line 75
    return-void
.end method

.method public toString()Ljava/lang/String;
    .registers 4

    .line 176
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    .line 177
    const-string v1, "Options{maxSize="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 178
    iget v1, p0, Lcom/genymobile/scrcpy/Options;->maxSize:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    .line 179
    const-string v1, ", bitRate="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 180
    iget v1, p0, Lcom/genymobile/scrcpy/Options;->bitRate:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    .line 181
    const-string v1, ", maxFps="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 182
    iget v1, p0, Lcom/genymobile/scrcpy/Options;->maxFps:I

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    .line 183
    const-string v1, ", tunnelForward="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 184
    iget-boolean v1, p0, Lcom/genymobile/scrcpy/Options;->tunnelForward:Z

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    .line 185
    const-string v1, ", crop="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 186
    iget-object v1, p0, Lcom/genymobile/scrcpy/Options;->crop:Landroid/graphics/Rect;

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/Object;)Ljava/lang/StringBuilder;

    .line 187
    const-string v1, ", sendFrameMeta="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 188
    iget-boolean v1, p0, Lcom/genymobile/scrcpy/Options;->sendFrameMeta:Z

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    .line 189
    const-string v1, ", serverType="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 190
    iget v1, p0, Lcom/genymobile/scrcpy/Options;->serverType:I

    const/4 v2, 0x1

    if-ne v1, v2, :cond_4e

    const-string v1, "local"

    goto :goto_50

    :cond_4e
    const-string v1, "web"

    :goto_50
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 191
    const-string v1, ", listenOnAllInterfaces="

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 192
    iget-boolean v1, p0, Lcom/genymobile/scrcpy/Options;->listenOnAllInterfaces:Z

    if-eqz v1, :cond_5f

    const-string v1, "true"

    goto :goto_61

    :cond_5f
    const-string v1, "false"

    :goto_61
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 193
    const/16 v1, 0x7d

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    .line 194
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
