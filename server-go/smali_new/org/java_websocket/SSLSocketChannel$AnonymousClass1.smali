.class Lorg/java_websocket/SSLSocketChannel$AnonymousClass1;
.super Ljava/lang/Object;
.source "SSLSocketChannel.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lorg/java_websocket/SSLSocketChannel;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x8
    name = "AnonymousClass1"
.end annotation


# static fields
.field static final $SwitchMap$javax$net$ssl$SSLEngineResult$HandshakeStatus:[I

.field static final $SwitchMap$javax$net$ssl$SSLEngineResult$Status:[I


# direct methods
.method static constructor <clinit>()V
    .registers 7

    .line 250
    invoke-static {}, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->values()[Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;

    move-result-object v0

    array-length v0, v0

    new-array v0, v0, [I

    .line 251
    sput-object v0, Lorg/java_websocket/SSLSocketChannel$AnonymousClass1;->$SwitchMap$javax$net$ssl$SSLEngineResult$HandshakeStatus:[I

    .line 253
    const/4 v1, 0x1

    :try_start_a
    sget-object v2, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->FINISHED:Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;

    invoke-virtual {v2}, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->ordinal()I

    move-result v2

    aput v1, v0, v2
    :try_end_12
    .catch Ljava/lang/NoSuchFieldError; {:try_start_a .. :try_end_12} :catch_13

    .line 255
    goto :goto_14

    .line 254
    :catch_13
    move-exception v0

    .line 257
    :goto_14
    const/4 v0, 0x2

    :try_start_15
    sget-object v2, Lorg/java_websocket/SSLSocketChannel$AnonymousClass1;->$SwitchMap$javax$net$ssl$SSLEngineResult$HandshakeStatus:[I

    sget-object v3, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->NEED_UNWRAP:Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;

    invoke-virtual {v3}, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->ordinal()I

    move-result v3

    aput v0, v2, v3
    :try_end_1f
    .catch Ljava/lang/NoSuchFieldError; {:try_start_15 .. :try_end_1f} :catch_20

    .line 259
    goto :goto_21

    .line 258
    :catch_20
    move-exception v2

    .line 261
    :goto_21
    const/4 v2, 0x3

    :try_start_22
    sget-object v3, Lorg/java_websocket/SSLSocketChannel$AnonymousClass1;->$SwitchMap$javax$net$ssl$SSLEngineResult$HandshakeStatus:[I

    sget-object v4, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->NEED_WRAP:Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;

    invoke-virtual {v4}, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->ordinal()I

    move-result v4

    aput v2, v3, v4
    :try_end_2c
    .catch Ljava/lang/NoSuchFieldError; {:try_start_22 .. :try_end_2c} :catch_2d

    .line 263
    goto :goto_2e

    .line 262
    :catch_2d
    move-exception v3

    .line 265
    :goto_2e
    const/4 v3, 0x4

    :try_start_2f
    sget-object v4, Lorg/java_websocket/SSLSocketChannel$AnonymousClass1;->$SwitchMap$javax$net$ssl$SSLEngineResult$HandshakeStatus:[I

    sget-object v5, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->NEED_TASK:Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;

    invoke-virtual {v5}, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->ordinal()I

    move-result v5

    aput v3, v4, v5
    :try_end_39
    .catch Ljava/lang/NoSuchFieldError; {:try_start_2f .. :try_end_39} :catch_3a

    .line 267
    goto :goto_3b

    .line 266
    :catch_3a
    move-exception v4

    .line 269
    :goto_3b
    :try_start_3b
    sget-object v4, Lorg/java_websocket/SSLSocketChannel$AnonymousClass1;->$SwitchMap$javax$net$ssl$SSLEngineResult$HandshakeStatus:[I

    sget-object v5, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->NOT_HANDSHAKING:Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;

    invoke-virtual {v5}, Ljavax/net/ssl/SSLEngineResult$HandshakeStatus;->ordinal()I

    move-result v5

    const/4 v6, 0x5

    aput v6, v4, v5
    :try_end_46
    .catch Ljava/lang/NoSuchFieldError; {:try_start_3b .. :try_end_46} :catch_47

    .line 271
    goto :goto_48

    .line 270
    :catch_47
    move-exception v4

    .line 272
    :goto_48
    invoke-static {}, Ljavax/net/ssl/SSLEngineResult$Status;->values()[Ljavax/net/ssl/SSLEngineResult$Status;

    move-result-object v4

    array-length v4, v4

    new-array v4, v4, [I

    .line 273
    sput-object v4, Lorg/java_websocket/SSLSocketChannel$AnonymousClass1;->$SwitchMap$javax$net$ssl$SSLEngineResult$Status:[I

    .line 275
    :try_start_51
    sget-object v5, Ljavax/net/ssl/SSLEngineResult$Status;->OK:Ljavax/net/ssl/SSLEngineResult$Status;

    invoke-virtual {v5}, Ljavax/net/ssl/SSLEngineResult$Status;->ordinal()I

    move-result v5

    aput v1, v4, v5
    :try_end_59
    .catch Ljava/lang/NoSuchFieldError; {:try_start_51 .. :try_end_59} :catch_5a

    .line 277
    goto :goto_5b

    .line 276
    :catch_5a
    move-exception v1

    .line 279
    :goto_5b
    :try_start_5b
    sget-object v1, Lorg/java_websocket/SSLSocketChannel$AnonymousClass1;->$SwitchMap$javax$net$ssl$SSLEngineResult$Status:[I

    sget-object v4, Ljavax/net/ssl/SSLEngineResult$Status;->BUFFER_UNDERFLOW:Ljavax/net/ssl/SSLEngineResult$Status;

    invoke-virtual {v4}, Ljavax/net/ssl/SSLEngineResult$Status;->ordinal()I

    move-result v4

    aput v0, v1, v4
    :try_end_65
    .catch Ljava/lang/NoSuchFieldError; {:try_start_5b .. :try_end_65} :catch_66

    .line 281
    goto :goto_67

    .line 280
    :catch_66
    move-exception v0

    .line 283
    :goto_67
    :try_start_67
    sget-object v0, Lorg/java_websocket/SSLSocketChannel$AnonymousClass1;->$SwitchMap$javax$net$ssl$SSLEngineResult$Status:[I

    sget-object v1, Ljavax/net/ssl/SSLEngineResult$Status;->BUFFER_OVERFLOW:Ljavax/net/ssl/SSLEngineResult$Status;

    invoke-virtual {v1}, Ljavax/net/ssl/SSLEngineResult$Status;->ordinal()I

    move-result v1

    aput v2, v0, v1
    :try_end_71
    .catch Ljava/lang/NoSuchFieldError; {:try_start_67 .. :try_end_71} :catch_72

    .line 285
    goto :goto_73

    .line 284
    :catch_72
    move-exception v0

    .line 287
    :goto_73
    :try_start_73
    sget-object v0, Lorg/java_websocket/SSLSocketChannel$AnonymousClass1;->$SwitchMap$javax$net$ssl$SSLEngineResult$Status:[I

    sget-object v1, Ljavax/net/ssl/SSLEngineResult$Status;->CLOSED:Ljavax/net/ssl/SSLEngineResult$Status;

    invoke-virtual {v1}, Ljavax/net/ssl/SSLEngineResult$Status;->ordinal()I

    move-result v1

    aput v3, v0, v1
    :try_end_7d
    .catch Ljava/lang/NoSuchFieldError; {:try_start_73 .. :try_end_7d} :catch_7e

    .line 289
    goto :goto_7f

    .line 288
    :catch_7e
    move-exception v0

    .line 290
    :goto_7f
    return-void
.end method

.method constructor <init>()V
    .registers 1

    .line 245
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method
