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
    .registers 11

    .line 32
    const-string v0, "1"

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 15
    new-instance v1, Lcom/genymobile/scrcpy/ControlMessageReader;

    invoke-direct {v1}, Lcom/genymobile/scrcpy/ControlMessageReader;-><init>()V

    iput-object v1, p0, Lcom/genymobile/scrcpy/Connection;->reader:Lcom/genymobile/scrcpy/ControlMessageReader;

    .line 33
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Device: "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    sget-object v2, Landroid/os/Build;->MANUFACTURER:Ljava/lang/String;

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    const-string v2, " "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    sget-object v2, Landroid/os/Build;->MODEL:Ljava/lang/String;

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    const-string v2, " (Android "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    sget-object v2, Landroid/os/Build$VERSION;->RELEASE:Ljava/lang/String;

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    const-string v2, ")"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-static {v1}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 34
    iput-object p2, p0, Lcom/genymobile/scrcpy/Connection;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    .line 35
    iput-object p1, p0, Lcom/genymobile/scrcpy/Connection;->options:Lcom/genymobile/scrcpy/Options;

    .line 36
    new-instance v1, Lcom/genymobile/scrcpy/Device;

    invoke-direct {v1, p1, p2}, Lcom/genymobile/scrcpy/Device;-><init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 37
    iput-object v1, p0, Lcom/genymobile/scrcpy/Connection;->device:Lcom/genymobile/scrcpy/Device;

    .line 38
    invoke-virtual {v1, p0}, Lcom/genymobile/scrcpy/Device;->setRotationListener(Lcom/genymobile/scrcpy/Device$RotationListener;)V

    .line 39
    new-instance p2, Lcom/genymobile/scrcpy/Controller;

    iget-object v1, p0, Lcom/genymobile/scrcpy/Connection;->device:Lcom/genymobile/scrcpy/Device;

    invoke-direct {p2, v1, p0}, Lcom/genymobile/scrcpy/Controller;-><init>(Lcom/genymobile/scrcpy/Device;Lcom/genymobile/scrcpy/Connection;)V

    .line 40
    iput-object p2, p0, Lcom/genymobile/scrcpy/Connection;->controller:Lcom/genymobile/scrcpy/Controller;

    .line 41
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/Controller;->getSender()Lcom/genymobile/scrcpy/DeviceMessageSender;

    move-result-object p2

    invoke-static {p2}, Lcom/genymobile/scrcpy/Connection;->startDeviceMessageSender(Lcom/genymobile/scrcpy/DeviceMessageSender;)V

    .line 42
    iget-object p2, p0, Lcom/genymobile/scrcpy/Connection;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {p2, p0}, Lcom/genymobile/scrcpy/Device;->setClipboardListener(Lcom/genymobile/scrcpy/Device$ClipboardListener;)V

    .line 43
    nop

    .line 44
    nop

    .line 45
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getShowTouches()Z

    move-result p2

    const/4 v1, 0x1

    const/4 v2, -0x1

    const/4 v3, 0x0

    if-nez p2, :cond_76

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getStayAwake()Z

    move-result p2

    if-eqz p2, :cond_b5

    .line 46
    :cond_76
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->createSettingsProvider()Lcom/genymobile/scrcpy/wrappers/ContentProvider;

    move-result-object p2

    .line 48
    :try_start_7a
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getShowTouches()Z

    move-result v4

    if-eqz v4, :cond_90

    const-string v4, "system"

    const-string v5, "show_touches"

    invoke-virtual {p2, v4, v5, v0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getAndPutValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v0, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-nez v0, :cond_90

    const/4 v0, 0x1

    goto :goto_91

    :cond_90
    const/4 v0, 0x0

    .line 49
    :goto_91
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getStayAwake()Z

    move-result v4
    :try_end_95
    .catchall {:try_start_7a .. :try_end_95} :catchall_dd

    if-eqz v4, :cond_ae

    .line 51
    :try_start_97
    const-string v4, "global"

    const-string v5, "stay_on_while_plugged_in"

    const/4 v6, 0x7

    invoke-static {v6}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;

    move-result-object v7

    invoke-virtual {p2, v4, v5, v7}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getAndPutValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    invoke-static {v4}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v3
    :try_end_a8
    .catch Ljava/lang/NumberFormatException; {:try_start_97 .. :try_end_a8} :catch_ac
    .catchall {:try_start_97 .. :try_end_a8} :catchall_dd

    .line 52
    if-eq v3, v6, :cond_ab

    .line 53
    move v2, v3

    .line 57
    :cond_ab
    goto :goto_ae

    .line 55
    :catch_ac
    move-exception v2

    .line 56
    const/4 v2, 0x0

    .line 59
    :cond_ae
    :goto_ae
    if-eqz p2, :cond_b3

    .line 60
    :try_start_b0
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->close()V
    :try_end_b3
    .catchall {:try_start_b0 .. :try_end_b3} :catchall_dd

    .line 62
    :cond_b3
    nop

    .line 76
    move v3, v0

    .line 79
    :cond_b5
    :try_start_b5
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getDisplayId()I

    move-result p2

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getPowerOffScreenOnClose()Z

    move-result p1

    invoke-static {p2, v2, v3, v1, p1}, Lcom/genymobile/scrcpy/CleanUp;->configure(IIZZZ)V
    :try_end_c0
    .catch Ljava/io/IOException; {:try_start_b5 .. :try_end_c0} :catch_c1

    .line 82
    goto :goto_dc

    .line 80
    :catch_c1
    move-exception p1

    .line 81
    new-instance p2, Ljava/lang/StringBuilder;

    invoke-direct {p2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v0, "CleanUp.configure() failed:"

    invoke-virtual {p2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p2

    invoke-virtual {p1}, Ljava/io/IOException;->getMessage()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p2, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 83
    :goto_dc
    return-void

    .line 63
    :catchall_dd
    move-exception p1

    .line 65
    :try_start_de
    throw p1
    :try_end_df
    .catchall {:try_start_de .. :try_end_df} :catchall_df

    .line 66
    :catchall_df
    move-exception v0

    .line 67
    if-eqz p2, :cond_ea

    .line 69
    :try_start_e2
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->close()V
    :try_end_e5
    .catchall {:try_start_e2 .. :try_end_e5} :catchall_e6

    .line 72
    goto :goto_ea

    .line 70
    :catchall_e6
    move-exception p2

    .line 71
    invoke-virtual {p1, p2}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    .line 74
    :cond_ea
    :goto_ea
    throw v0
.end method

.method private static startDeviceMessageSender(Lcom/genymobile/scrcpy/DeviceMessageSender;)V
    .registers 3

    .line 117
    new-instance v0, Ljava/lang/Thread;

    new-instance v1, Lcom/genymobile/scrcpy/Connection$1;

    invoke-direct {v1, p0}, Lcom/genymobile/scrcpy/Connection$1;-><init>(Lcom/genymobile/scrcpy/DeviceMessageSender;)V

    invoke-direct {v0, v1}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;)V

    .line 126
    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    .line 127
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
    .registers 3

    .line 113
    iget-object v0, p0, Lcom/genymobile/scrcpy/Connection;->controller:Lcom/genymobile/scrcpy/Controller;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Controller;->getSender()Lcom/genymobile/scrcpy/DeviceMessageSender;

    move-result-object v0

    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/DeviceMessageSender;->pushClipboardText(Ljava/lang/String;)V

    .line 114
    return-void
.end method

.method public onRotationChanged(I)V
    .registers 2

    .line 105
    iget-object p1, p0, Lcom/genymobile/scrcpy/Connection;->streamInvalidateListener:Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;

    .line 106
    if-eqz p1, :cond_7

    .line 107
    invoke-interface {p1}, Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;->onStreamInvalidate()V

    .line 109
    :cond_7
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
    .registers 2

    .line 100
    iput-object p1, p0, Lcom/genymobile/scrcpy/Connection;->streamInvalidateListener:Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;

    .line 101
    return-void
.end method

.method public setVideoSettings(Lcom/genymobile/scrcpy/VideoSettings;)Z
    .registers 3

    .line 86
    iget-object v0, p0, Lcom/genymobile/scrcpy/Connection;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/VideoSettings;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_a

    .line 87
    const/4 p1, 0x0

    return p1

    .line 89
    :cond_a
    iget-object v0, p0, Lcom/genymobile/scrcpy/Connection;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/VideoSettings;->merge(Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 90
    iget-object p1, p0, Lcom/genymobile/scrcpy/Connection;->device:Lcom/genymobile/scrcpy/Device;

    iget-object v0, p0, Lcom/genymobile/scrcpy/Connection;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/Device;->applyNewVideoSetting(Lcom/genymobile/scrcpy/VideoSettings;)V

    .line 91
    iget-object p1, p0, Lcom/genymobile/scrcpy/Connection;->streamInvalidateListener:Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;

    .line 92
    const/4 v0, 0x1

    if-nez p1, :cond_1c

    .line 93
    return v0

    .line 95
    :cond_1c
    invoke-interface {p1}, Lcom/genymobile/scrcpy/Connection$StreamInvalidateListener;->onStreamInvalidate()V

    .line 96
    return v0
.end method
