.class Lcom/genymobile/scrcpy/Device$2;
.super Landroid/content/IOnPrimaryClipChangedListener$Stub;
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


# direct methods
.method constructor <init>(Lcom/genymobile/scrcpy/Device;)V
    .registers 2

    .line 92
    iput-object p1, p0, Lcom/genymobile/scrcpy/Device$2;->this$0:Lcom/genymobile/scrcpy/Device;

    invoke-direct {p0}, Landroid/content/IOnPrimaryClipChangedListener$Stub;-><init>()V

    return-void
.end method


# virtual methods
.method public dispatchPrimaryClipChanged()V
    .registers 4

    .line 95
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device$2;->this$0:Lcom/genymobile/scrcpy/Device;

    # getter for: Lcom/genymobile/scrcpy/Device;->isSettingClipboard:Ljava/util/concurrent/atomic/AtomicBoolean;
    invoke-static {v0}, Lcom/genymobile/scrcpy/Device;->access$100(Lcom/genymobile/scrcpy/Device;)Ljava/util/concurrent/atomic/AtomicBoolean;

    move-result-object v0

    invoke-virtual {v0}, Ljava/util/concurrent/atomic/AtomicBoolean;->get()Z

    move-result v0

    if-eqz v0, :cond_d

    return-void

    .line 99
    :cond_d
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device$2;->this$0:Lcom/genymobile/scrcpy/Device;

    monitor-enter v0

    .line 100
    :try_start_10
    iget-object v1, p0, Lcom/genymobile/scrcpy/Device$2;->this$0:Lcom/genymobile/scrcpy/Device;

    # getter for: Lcom/genymobile/scrcpy/Device;->clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;
    invoke-static {v1}, Lcom/genymobile/scrcpy/Device;->access$200(Lcom/genymobile/scrcpy/Device;)Lcom/genymobile/scrcpy/Device$ClipboardListener;

    move-result-object v1

    if-eqz v1, :cond_27

    .line 101
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->getClipboardText()Ljava/lang/String;

    move-result-object v1

    if-eqz v1, :cond_27

    .line 103
    iget-object v2, p0, Lcom/genymobile/scrcpy/Device$2;->this$0:Lcom/genymobile/scrcpy/Device;

    # getter for: Lcom/genymobile/scrcpy/Device;->clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;
    invoke-static {v2}, Lcom/genymobile/scrcpy/Device;->access$200(Lcom/genymobile/scrcpy/Device;)Lcom/genymobile/scrcpy/Device$ClipboardListener;

    move-result-object v2

    invoke-interface {v2, v1}, Lcom/genymobile/scrcpy/Device$ClipboardListener;->onClipboardTextChanged(Ljava/lang/String;)V

    .line 106
    :cond_27
    monitor-exit v0

    return-void

    :catchall_29
    move-exception v1

    monitor-exit v0
    :try_end_2b
    .catchall {:try_start_10 .. :try_end_2b} :catchall_29

    throw v1
.end method
