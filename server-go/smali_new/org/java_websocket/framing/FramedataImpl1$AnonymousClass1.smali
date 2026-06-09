.class Lorg/java_websocket/framing/FramedataImpl1$AnonymousClass1;
.super Ljava/lang/Object;
.source "FramedataImpl1.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lorg/java_websocket/framing/FramedataImpl1;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x8
    name = "AnonymousClass1"
.end annotation


# static fields
.field static final $SwitchMap$org$java_websocket$enums$Opcode:[I


# direct methods
.method static constructor <clinit>()V
    .registers 3

    .line 140
    invoke-static {}, Lorg/java_websocket/enums/Opcode;->values()[Lorg/java_websocket/enums/Opcode;

    move-result-object v0

    array-length v0, v0

    new-array v0, v0, [I

    .line 141
    sput-object v0, Lorg/java_websocket/framing/FramedataImpl1$AnonymousClass1;->$SwitchMap$org$java_websocket$enums$Opcode:[I

    .line 143
    :try_start_9
    sget-object v1, Lorg/java_websocket/enums/Opcode;->PING:Lorg/java_websocket/enums/Opcode;

    invoke-virtual {v1}, Lorg/java_websocket/enums/Opcode;->ordinal()I

    move-result v1

    const/4 v2, 0x1

    aput v2, v0, v1
    :try_end_12
    .catch Ljava/lang/NoSuchFieldError; {:try_start_9 .. :try_end_12} :catch_13

    .line 145
    goto :goto_14

    .line 144
    :catch_13
    move-exception v0

    .line 147
    :goto_14
    :try_start_14
    sget-object v0, Lorg/java_websocket/framing/FramedataImpl1$AnonymousClass1;->$SwitchMap$org$java_websocket$enums$Opcode:[I

    sget-object v1, Lorg/java_websocket/enums/Opcode;->PONG:Lorg/java_websocket/enums/Opcode;

    invoke-virtual {v1}, Lorg/java_websocket/enums/Opcode;->ordinal()I

    move-result v1

    const/4 v2, 0x2

    aput v2, v0, v1
    :try_end_1f
    .catch Ljava/lang/NoSuchFieldError; {:try_start_14 .. :try_end_1f} :catch_20

    .line 149
    goto :goto_21

    .line 148
    :catch_20
    move-exception v0

    .line 151
    :goto_21
    :try_start_21
    sget-object v0, Lorg/java_websocket/framing/FramedataImpl1$AnonymousClass1;->$SwitchMap$org$java_websocket$enums$Opcode:[I

    sget-object v1, Lorg/java_websocket/enums/Opcode;->TEXT:Lorg/java_websocket/enums/Opcode;

    invoke-virtual {v1}, Lorg/java_websocket/enums/Opcode;->ordinal()I

    move-result v1

    const/4 v2, 0x3

    aput v2, v0, v1
    :try_end_2c
    .catch Ljava/lang/NoSuchFieldError; {:try_start_21 .. :try_end_2c} :catch_2d

    .line 153
    goto :goto_2e

    .line 152
    :catch_2d
    move-exception v0

    .line 155
    :goto_2e
    :try_start_2e
    sget-object v0, Lorg/java_websocket/framing/FramedataImpl1$AnonymousClass1;->$SwitchMap$org$java_websocket$enums$Opcode:[I

    sget-object v1, Lorg/java_websocket/enums/Opcode;->BINARY:Lorg/java_websocket/enums/Opcode;

    invoke-virtual {v1}, Lorg/java_websocket/enums/Opcode;->ordinal()I

    move-result v1

    const/4 v2, 0x4

    aput v2, v0, v1
    :try_end_39
    .catch Ljava/lang/NoSuchFieldError; {:try_start_2e .. :try_end_39} :catch_3a

    .line 157
    goto :goto_3b

    .line 156
    :catch_3a
    move-exception v0

    .line 159
    :goto_3b
    :try_start_3b
    sget-object v0, Lorg/java_websocket/framing/FramedataImpl1$AnonymousClass1;->$SwitchMap$org$java_websocket$enums$Opcode:[I

    sget-object v1, Lorg/java_websocket/enums/Opcode;->CLOSING:Lorg/java_websocket/enums/Opcode;

    invoke-virtual {v1}, Lorg/java_websocket/enums/Opcode;->ordinal()I

    move-result v1

    const/4 v2, 0x5

    aput v2, v0, v1
    :try_end_46
    .catch Ljava/lang/NoSuchFieldError; {:try_start_3b .. :try_end_46} :catch_47

    .line 161
    goto :goto_48

    .line 160
    :catch_47
    move-exception v0

    .line 163
    :goto_48
    :try_start_48
    sget-object v0, Lorg/java_websocket/framing/FramedataImpl1$AnonymousClass1;->$SwitchMap$org$java_websocket$enums$Opcode:[I

    sget-object v1, Lorg/java_websocket/enums/Opcode;->CONTINUOUS:Lorg/java_websocket/enums/Opcode;

    invoke-virtual {v1}, Lorg/java_websocket/enums/Opcode;->ordinal()I

    move-result v1

    const/4 v2, 0x6

    aput v2, v0, v1
    :try_end_53
    .catch Ljava/lang/NoSuchFieldError; {:try_start_48 .. :try_end_53} :catch_54

    .line 165
    goto :goto_55

    .line 164
    :catch_54
    move-exception v0

    .line 166
    :goto_55
    return-void
.end method

.method constructor <init>()V
    .registers 1

    .line 136
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method
