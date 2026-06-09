.class final Lcom/genymobile/scrcpy/Connection$1;
.super Ljava/lang/Object;
.source "Connection.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/genymobile/scrcpy/Connection;->startDeviceMessageSender(Lcom/genymobile/scrcpy/DeviceMessageSender;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x8
    name = null
.end annotation


# instance fields
.field final synthetic val$sender:Lcom/genymobile/scrcpy/DeviceMessageSender;


# direct methods
.method constructor <init>(Lcom/genymobile/scrcpy/DeviceMessageSender;)V
    .registers 2

    .line 106
    iput-object p1, p0, Lcom/genymobile/scrcpy/Connection$1;->val$sender:Lcom/genymobile/scrcpy/DeviceMessageSender;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .registers 2

    .line 110
    :try_start_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/Connection$1;->val$sender:Lcom/genymobile/scrcpy/DeviceMessageSender;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/DeviceMessageSender;->loop()V
    :try_end_5
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_5} :catch_6
    .catch Ljava/lang/InterruptedException; {:try_start_0 .. :try_end_5} :catch_6

    goto :goto_b

    :catch_6
    const-string v0, "Device message sender stopped"

    .line 113
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->d(Ljava/lang/String;)V

    :goto_b
    return-void
.end method
