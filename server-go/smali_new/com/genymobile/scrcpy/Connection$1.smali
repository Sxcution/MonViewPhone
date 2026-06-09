.class Lcom/genymobile/scrcpy/Connection$1;
.super Ljava/lang/Object;
.source "Connection.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/genymobile/scrcpy/Connection;->startDeviceMessageSender(Lcom/genymobile/scrcpy/DeviceMessageSender;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic val$deviceMessageSender:Lcom/genymobile/scrcpy/DeviceMessageSender;


# direct methods
.method constructor <init>(Lcom/genymobile/scrcpy/DeviceMessageSender;)V
    .registers 2
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 117
    iput-object p1, p0, Lcom/genymobile/scrcpy/Connection$1;->val$deviceMessageSender:Lcom/genymobile/scrcpy/DeviceMessageSender;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .registers 2

    .line 121
    :try_start_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/Connection$1;->val$deviceMessageSender:Lcom/genymobile/scrcpy/DeviceMessageSender;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/DeviceMessageSender;->loop()V
    :try_end_5
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_5} :catch_8
    .catch Ljava/lang/InterruptedException; {:try_start_0 .. :try_end_5} :catch_6

    .line 124
    goto :goto_e

    .line 122
    :catch_6
    move-exception v0

    goto :goto_9

    :catch_8
    move-exception v0

    .line 123
    :goto_9
    const-string v0, "Device message sender stopped"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    .line 125
    :goto_e
    return-void
.end method
