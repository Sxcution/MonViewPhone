.class public abstract Lcom/genymobile/scrcpy/Connection;
.super Ljava/lang/Object;
.source "Connection.java"

# interfaces
.implements Lcom/genymobile/scrcpy/Device$RotationListener;
.implements Lcom/genymobile/scrcpy/Device$ClipboardListener;


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;
    }
.end annotation


# static fields
.field protected static final DEVICE_NAME_FIELD_LENGTH:I = 0x40


# instance fields
.field protected controller:Lcom/genymobile/scrcpy/Controller;

.field protected device:Lcom/genymobile/scrcpy/Device;

.field protected final options:Lcom/genymobile/scrcpy/Options;

.field protected final reader:Lcom/genymobile/scrcpy/ControlMessageReader;

.field protected screenEncoder:Lcom/genymobile/scrcpy/ScreenEncoder;

.field protected streamInvalidateListener:Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;

.field protected final videoSettings:Lcom/genymobile/scrcpy/VideoSettings;


# direct methods
.method public constructor <init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V
    .locals 8

    const-string v0, "1"

    .line 33
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 16
    new-instance v1, Lcom/genymobile/scrcpy/ControlMessageReader;

    invoke-direct {v1}, Lcom/genymobile/scrcpy/ControlMessageReader;-><init>()V

    iput-object v1, p0, Lcom/genymobile/scrcpy/Connection;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    .line 34
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Device: "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    sget-object v2, Landroid/os/Build;->MANUFACTURER:Ljava/lang/String;

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v2, " "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    sget-object v2, Landroid/os/Build;->MODEL:Ljava/lang/String;

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v2, " (Android "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    sget-object v2, Landroid/os/Build$VERSION;->RELEASE:Ljava/lang/String;

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v2, ")"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-static {v1}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 35
    iput-object p2, p0, Lcom/genymobile/scrcpy/Connection;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    .line 36
    iput-object p1, p0, Lcom/genymobile/scrcpy/Connection;->options:Lcom/genymobile/scrcpy/Options;

    .line 37
    new-instance v1, Lcom/genymobile/scrcpy/Device;

    invoke-direct {v1, p1, p2}, Lcom/genymobile/scrcpy/Device;-><init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V

    iput-object v1, p0, Lcom/genymobile/scrcpy/Connection;->device:Lcom/genymobile/scrcpy/Device;

    .line 38
    invoke-virtual {v1, p0}, Lcom/genymobile/scrcpy/Device;->setRotationListener(Lcom/genymobile/scrcpy/Device$RotationListener;)V

    .line 39
    new-instance p2, Lcom/genymobile/scrcpy/Controller;

    iget-object v1, p0, Lcom/genymobile/scrcpy/Connection;->device:Lcom/genymobile/scrcpy/Device;

    invoke-direct {p2, v1, p0}, Lcom/genymobile/scrcpy/Controller;-><init>(Lcom/genymobile/scrcpy/Device;Lcom/genymobile/scrcpy/Connection;)V

    iput-object p2, p0, Lcom/genymobile/scrcpy/Connection;->controller:Lcom/genymobile/scrcpy/Controller;

    .line 40
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/Controller;->getSender()Lcom/genymobile/scrcpy/DeviceMessageSender;

    move-result-object p2

    invoke-static {p2}, Lcom/genymobile/scrcpy/Connection;->startDeviceMessageSender(Lcom/genymobile/scrcpy/DeviceMessageSender;)V

    .line 41
    iget-object p2, p0, Lcom/genymobile/scrcpy/Connection;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {p2, p0}, Lcom/genymobile/scrcpy/Device;->setClipboardListener(Lcom/genymobile/scrcpy/Device$ClipboardListener;)V

    .line 45
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getShowTouches()Z

    move-result p2

    const/4 v1, 0x1

    const/4 v2, -0x1

    const/4 v3, 0x0

    if-nez p2, :cond_0

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getStayAwake()Z

    move-result p2

    if-eqz p2, :cond_5

    .line 46
    :cond_0
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->createSettingsProvider()Lcom/genymobile/scrcpy/wrappers/ContentProvider;

    move-result-object p2

    .line 47
    :try_start_0
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getShowTouches()Z

    move-result v4

    if-eqz v4, :cond_1

    const-string v4, "system"

    const-string v5, "show_touches"

    .line 48
    invoke-virtual {p2, v4, v5, v0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getAndPutValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    .line 50
    invoke-virtual {v0, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    xor-int/2addr v0, v1

    goto :goto_0

    :cond_1
    const/4 v0, 0x0

    .line 53
    :goto_0
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getStayAwake()Z

    move-result v4

    if-eqz v4, :cond_3

    const/4 v4, 0x7

    const-string v5, "global"

    const-string v6, "stay_on_while_plugged_in"

    .line 55
    invoke-static {v4}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;

    move-result-object v7

    invoke-virtual {p2, v5, v6, v7}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getAndPutValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v5
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 57
    :try_start_1
    invoke-static {v5}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v3
    :try_end_1
    .catch Ljava/lang/NumberFormatException; {:try_start_1 .. :try_end_1} :catch_0
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    if-ne v3, v4, :cond_2

    goto :goto_1

    :cond_2
    move v2, v3

    goto :goto_1

    :catch_0
    const/4 v2, 0x0

    :cond_3
    :goto_1
    if-eqz p2, :cond_4

    .line 66
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->close()V

    :cond_4
    move v3, v0

    .line 70
    :cond_5
    :try_start_2
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getDisplayId()I

    move-result p2

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getPowerOffScreenOnClose()Z

    move-result p1

    invoke-static {p2, v2, v3, v1, p1}, Lcom/genymobile/scrcpy/CleanUp;->configure(IIZZZ)V
    :try_end_2
    .catch Ljava/io/IOException; {:try_start_2 .. :try_end_2} :catch_1

    goto :goto_2

    :catch_1
    move-exception p1

    .line 72
    new-instance p2, Ljava/lang/StringBuilder;

    invoke-direct {p2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v0, "CleanUp.configure() failed:"

    invoke-virtual {p2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/io/IOException;->getMessage()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p2, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    :goto_2
    return-void

    :catchall_0
    move-exception p1

    .line 46
    :try_start_3
    throw p1
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_1

    :catchall_1
    move-exception v0

    if-eqz p2, :cond_6

    .line 66
    :try_start_4
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->close()V
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_2

    goto :goto_3

    :catchall_2
    move-exception p2

    invoke-virtual {p1, p2}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :cond_6
    :goto_3
    throw v0
.end method

.method private static startDeviceMessageSender(Lcom/genymobile/scrcpy/DeviceMessageSender;)V
    .locals 2

    .line 106
    new-instance v0, Ljava/lang/Thread;

    new-instance v1, Lcom/genymobile/scrcpy/Connection$1;

    invoke-direct {v1, p0}, Lcom/genymobile/scrcpy/Connection$1;-><init>(Lcom/genymobile/scrcpy/DeviceMessageSender;)V

    invoke-direct {v0, v1}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;)V

    .line 116
    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    return-void
.end method


# virtual methods
.method abstract close()V
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation
.end method

.method abstract hasConnections()Z
.end method

.method public onClipboardTextChanged(Ljava/lang/String;)V
    .locals 1

    .line 101
    iget-object v0, p0, Lcom/genymobile/scrcpy/Connection;->controller:Lcom/genymobile/scrcpy/Controller;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Controller;->getSender()Lcom/genymobile/scrcpy/DeviceMessageSender;

    move-result-object v0

    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/DeviceMessageSender;->pushClipboardText(Ljava/lang/String;)V

    return-void
.end method

.method public onRotationChanged(I)V
    .locals 0

    .line 94
    iget-object p1, p0, Lcom/genymobile/scrcpy/Connection;->streamInvalidateListener:Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;

    if-eqz p1, :cond_0

    .line 95
    invoke-interface {p1}, Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;->onStreamInvalidate()V

    :cond_0
    return-void
.end method

.method abstract send(Ljava/nio/ByteBuffer;)V
.end method

.method abstract sendDeviceMessage(Lcom/genymobile/scrcpy/DeviceMessage;)V
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation
.end method

.method public setStreamInvalidateListener(Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;)V
    .locals 0

    .line 89
    iput-object p1, p0, Lcom/genymobile/scrcpy/Connection;->streamInvalidateListener:Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;

    return-void
.end method

.method public setVideoSettings(Lcom/genymobile/scrcpy/VideoSettings;)Z
    .locals 1

    .line 77
    iget-object v0, p0, Lcom/genymobile/scrcpy/Connection;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/VideoSettings;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-nez v0, :cond_1

    .line 78
    iget-object v0, p0, Lcom/genymobile/scrcpy/Connection;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/VideoSettings;->merge(Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 79
    iget-object p1, p0, Lcom/genymobile/scrcpy/Connection;->device:Lcom/genymobile/scrcpy/Device;

    iget-object v0, p0, Lcom/genymobile/scrcpy/Connection;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/Device;->applyNewVideoSetting(Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 80
    iget-object p1, p0, Lcom/genymobile/scrcpy/Connection;->streamInvalidateListener:Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;

    if-eqz p1, :cond_0

    .line 81
    invoke-interface {p1}, Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;->onStreamInvalidate()V

    :cond_0
    const/4 p1, 0x1

    return p1

    :cond_1
    const/4 p1, 0x0

    return p1
.end method
