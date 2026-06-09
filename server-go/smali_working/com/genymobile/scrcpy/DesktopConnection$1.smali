.class Lcom/genymobile/scrcpy/DesktopConnection$1;
.super Ljava/lang/Object;
.source "DesktopConnection.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/genymobile/scrcpy/DesktopConnection;->startEventController()V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lcom/genymobile/scrcpy/DesktopConnection;


# direct methods
.method constructor <init>(Lcom/genymobile/scrcpy/DesktopConnection;)V
    .registers 2

    .line 118
    iput-object p1, p0, Lcom/genymobile/scrcpy/DesktopConnection$1;->this$0:Lcom/genymobile/scrcpy/DesktopConnection;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .registers 3

    .line 123
    :try_start_0
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->isScreenOn()Z

    move-result v0

    if-nez v0, :cond_12

    .line 124
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection$1;->this$0:Lcom/genymobile/scrcpy/DesktopConnection;

    iget-object v0, v0, Lcom/genymobile/scrcpy/DesktopConnection;->controller:Lcom/genymobile/scrcpy/Controller;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Controller;->turnScreenOn()V

    const-wide/16 v0, 0x1f4

    .line 133
    invoke-static {v0, v1}, Landroid/os/SystemClock;->sleep(J)V

    .line 136
    :cond_12
    :goto_12
    iget-object v0, p0, Lcom/genymobile/scrcpy/DesktopConnection$1;->this$0:Lcom/genymobile/scrcpy/DesktopConnection;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/DesktopConnection;->receiveControlMessage()Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v0

    if-eqz v0, :cond_12

    .line 138
    iget-object v1, p0, Lcom/genymobile/scrcpy/DesktopConnection$1;->this$0:Lcom/genymobile/scrcpy/DesktopConnection;

    iget-object v1, v1, Lcom/genymobile/scrcpy/DesktopConnection;->controller:Lcom/genymobile/scrcpy/Controller;

    invoke-virtual {v1, v0}, Lcom/genymobile/scrcpy/Controller;->handleEvent(Lcom/genymobile/scrcpy/ControlMessage;)V
    :try_end_21
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_21} :catch_22

    goto :goto_12

    :catch_22
    const-string v0, "Event controller stopped"

    .line 144
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    return-void
.end method
