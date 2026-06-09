.class Lcom/genymobile/scrcpy/Device$1;
.super Landroid/view/IRotationWatcher$Stub;
.source "Device.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/genymobile/scrcpy/Device;-><init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lcom/genymobile/scrcpy/Device;

.field final synthetic val$videoSettings:Lcom/genymobile/scrcpy/VideoSettings;


# direct methods
.method constructor <init>(Lcom/genymobile/scrcpy/Device;Lcom/genymobile/scrcpy/VideoSettings;)V
    .registers 3

    .line 54
    iput-object p1, p0, Lcom/genymobile/scrcpy/Device$1;->this$0:Lcom/genymobile/scrcpy/Device;

    iput-object p2, p0, Lcom/genymobile/scrcpy/Device$1;->val$videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-direct {p0}, Landroid/view/IRotationWatcher$Stub;-><init>()V

    return-void
.end method


# virtual methods
.method public onRotationChanged(I)V
    .registers 5

    .line 57
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device$1;->this$0:Lcom/genymobile/scrcpy/Device;

    monitor-enter v0

    .line 58
    :try_start_3
    iget-object v1, p0, Lcom/genymobile/scrcpy/Device$1;->this$0:Lcom/genymobile/scrcpy/Device;

    iget-object v2, p0, Lcom/genymobile/scrcpy/Device$1;->val$videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v1, v2}, Lcom/genymobile/scrcpy/Device;->applyNewVideoSetting(Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 59
    iget-object v1, p0, Lcom/genymobile/scrcpy/Device$1;->this$0:Lcom/genymobile/scrcpy/Device;

    # getter for: Lcom/genymobile/scrcpy/Device;->rotationListener:Lcom/genymobile/scrcpy/Device$RotationListener;
    invoke-static {v1}, Lcom/genymobile/scrcpy/Device;->access$000(Lcom/genymobile/scrcpy/Device;)Lcom/genymobile/scrcpy/Device$RotationListener;

    move-result-object v1

    if-eqz v1, :cond_1b

    .line 60
    iget-object v1, p0, Lcom/genymobile/scrcpy/Device$1;->this$0:Lcom/genymobile/scrcpy/Device;

    # getter for: Lcom/genymobile/scrcpy/Device;->rotationListener:Lcom/genymobile/scrcpy/Device$RotationListener;
    invoke-static {v1}, Lcom/genymobile/scrcpy/Device;->access$000(Lcom/genymobile/scrcpy/Device;)Lcom/genymobile/scrcpy/Device$RotationListener;

    move-result-object v1

    invoke-interface {v1, p1}, Lcom/genymobile/scrcpy/Device$RotationListener;->onRotationChanged(I)V

    .line 62
    :cond_1b
    monitor-exit v0

    .line 63
    return-void

    .line 62
    :catchall_1d
    move-exception p1

    monitor-exit v0
    :try_end_1f
    .catchall {:try_start_3 .. :try_end_1f} :catchall_1d

    throw p1
.end method
