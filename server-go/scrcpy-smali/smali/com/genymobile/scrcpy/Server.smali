.class public final Lcom/genymobile/scrcpy/Server;
.super Ljava/lang/Object;
.source "Server.java"


# direct methods
.method private constructor <init>()V
    .locals 0

    .line 13
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method static synthetic access$000(Ljava/lang/Throwable;)V
    .locals 0

    .line 10
    invoke-static {p0}, Lcom/genymobile/scrcpy/Server;->suggestFix(Ljava/lang/Throwable;)V

    return-void
.end method

.method public static varargs main([Ljava/lang/String;)V
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    .line 149
    new-instance v0, Lcom/genymobile/scrcpy/Server$1;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/Server$1;-><init>()V

    invoke-static {v0}, Ljava/lang/Thread;->setDefaultUncaughtExceptionHandler(Ljava/lang/Thread$UncaughtExceptionHandler;)V

    .line 157
    new-instance v0, Lcom/genymobile/scrcpy/Options;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/Options;-><init>()V

    .line 158
    new-instance v1, Lcom/genymobile/scrcpy/VideoSettings;

    invoke-direct {v1}, Lcom/genymobile/scrcpy/VideoSettings;-><init>()V

    .line 159
    invoke-static {v0, v1, p0}, Lcom/genymobile/scrcpy/Server;->parseArguments(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;[Ljava/lang/String;)V

    .line 160
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Options;->getLogLevel()Lcom/genymobile/scrcpy/Ln$Level;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->initLogLevel(Lcom/genymobile/scrcpy/Ln$Level;)V

    .line 161
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Options;->getServerType()I

    move-result p0

    const/4 v2, 0x1

    if-ne p0, v2, :cond_0

    .line 162
    new-instance p0, Lcom/genymobile/scrcpy/DesktopConnection;

    invoke-direct {p0, v0, v1}, Lcom/genymobile/scrcpy/DesktopConnection;-><init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V

    goto :goto_0

    .line 163
    :cond_0
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Options;->getServerType()I

    move-result p0

    const/4 v1, 0x2

    if-ne p0, v1, :cond_1

    .line 164
    new-instance p0, Lcom/genymobile/scrcpy/WSServer;

    invoke-direct {p0, v0}, Lcom/genymobile/scrcpy/WSServer;-><init>(Lcom/genymobile/scrcpy/Options;)V

    .line 165
    invoke-virtual {p0, v2}, Lcom/genymobile/scrcpy/WSServer;->setReuseAddr(Z)V

    .line 166
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/WSServer;->run()V

    :cond_1
    :goto_0
    return-void
.end method

.method private static varargs parseArguments(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;[Ljava/lang/String;)V
    .locals 6

    .line 18
    array-length v0, p2

    const/4 v1, 0x1

    if-lt v0, v1, :cond_8

    const/4 v0, 0x0

    .line 22
    aget-object v0, p2, v0

    const-string v2, "1.19-ws6"

    .line 23
    invoke-virtual {v0, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_7

    .line 28
    aget-object v0, p2, v1

    invoke-virtual {v0}, Ljava/lang/String;->toLowerCase()Ljava/lang/String;

    move-result-object v0

    const-string v2, "web"

    invoke-virtual {v0, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    const/4 v2, 0x4

    const/4 v3, 0x3

    const/4 v4, 0x2

    if-eqz v0, :cond_3

    .line 29
    invoke-virtual {p0, v4}, Lcom/genymobile/scrcpy/Options;->setServerType(I)V

    .line 30
    array-length p1, p2

    if-le p1, v4, :cond_0

    .line 31
    aget-object p1, p2, v4

    sget-object v0, Ljava/util/Locale;->ENGLISH:Ljava/util/Locale;

    invoke-virtual {p1, v0}, Ljava/lang/String;->toUpperCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln$Level;->valueOf(Ljava/lang/String;)Lcom/genymobile/scrcpy/Ln$Level;

    move-result-object p1

    .line 32
    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/Options;->setLogLevel(Lcom/genymobile/scrcpy/Ln$Level;)V

    .line 34
    :cond_0
    array-length p1, p2

    if-le p1, v3, :cond_1

    .line 35
    aget-object p1, p2, v3

    invoke-static {p1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p1

    .line 36
    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/Options;->setPortNumber(I)V

    .line 38
    :cond_1
    array-length p1, p2

    if-le p1, v2, :cond_2

    .line 39
    aget-object p1, p2, v2

    invoke-static {p1}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result p1

    .line 40
    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/Options;->setListenOnAllInterfaces(Z)V

    :cond_2
    return-void

    .line 46
    :cond_3
    array-length v0, p2

    const/16 v5, 0x10

    if-ne v0, v5, :cond_6

    .line 50
    aget-object v0, p2, v1

    sget-object v1, Ljava/util/Locale;->ENGLISH:Ljava/util/Locale;

    invoke-virtual {v0, v1}, Ljava/lang/String;->toUpperCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln$Level;->valueOf(Ljava/lang/String;)Lcom/genymobile/scrcpy/Ln$Level;

    move-result-object v0

    .line 51
    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setLogLevel(Lcom/genymobile/scrcpy/Ln$Level;)V

    .line 53
    aget-object v0, p2, v4

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    if-eqz v0, :cond_4

    .line 55
    invoke-virtual {p1, v0, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setBounds(II)V

    .line 58
    :cond_4
    aget-object v0, p2, v3

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    .line 59
    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setBitRate(I)V

    .line 61
    aget-object v0, p2, v2

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    .line 62
    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setMaxFps(I)V

    const/4 v0, 0x5

    .line 64
    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    .line 65
    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setLockedVideoOrientation(I)V

    const/4 v0, 0x6

    .line 68
    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result v0

    .line 69
    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setTunnelForward(Z)V

    const/4 v0, 0x7

    .line 71
    aget-object v0, p2, v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Server;->parseCrop(Ljava/lang/String;)Landroid/graphics/Rect;

    move-result-object v0

    .line 72
    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setCrop(Landroid/graphics/Rect;)V

    const/16 v0, 0x8

    .line 74
    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result v0

    .line 75
    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setSendFrameMeta(Z)V

    const/16 v0, 0x9

    .line 77
    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result v0

    .line 78
    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setControl(Z)V

    const/16 v0, 0xa

    .line 80
    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    .line 81
    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setDisplayId(I)V

    const/16 v0, 0xb

    .line 83
    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result v0

    .line 84
    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setShowTouches(Z)V

    const/16 v0, 0xc

    .line 86
    aget-object v0, p2, v0

    invoke-static {v0}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result v0

    .line 87
    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setStayAwake(Z)V

    const/16 v0, 0xd

    .line 89
    aget-object v0, p2, v0

    .line 90
    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/Options;->setCodecOptions(Ljava/lang/String;)V

    .line 91
    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setCodecOptions(Ljava/lang/String;)V

    const/16 v0, 0xe

    .line 93
    aget-object v1, p2, v0

    const-string v2, "-"

    invoke-virtual {v2, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_5

    const/4 v0, 0x0

    goto :goto_0

    :cond_5
    aget-object v0, p2, v0

    .line 94
    :goto_0
    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/VideoSettings;->setEncoderName(Ljava/lang/String;)V

    const/16 p1, 0xf

    .line 96
    aget-object p1, p2, p1

    invoke-static {p1}, Ljava/lang/Boolean;->parseBoolean(Ljava/lang/String;)Z

    move-result p1

    .line 97
    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/Options;->setPowerOffScreenOnClose(Z)V

    return-void

    .line 47
    :cond_6
    new-instance p0, Ljava/lang/IllegalArgumentException;

    const-string p1, "Expecting 16 parameters"

    invoke-direct {p0, p1}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 24
    :cond_7
    new-instance p0, Ljava/lang/IllegalArgumentException;

    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1}, Ljava/lang/StringBuilder;-><init>()V

    const-string p2, "The server version (1.19-ws6) does not match the client ("

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p2, ")"

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 19
    :cond_8
    new-instance p0, Ljava/lang/IllegalArgumentException;

    const-string p1, "Missing client version"

    invoke-direct {p0, p1}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0
.end method

.method private static parseCrop(Ljava/lang/String;)Landroid/graphics/Rect;
    .locals 4

    const-string v0, "-"

    .line 101
    invoke-virtual {v0, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_0

    const/4 p0, 0x0

    return-object p0

    :cond_0
    const-string v0, ":"

    .line 105
    invoke-virtual {p0, v0}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;

    move-result-object v0

    .line 106
    array-length v1, v0

    const/4 v2, 0x4

    if-ne v1, v2, :cond_1

    const/4 p0, 0x0

    .line 109
    aget-object p0, v0, p0

    invoke-static {p0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p0

    const/4 v1, 0x1

    .line 110
    aget-object v1, v0, v1

    invoke-static {v1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v1

    const/4 v2, 0x2

    .line 111
    aget-object v2, v0, v2

    invoke-static {v2}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v2

    const/4 v3, 0x3

    .line 112
    aget-object v0, v0, v3

    invoke-static {v0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result v0

    .line 113
    new-instance v3, Landroid/graphics/Rect;

    add-int/2addr p0, v2

    add-int/2addr v1, v0

    invoke-direct {v3, v2, v0, p0, v1}, Landroid/graphics/Rect;-><init>(IIII)V

    return-object v3

    .line 107
    :cond_1
    new-instance v0, Ljava/lang/IllegalArgumentException;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Crop must contains 4 values separated by colons: \""

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p0, "\""

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-direct {v0, p0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw v0
.end method

.method private static suggestFix(Ljava/lang/Throwable;)V
    .locals 5

    .line 117
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x17

    if-lt v0, v1, :cond_0

    .line 118
    instance-of v0, p0, Landroid/media/MediaCodec$CodecException;

    if-eqz v0, :cond_0

    .line 119
    move-object v0, p0

    check-cast v0, Landroid/media/MediaCodec$CodecException;

    .line 120
    invoke-virtual {v0}, Landroid/media/MediaCodec$CodecException;->getErrorCode()I

    move-result v0

    const/16 v1, -0x3f2

    if-ne v0, v1, :cond_0

    const-string v0, "The hardware encoder is not able to encode at the given definition."

    .line 121
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    const-string v0, "Try with a lower definition:"

    .line 122
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    const-string v0, "    scrcpy -m 1024"

    .line 123
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 127
    :cond_0
    instance-of v0, p0, Lcom/genymobile/scrcpy/InvalidDisplayIdException;

    const/4 v1, 0x0

    if-eqz v0, :cond_1

    .line 128
    check-cast p0, Lcom/genymobile/scrcpy/InvalidDisplayIdException;

    .line 129
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/InvalidDisplayIdException;->getAvailableDisplayIds()[I

    move-result-object p0

    if-eqz p0, :cond_2

    .line 130
    array-length v0, p0

    if-lez v0, :cond_2

    const-string v0, "Try to use one of the available display ids:"

    .line 131
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 132
    array-length v0, p0

    :goto_0
    if-ge v1, v0, :cond_2

    aget v2, p0, v1

    .line 133
    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "    scrcpy --display "

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    add-int/lit8 v1, v1, 0x1

    goto :goto_0

    .line 136
    :cond_1
    instance-of v0, p0, Lcom/genymobile/scrcpy/InvalidEncoderException;

    if-eqz v0, :cond_2

    .line 137
    check-cast p0, Lcom/genymobile/scrcpy/InvalidEncoderException;

    .line 138
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/InvalidEncoderException;->getAvailableEncoders()[Landroid/media/MediaCodecInfo;

    move-result-object p0

    if-eqz p0, :cond_2

    .line 139
    array-length v0, p0

    if-lez v0, :cond_2

    const-string v0, "Try to use one of the available encoders:"

    .line 140
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 141
    array-length v0, p0

    :goto_1
    if-ge v1, v0, :cond_2

    aget-object v2, p0, v1

    .line 142
    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "    scrcpy --encoder \'"

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Landroid/media/MediaCodecInfo;->getName()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v2, "\'"

    invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    add-int/lit8 v1, v1, 0x1

    goto :goto_1

    :cond_2
    return-void
.end method
