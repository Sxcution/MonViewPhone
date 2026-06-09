.class public final Lcom/genymobile/scrcpy/DeviceMessageSender;
.super Ljava/lang/Object;
.source "DeviceMessageSender.java"


# instance fields
.field private clipboardText:Ljava/lang/String;

.field private final connection:Lcom/genymobile/scrcpy/Connection;


# direct methods
.method public constructor <init>(Lcom/genymobile/scrcpy/Connection;)V
    .registers 2

    .line 11
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 12
    iput-object p1, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->connection:Lcom/genymobile/scrcpy/Connection;

    return-void
.end method


# virtual methods
.method public loop()V
    .registers 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;,
            Ljava/lang/InterruptedException;
        }
    .end annotation

    .line 23
    :goto_0
    monitor-enter p0

    .line 24
    :goto_1
    :try_start_1
    iget-object v0, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->clipboardText:Ljava/lang/String;

    if-nez v0, :cond_9

    .line 25
    invoke-virtual {p0}, Ljava/lang/Object;->wait()V

    goto :goto_1

    .line 27
    :cond_9
    iget-object v0, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->clipboardText:Ljava/lang/String;

    const/4 v1, 0x0

    .line 28
    iput-object v1, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->clipboardText:Ljava/lang/String;

    .line 29
    monitor-exit p0
    :try_end_f
    .catchall {:try_start_1 .. :try_end_f} :catchall_19

    .line 30
    invoke-static {v0}, Lcom/genymobile/scrcpy/DeviceMessage;->createClipboard(Ljava/lang/String;)Lcom/genymobile/scrcpy/DeviceMessage;

    move-result-object v0

    .line 31
    iget-object v1, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v1, v0}, Lcom/genymobile/scrcpy/Connection;->sendDeviceMessage(Lcom/genymobile/scrcpy/DeviceMessage;)V

    goto :goto_0

    :catchall_19
    move-exception v0

    .line 29
    :try_start_1a
    monitor-exit p0
    :try_end_1b
    .catchall {:try_start_1a .. :try_end_1b} :catchall_19

    throw v0
.end method

.method public declared-synchronized pushClipboardText(Ljava/lang/String;)V
    .registers 2

    monitor-enter p0

    .line 16
    :try_start_1
    iput-object p1, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->clipboardText:Ljava/lang/String;

    .line 17
    invoke-virtual {p0}, Ljava/lang/Object;->notify()V
    :try_end_6
    .catchall {:try_start_1 .. :try_end_6} :catchall_8

    .line 18
    monitor-exit p0

    return-void

    :catchall_8
    move-exception p1

    monitor-exit p0

    throw p1
.end method
