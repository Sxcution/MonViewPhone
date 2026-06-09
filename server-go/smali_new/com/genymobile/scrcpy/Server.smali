.class public final Lcom/genymobile/scrcpy/Server;
.super Ljava/lang/Object;
.source "Server.java"


# direct methods
.method private constructor <init>()V
    .registers 1

    .line 13
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 14
    return-void
.end method

.method public static varargs main([Ljava/lang/String;)V
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    .line 112
    new-instance v0, Lcom/genymobile/scrcpy/Server$1;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/Server$1;-><init>()V

    invoke-static {v0}, Ljava/lang/Thread;->setDefaultUncaughtExceptionHandler(Ljava/lang/Thread$UncaughtExceptionHandler;)V

    .line 119
    new-instance v0, Lcom/genymobile/scrcpy/Options;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/Options;-><init>()V

    .line 120
    new-instance v1, Lcom/genymobile/scrcpy/VideoSettings;

    invoke-direct {v1}, Lcom/genymobile/scrcpy/VideoSettings;-><init>()V

    .line 121
    invoke-static {v0, v1, p0}, Lcom/genymobile/scrcpy/Server;->parseArguments(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;[Ljava/lang/String;)V

    .line 122
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Options;->getLogLevel()Lcom/genymobile/scrcpy/Ln$Level;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->initLogLevel(Lcom/genymobile/scrcpy/Ln$Level;)V

    .line 123
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Options;->getServerType()I

    move-result p0

    const/4 v2, 0x1

    if-ne p0, v2, :cond_29

    .line 124
    new-instance p0, Lcom/genymobile/scrcpy/DesktopConnection;

    invoke-direct {p0, v0, v1}, Lcom/genymobile/scrcpy/DesktopConnection;-><init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V

    goto :goto_3b

    .line 125
    :cond_29
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Options;->getServerType()I

    move-result p0

    const/4 v1, 0x2

    if-ne p0, v1, :cond_3b

    .line 126
    new-instance p0, Lcom/genymobile/scrcpy/WSServer;

    invoke-direct {p0, v0}, Lcom/genymobile/scrcpy/WSServer;-><init>(Lcom/genymobile/scrcpy/Options;)V

    .line 127
    invoke-virtual {p0, v2}, Lcom/genymobile/scrcpy/WSServer;->setReuseAddr(Z)V

    .line 128
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/WSServer;->run()V

    .line 130
    :cond_3b
    :goto_3b
    return-void
.end method

.method private static varargs parseArguments(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;[Ljava/lang/String;)V
    .registers 9

    .line 17
    array-length v0, p2

    const/4 v1, 0x1

    if-lt v0, v1, :cond_125

    .line 20
    const/4 v0, 0x0

    aget-object v0, p2, v0

    .line 21
    const-string v2, "1.19-ws6"

    invoke-virtual {v0, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_106

    .line 24
    aget-object v0, p2, v1

    invoke-virtual {v0}, Ljava/lang/String;->toLowerCase()Ljava/lang/String;

    move-result-object v0

    const-string v2, "web"

    invoke-virtual {v0, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    const/4 v2, 0x4

    const/4 v3, 0x3

    const/4 v4, 0x2

    if-eqz v0, :cond_4f

    .line 25
    invoke-virtual {p0, v4}, Lcom/genymobile/scrcpy/Options;->setServerType(I)V

    .line 26
    array-length p1, p2

    if-le p1, v4, :cond_35

    .line 27
    aget-object p1, p2, v4

    sget-object v0, Ljava/util/Locale;->ENGLISH:Ljava/util/Locale;

    invoke-virtual {p1, v0}, Ljava/lang/String;->toUpperCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln$Level;->valueOf(Ljava/lang/String;)Lcom/genymobile/scrcpy/Ln$Level;

    move-result-object p1

    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/Options;->setLogLevel(Lcom/genymobile/scrcpy/Ln$Level;)V

    .line 29
    :cond_35
    array-length p1, p2

    if-le p1, v3, :cond_41

    .line 30
    aget-object p1, p2, v3

    invoke-static {p1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p1

    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/Options;->setPortNumber(I)V

    .line 32
    :cond_41
    array-length p1, p2

    if-le p1, v2, :cond_4e

    .line 33
    aget-object p1, p2, v2

    invoke-static {p1}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result p1

    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/Options;->setListenOnAllInterfaces(Z)V

    .line 34
    return-void

    .line 36
    :cond_4e
    return-void

    .line 38
    :cond_4f
    array-length v0, p2

    const/16 v5, 0x10

    if-ne v0, v5, :cond_fe

    .line 41
    aget-object v0, p2, v1

    sget-object v1, Ljava/util/Locale;->ENGLISH:Ljava/util/Locale;

    invoke-virtual {v0, v1}, Ljava/lang/String;->toUpperCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln$Level;->valueOf(Ljava/lang/String;)Lcom/genymobile/scrcpy/Ln$Level;

    move-result-object v0

    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setLogLevel(Lcom/genymobile/scrcpy/Ln$Level;)V

    .line 42
    aget-object v0, p2, v4

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    .line 43
    if-eqz v0, :cond_6e

    .line 44
    invoke-virtual {p1, v0, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setBounds(II)V

    .line 46
    :cond_6e
    aget-object v0, p2, v3

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setBitRate(I)V

    .line 47
    aget-object v0, p2, v2

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setMaxFps(I)V

    .line 48
    const/4 v0, 0x5

    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setLockedVideoOrientation(I)V

    .line 49
    const/4 v0, 0x6

    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result v0

    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setTunnelForward(Z)V

    .line 50
    const/4 v0, 0x7

    aget-object v0, p2, v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Server;->parseCrop(Ljava/lang/String;)Landroid/graphics/Rect;

    move-result-object v0

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setCrop(Landroid/graphics/Rect;)V

    .line 51
    const/16 v0, 0x8

    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result v0

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setSendFrameMeta(Z)V

    .line 52
    const/16 v0, 0x9

    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result v0

    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setControl(Z)V

    .line 53
    const/16 v0, 0xa

    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setDisplayId(I)V

    .line 54
    const/16 v0, 0xb

    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result v0

    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setShowTouches(Z)V

    .line 55
    const/16 v0, 0xc

    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result v0

    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setStayAwake(Z)V

    .line 56
    const/16 v0, 0xd

    aget-object v0, p2, v0

    .line 57
    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setCodecOptions(Ljava/lang/String;)V

    .line 58
    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setCodecOptions(Ljava/lang/String;)V

    .line 59
    const-string v0, "-"

    const/16 v1, 0xe

    aget-object v2, p2, v1

    invoke-virtual {v0, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_ed

    const/4 v0, 0x0

    goto :goto_ef

    :cond_ed
    aget-object v0, p2, v1

    :goto_ef
    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setEncoderName(Ljava/lang/String;)V

    .line 60
    const/16 p1, 0xf

    aget-object p1, p2, p1

    invoke-static {p1}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result p1

    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/Options;->setPowerOffScreenOnClose(Z)V

    .line 61
    return-void

    .line 39
    :cond_fe
    new-instance p0, Ljava/lang/IllegalArgumentException;

    const-string p1, "Expecting 16 parameters"

    invoke-direct {p0, p1}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 22
    :cond_106
    new-instance p0, Ljava/lang/IllegalArgumentException;

    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1}, Ljava/lang/StringBuilder;-><init>()V

    const-string p2, "The server version (1.19-ws6) does not match the client ("

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string p2, ")"

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 18
    :cond_125
    new-instance p0, Ljava/lang/IllegalArgumentException;

    const-string p1, "Missing client version"

    invoke-direct {p0, p1}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0
.end method

.method private static parseCrop(Ljava/lang/String;)Landroid/graphics/Rect;
    .registers 5

    .line 64
    const-string v0, "-"

    invoke-virtual {v0, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_a

    .line 65
    const/4 p0, 0x0

    return-object p0

    .line 67
    :cond_a
    const-string v0, ":"

    invoke-virtual {p0, v0}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;

    move-result-object v0

    .line 68
    array-length v1, v0

    const/4 v2, 0x4

    if-ne v1, v2, :cond_38

    .line 71
    const/4 p0, 0x0

    aget-object p0, v0, p0

    invoke-static {p0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p0

    .line 72
    const/4 v1, 0x1

    aget-object v1, v0, v1

    invoke-static {v1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v1

    .line 73
    const/4 v2, 0x2

    aget-object v2, v0, v2

    invoke-static {v2}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v2

    .line 74
    const/4 v3, 0x3

    aget-object v0, v0, v3

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    .line 75
    new-instance v3, Landroid/graphics/Rect;

    add-int/2addr p0, v2

    add-int/2addr v1, v0

    invoke-direct {v3, v2, v0, p0, v1}, Landroid/graphics/Rect;-><init>(IIII)V

    return-object v3

    .line 69
    :cond_38
    new-instance v0, Ljava/lang/IllegalArgumentException;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Crop must contains 4 values separated by colons: \""

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    const-string v1, "\""

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-direct {v0, p0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw v0
.end method

.method public static suggestFix(Ljava/lang/Throwable;)V
    .registers 5

    .line 81
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x17

    if-lt v0, v1, :cond_24

    instance-of v0, p0, Landroid/media/MediaCodec$CodecException;

    if-eqz v0, :cond_24

    move-object v0, p0

    check-cast v0, Landroid/media/MediaCodec$CodecException;

    invoke-virtual {v0}, Landroid/media/MediaCodec$CodecException;->getErrorCode()I

    move-result v0

    const/16 v1, -0x3f2

    if-ne v0, v1, :cond_24

    .line 82
    const-string v0, "The hardware encoder is not able to encode at the given definition."

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 83
    const-string v0, "Try with a lower definition:"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 84
    const-string v0, "    scrcpy -m 1024"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 86
    :cond_24
    nop

    .line 87
    instance-of v0, p0, Lcom/genymobile/scrcpy/InvalidDisplayIdException;

    const/4 v1, 0x0

    if-eqz v0, :cond_5b

    .line 88
    check-cast p0, Lcom/genymobile/scrcpy/InvalidDisplayIdException;

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/InvalidDisplayIdException;->getAvailableDisplayIds()[I

    move-result-object p0

    .line 89
    if-eqz p0, :cond_5a

    array-length v0, p0

    if-gtz v0, :cond_36

    goto :goto_5a

    .line 92
    :cond_36
    const-string v0, "Try to use one of the available display ids:"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 93
    array-length v0, p0

    .line 94
    :goto_3c
    if-ge v1, v0, :cond_59

    .line 95
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "    scrcpy --display "

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    aget v3, p0, v1

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 96
    add-int/lit8 v1, v1, 0x1

    goto :goto_3c

    .line 98
    :cond_59
    return-void

    .line 90
    :cond_5a
    :goto_5a
    return-void

    .line 100
    :cond_5b
    instance-of v0, p0, Lcom/genymobile/scrcpy/InvalidEncoderException;

    if-eqz v0, :cond_99

    check-cast p0, Lcom/genymobile/scrcpy/InvalidEncoderException;

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/InvalidEncoderException;->getAvailableEncoders()[Landroid/media/MediaCodecInfo;

    move-result-object p0

    if-eqz p0, :cond_99

    array-length v0, p0

    if-gtz v0, :cond_6b

    goto :goto_99

    .line 103
    :cond_6b
    const-string v0, "Try to use one of the available encoders:"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 104
    array-length v0, p0

    .line 105
    :goto_71
    if-ge v1, v0, :cond_98

    .line 106
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "    scrcpy --encoder \'"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    aget-object v3, p0, v1

    invoke-virtual {v3}, Landroid/media/MediaCodecInfo;->getName()Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    const-string v3, "\'"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 107
    add-int/lit8 v1, v1, 0x1

    goto :goto_71

    .line 109
    :cond_98
    return-void

    .line 101
    :cond_99
    :goto_99
    return-void
.end method
