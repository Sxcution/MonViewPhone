.class public Lcom/genymobile/scrcpy/ControlMessageReader;
.super Ljava/lang/Object;
.source "ControlMessageReader.java"


# static fields
.field static final BACK_OR_SCREEN_ON_LENGTH:I = 0x1

.field public static final CLIPBOARD_TEXT_MAX_LENGTH:I = 0x3fffa

.field static final INJECT_KEYCODE_PAYLOAD_LENGTH:I = 0xd

.field static final INJECT_SCROLL_EVENT_PAYLOAD_LENGTH:I = 0x14

.field public static final INJECT_TEXT_MAX_LENGTH:I = 0x12c

.field static final INJECT_TOUCH_EVENT_PAYLOAD_LENGTH:I = 0x1b

.field private static final MESSAGE_MAX_SIZE:I = 0x40000

.field static final SET_CLIPBOARD_FIXED_PAYLOAD_LENGTH:I = 0x1

.field static final SET_SCREEN_POWER_MODE_PAYLOAD_LENGTH:I = 0x1


# instance fields
.field private final buffer:Ljava/nio/ByteBuffer;

.field private final rawBuffer:[B


# direct methods
.method public constructor <init>()V
    .registers 3

    .line 31
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 32
    const/high16 v0, 0x40000

    new-array v0, v0, [B

    .line 33
    iput-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->rawBuffer:[B

    .line 34
    invoke-static {v0}, Ljava/nio/ByteBuffer;->wrap([B)Ljava/nio/ByteBuffer;

    move-result-object v0

    .line 35
    iput-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    .line 36
    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->limit(I)Ljava/nio/Buffer;

    .line 37
    return-void
.end method

.method private parseBackOrScreenOnEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 4

    .line 175
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/4 v1, 0x1

    if-ge v0, v1, :cond_9

    .line 176
    const/4 p1, 0x0

    return-object p1

    .line 178
    :cond_9
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(B)I

    move-result p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessage;->createBackOrScreenOn(I)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseChangeStreamParameters(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 5

    .line 115
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    .line 116
    new-array v1, v0, [B

    .line 117
    if-lez v0, :cond_c

    .line 118
    const/4 v2, 0x0

    invoke-virtual {p1, v1, v2, v0}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 120
    :cond_c
    invoke-static {v1}, Lcom/genymobile/scrcpy/ControlMessage;->createChangeSteamParameters([B)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseInjectKeycode(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 5

    .line 133
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/16 v1, 0xd

    if-ge v0, v1, :cond_a

    .line 134
    const/4 p1, 0x0

    return-object p1

    .line 136
    :cond_a
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(B)I

    move-result v0

    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v2

    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result p1

    invoke-static {v0, v1, v2, p1}, Lcom/genymobile/scrcpy/ControlMessage;->createInjectKeycode(IIII)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseInjectScrollEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 4

    .line 168
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/16 v1, 0x14

    if-ge v0, v1, :cond_a

    .line 169
    const/4 p1, 0x0

    return-object p1

    .line 171
    :cond_a
    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->readPosition(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/Position;

    move-result-object v0

    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result p1

    invoke-static {v0, v1, p1}, Lcom/genymobile/scrcpy/ControlMessage;->createInjectScrollEvent(Lcom/genymobile/scrcpy/Position;II)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseInjectText(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 2

    .line 149
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseString(Ljava/nio/ByteBuffer;)Ljava/lang/String;

    move-result-object p1

    .line 150
    if-nez p1, :cond_8

    .line 151
    const/4 p1, 0x0

    return-object p1

    .line 153
    :cond_8
    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessage;->createInjectText(Ljava/lang/String;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseInjectTouchEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 9

    .line 157
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/16 v1, 0x1b

    if-ge v0, v1, :cond_a

    .line 158
    const/4 p1, 0x0

    return-object p1

    .line 160
    :cond_a
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(B)I

    move-result v1

    .line 161
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getLong()J

    move-result-wide v2

    .line 162
    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->readPosition(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/Position;

    move-result-object v4

    .line 163
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(S)I

    move-result v0

    .line 164
    const v5, 0xffff

    if-ne v0, v5, :cond_2c

    const/high16 v0, 0x3f800000    # 1.0f

    const/high16 v5, 0x3f800000    # 1.0f

    goto :goto_31

    :cond_2c
    int-to-float v0, v0

    const/high16 v5, 0x47800000    # 65536.0f

    div-float/2addr v0, v5

    move v5, v0

    :goto_31
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v6

    invoke-static/range {v1 .. v6}, Lcom/genymobile/scrcpy/ControlMessage;->createInjectTouchEvent(IJLcom/genymobile/scrcpy/Position;FI)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parsePushFile(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 5

    .line 124
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    .line 125
    new-array v1, v0, [B

    .line 126
    if-lez v0, :cond_c

    .line 127
    const/4 v2, 0x0

    invoke-virtual {p1, v1, v2, v0}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 129
    :cond_c
    invoke-static {v1}, Lcom/genymobile/scrcpy/ControlMessage;->createFilePush([B)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseSetClipboard(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 5

    .line 182
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/4 v1, 0x0

    const/4 v2, 0x1

    if-ge v0, v2, :cond_9

    .line 183
    return-object v1

    .line 185
    :cond_9
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result v0

    if-eqz v0, :cond_10

    goto :goto_11

    :cond_10
    const/4 v2, 0x0

    .line 186
    :goto_11
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseString(Ljava/nio/ByteBuffer;)Ljava/lang/String;

    move-result-object p1

    .line 187
    if-nez p1, :cond_18

    .line 188
    return-object v1

    .line 190
    :cond_18
    invoke-static {p1, v2}, Lcom/genymobile/scrcpy/ControlMessage;->createSetClipboard(Ljava/lang/String;Z)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseSetScreenPowerMode(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 4

    .line 194
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/4 v1, 0x1

    if-ge v0, v1, :cond_9

    .line 195
    const/4 p1, 0x0

    return-object p1

    .line 197
    :cond_9
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessage;->createSetScreenPowerMode(I)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseString(Ljava/nio/ByteBuffer;)Ljava/lang/String;
    .registers 6

    .line 141
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/4 v1, 0x4

    if-lt v0, v1, :cond_22

    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    if-ge v0, v1, :cond_12

    goto :goto_22

    .line 144
    :cond_12
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->rawBuffer:[B

    const/4 v2, 0x0

    invoke-virtual {p1, v0, v2, v1}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 145
    new-instance p1, Ljava/lang/String;

    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->rawBuffer:[B

    sget-object v3, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-direct {p1, v0, v2, v1, v3}, Ljava/lang/String;-><init>([BIILjava/nio/charset/Charset;)V

    return-object p1

    .line 142
    :cond_22
    :goto_22
    const/4 p1, 0x0

    return-object p1
.end method

.method private static readPosition(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/Position;
    .registers 5

    .line 201
    new-instance v0, Lcom/genymobile/scrcpy/Position;

    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v2

    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v3

    invoke-static {v3}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(S)I

    move-result v3

    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getShort()S

    move-result p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(S)I

    move-result p0

    invoke-direct {v0, v1, v2, v3, p0}, Lcom/genymobile/scrcpy/Position;-><init>(IIII)V

    return-object v0
.end method

.method private static toUnsigned(B)I
    .registers 1

    .line 24
    and-int/lit16 p0, p0, 0xff

    return p0
.end method

.method private static toUnsigned(S)I
    .registers 2

    .line 28
    const v0, 0xffff

    and-int/2addr p0, v0

    return p0
.end method


# virtual methods
.method public isFull()Z
    .registers 3

    .line 40
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->rawBuffer:[B

    array-length v1, v1

    if-ne v0, v1, :cond_d

    const/4 v0, 0x1

    goto :goto_e

    :cond_d
    const/4 v0, 0x0

    :goto_e
    return v0
.end method

.method public next()Lcom/genymobile/scrcpy/ControlMessage;
    .registers 2

    .line 59
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v0

    return-object v0
.end method

.method public parseEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 7

    .line 63
    nop

    .line 64
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->hasRemaining()Z

    move-result v0

    const/4 v1, 0x0

    if-nez v0, :cond_9

    .line 65
    return-object v1

    .line 67
    :cond_9
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->position()I

    move-result v0

    .line 68
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result v2

    .line 69
    const/16 v3, 0x65

    if-ne v2, v3, :cond_1a

    .line 70
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseChangeStreamParameters(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    goto :goto_64

    .line 71
    :cond_1a
    const/16 v3, 0x66

    if-eq v2, v3, :cond_60

    .line 72
    packed-switch v2, :pswitch_data_6a

    .line 102
    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "Unknown event type: "

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 103
    goto :goto_64

    .line 99
    :pswitch_38
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseSetScreenPowerMode(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    .line 100
    goto :goto_64

    .line 96
    :pswitch_3d
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseSetClipboard(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    .line 97
    goto :goto_64

    .line 93
    :pswitch_42
    invoke-static {v2}, Lcom/genymobile/scrcpy/ControlMessage;->createEmpty(I)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    .line 94
    goto :goto_64

    .line 86
    :pswitch_47
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseBackOrScreenOnEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    .line 87
    goto :goto_64

    .line 83
    :pswitch_4c
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseInjectScrollEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    .line 84
    goto :goto_64

    .line 80
    :pswitch_51
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseInjectTouchEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    .line 81
    goto :goto_64

    .line 77
    :pswitch_56
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseInjectText(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    .line 78
    goto :goto_64

    .line 74
    :pswitch_5b
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseInjectKeycode(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    .line 75
    goto :goto_64

    .line 106
    :cond_60
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parsePushFile(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    .line 108
    :goto_64
    if-nez v1, :cond_69

    .line 109
    invoke-virtual {p1, v0}, Ljava/nio/ByteBuffer;->position(I)Ljava/nio/Buffer;

    .line 111
    :cond_69
    return-object v1

    :pswitch_data_6a
    .packed-switch 0x0
        :pswitch_5b
        :pswitch_56
        :pswitch_51
        :pswitch_4c
        :pswitch_47
        :pswitch_42
        :pswitch_42
        :pswitch_42
        :pswitch_42
        :pswitch_3d
        :pswitch_38
        :pswitch_42
    .end packed-switch
.end method

.method public readFrom(Ljava/io/InputStream;)V
    .registers 5
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 44
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ControlMessageReader;->isFull()Z

    move-result v0

    if-nez v0, :cond_30

    .line 47
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->compact()Ljava/nio/ByteBuffer;

    .line 48
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->position()I

    move-result v0

    .line 49
    iget-object v1, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->rawBuffer:[B

    .line 50
    array-length v2, v1

    sub-int/2addr v2, v0

    invoke-virtual {p1, v1, v0, v2}, Ljava/io/InputStream;->read([BII)I

    move-result p1

    .line 51
    const/4 v1, -0x1

    if-eq p1, v1, :cond_28

    .line 54
    iget-object v1, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    add-int/2addr v0, p1

    invoke-virtual {v1, v0}, Ljava/nio/ByteBuffer;->position(I)Ljava/nio/Buffer;

    .line 55
    iget-object p1, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->flip()Ljava/nio/Buffer;

    .line 56
    return-void

    .line 52
    :cond_28
    new-instance p1, Ljava/io/EOFException;

    const-string v0, "Controller socket closed"

    invoke-direct {p1, v0}, Ljava/io/EOFException;-><init>(Ljava/lang/String;)V

    throw p1

    .line 45
    :cond_30
    new-instance p1, Ljava/lang/IllegalStateException;

    const-string v0, "Buffer full, call next() to consume"

    invoke-direct {p1, v0}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/String;)V

    throw p1
.end method
