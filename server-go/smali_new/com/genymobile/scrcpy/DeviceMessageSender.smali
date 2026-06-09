.class public final Lcom/genymobile/scrcpy/DeviceMessageSender;
.super Ljava/lang/Object;
.source "DeviceMessageSender.java"


# instance fields
.field private clipboardText:Ljava/lang/String;

.field private final connection:Lcom/genymobile/scrcpy/Connection;


# direct methods
.method public constructor <init>(Lcom/genymobile/scrcpy/Connection;)V
    .registers 2

    .line 10
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 11
    iput-object p1, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->connection:Lcom/genymobile/scrcpy/Connection;

    .line 12
    return-void
.end method


# virtual methods
.method public loop()V
    .registers 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/InterruptedException;,
            Ljava/io/IOException;
        }
    .end annotation

    .line 22
    nop

    :goto_1
    monitor-enter p0

    .line 23
    :goto_2
    :try_start_2
    iget-object v0, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->clipboardText:Ljava/lang/String;

    if-nez v0, :cond_a

    .line 24
    invoke-virtual {p0}, Ljava/lang/Object;->wait()V

    goto :goto_2

    .line 26
    :cond_a
    iget-object v0, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->clipboardText:Ljava/lang/String;

    .line 27
    const/4 v1, 0x0

    iput-object v1, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->clipboardText:Ljava/lang/String;

    .line 28
    monitor-exit p0
    :try_end_10
    .catchall {:try_start_2 .. :try_end_10} :catchall_1a

    .line 29
    iget-object v1, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-static {v0}, Lcom/genymobile/scrcpy/DeviceMessage;->createClipboard(Ljava/lang/String;)Lcom/genymobile/scrcpy/DeviceMessage;

    move-result-object v0

    invoke-virtual {v1, v0}, Lcom/genymobile/scrcpy/Connection;->sendDeviceMessage(Lcom/genymobile/scrcpy/DeviceMessage;)V

    goto :goto_1

    .line 28
    :catchall_1a
    move-exception v0

    :try_start_1b
    monitor-exit p0
    :try_end_1c
    .catchall {:try_start_1b .. :try_end_1c} :catchall_1a

    throw v0
.end method

.method public declared-synchronized pushClipboardText(Ljava/lang/String;)V
    .registers 2

    monitor-enter p0

    .line 15
    :try_start_1
    iput-object p1, p0, Lcom/genymobile/scrcpy/DeviceMessageSender;->clipboardText:Ljava/lang/String;

    .line 16
    invoke-virtual {p0}, Ljava/lang/Object;->notify()V
    :try_end_6
    .catchall {:try_start_1 .. :try_end_6} :catchall_8

    .line 17
    monitor-exit p0

    return-void

    .line 14
    :catchall_8
    move-exception p1

    :try_start_9
    monitor-exit p0
    :try_end_a
    .catchall {:try_start_9 .. :try_end_a} :catchall_8

    throw p1
.end method
