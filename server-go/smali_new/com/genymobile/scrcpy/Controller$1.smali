.class Lcom/genymobile/scrcpy/Controller$1;
.super Ljava/lang/Object;
.source "Controller.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/genymobile/scrcpy/Controller;->schedulePowerModeOff()V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# direct methods
.method constructor <init>()V
    .registers 1

    .line 199
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .registers 2

    .line 202
    const-string v0, "Forcing screen off"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 203
    const/4 v0, 0x0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Device;->setScreenPowerMode(I)Z

    .line 204
    return-void
.end method
