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
    .locals 2

    .line 26
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const/high16 v0, 0x40000

    new-array v0, v0, [B

    .line 23
    iput-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->rawBuffer:[B

    .line 24
    invoke-static {v0}, Ljava/nio/ByteBuffer;->wrap([B)Ljava/nio/ByteBuffer;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    const/4 v1, 0x0

    .line 28
    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->limit(I)Ljava/nio/Buffer;

    return-void
.end method

.method private parseBackOrScreenOnEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .locals 2

    .line 184
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/4 v1, 0x1

    if-ge v0, v1, :cond_0

    const/4 p1, 0x0

    return-object p1

    .line 187
    :cond_0
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(B)I

    move-result p1

    .line 188
    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessage;->createBackOrScreenOn(I)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseChangeStreamParameters(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .locals 3

    .line 110
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    .line 111
    new-array v1, v0, [B

    if-lez v0, :cond_0

    const/4 v2, 0x0

    .line 113
    invoke-virtual {p1, v1, v2, v0}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 115
    :cond_0
    invoke-static {v1}, Lcom/genymobile/scrcpy/ControlMessage;->createChangeSteamParameters([B)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseInjectKeycode(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .locals 3

    .line 128
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/16 v1, 0xd

    if-ge v0, v1, :cond_0

    const/4 p1, 0x0

    return-object p1

    .line 131
    :cond_0
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(B)I

    move-result v0

    .line 132
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    .line 133
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v2

    .line 134
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result p1

    .line 135
    invoke-static {v0, v1, v2, p1}, Lcom/genymobile/scrcpy/ControlMessage;->createInjectKeycode(IIII)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseInjectScrollEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .locals 2

    .line 174
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/16 v1, 0x14

    if-ge v0, v1, :cond_0

    const/4 p1, 0x0

    return-object p1

    .line 177
    :cond_0
    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->readPosition(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/Position;

    move-result-object v0

    .line 178
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    .line 179
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result p1

    .line 180
    invoke-static {v0, v1, p1}, Lcom/genymobile/scrcpy/ControlMessage;->createInjectScrollEvent(Lcom/genymobile/scrcpy/Position;II)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseInjectText(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .locals 0

    .line 151
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseString(Ljava/nio/ByteBuffer;)Ljava/lang/String;

    move-result-object p1

    if-nez p1, :cond_0

    const/4 p1, 0x0

    return-object p1

    .line 155
    :cond_0
    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessage;->createInjectText(Ljava/lang/String;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseInjectTouchEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .locals 7

    .line 159
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/16 v1, 0x1b

    if-ge v0, v1, :cond_0

    const/4 p1, 0x0

    return-object p1

    .line 162
    :cond_0
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(B)I

    move-result v1

    .line 163
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getLong()J

    move-result-wide v2

    .line 164
    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->readPosition(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/Position;

    move-result-object v4

    .line 166
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(S)I

    move-result v0

    const v5, 0xffff

    if-ne v0, v5, :cond_1

    const/high16 v0, 0x3f800000    # 1.0f

    const/high16 v5, 0x3f800000    # 1.0f

    goto :goto_0

    :cond_1
    int-to-float v0, v0

    const/high16 v5, 0x47800000    # 65536.0f

    div-float/2addr v0, v5

    move v5, v0

    .line 169
    :goto_0
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v6

    .line 170
    invoke-static/range {v1 .. v6}, Lcom/genymobile/scrcpy/ControlMessage;->createInjectTouchEvent(IJLcom/genymobile/scrcpy/Position;FI)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parsePushFile(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .locals 3

    .line 119
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    .line 120
    new-array v1, v0, [B

    if-lez v0, :cond_0

    const/4 v2, 0x0

    .line 122
    invoke-virtual {p1, v1, v2, v0}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 124
    :cond_0
    invoke-static {v1}, Lcom/genymobile/scrcpy/ControlMessage;->createFilePush([B)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseSetClipboard(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .locals 3

    .line 192
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/4 v1, 0x0

    const/4 v2, 0x1

    if-ge v0, v2, :cond_0

    return-object v1

    .line 195
    :cond_0
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result v0

    if-eqz v0, :cond_1

    goto :goto_0

    :cond_1
    const/4 v2, 0x0

    .line 196
    :goto_0
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseString(Ljava/nio/ByteBuffer;)Ljava/lang/String;

    move-result-object p1

    if-nez p1, :cond_2

    return-object v1

    .line 200
    :cond_2
    invoke-static {p1, v2}, Lcom/genymobile/scrcpy/ControlMessage;->createSetClipboard(Ljava/lang/String;Z)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseSetScreenPowerMode(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .locals 2

    .line 204
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/4 v1, 0x1

    if-ge v0, v1, :cond_0

    const/4 p1, 0x0

    return-object p1

    .line 207
    :cond_0
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result p1

    .line 208
    invoke-static {p1}, Lcom/genymobile/scrcpy/ControlMessage;->createSetScreenPowerMode(I)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object p1

    return-object p1
.end method

.method private parseString(Ljava/nio/ByteBuffer;)Ljava/lang/String;
    .locals 4

    .line 139
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    const/4 v1, 0x0

    const/4 v2, 0x4

    if-ge v0, v2, :cond_0

    return-object v1

    .line 142
    :cond_0
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v0

    .line 143
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v2

    if-ge v2, v0, :cond_1

    return-object v1

    .line 146
    :cond_1
    iget-object v1, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->rawBuffer:[B

    const/4 v2, 0x0

    invoke-virtual {p1, v1, v2, v0}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 147
    new-instance p1, Ljava/lang/String;

    iget-object v1, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->rawBuffer:[B

    sget-object v3, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-direct {p1, v1, v2, v0, v3}, Ljava/lang/String;-><init>([BIILjava/nio/charset/Charset;)V

    return-object p1
.end method

.method private static readPosition(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/Position;
    .locals 4

    .line 212
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v0

    .line 213
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    .line 214
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v2

    invoke-static {v2}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(S)I

    move-result v2

    .line 215
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getShort()S

    move-result p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/ControlMessageReader;->toUnsigned(S)I

    move-result p0

    .line 216
    new-instance v3, Lcom/genymobile/scrcpy/Position;

    invoke-direct {v3, v0, v1, v2, p0}, Lcom/genymobile/scrcpy/Position;-><init>(IIII)V

    return-object v3
.end method

.method private static toUnsigned(B)I
    .locals 0

    and-int/lit16 p0, p0, 0xff

    return p0
.end method

.method private static toUnsigned(S)I
    .locals 1

    const v0, 0xffff

    and-int/2addr p0, v0

    return p0
.end method


# virtual methods
.method public isFull()Z
    .locals 2

    .line 32
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->rawBuffer:[B

    array-length v1, v1

    if-ne v0, v1, :cond_0

    const/4 v0, 0x1

    goto :goto_0

    :cond_0
    const/4 v0, 0x0

    :goto_0
    return v0
.end method

.method public next()Lcom/genymobile/scrcpy/ControlMessage;
    .locals 1

    .line 50
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    invoke-virtual {p0, v0}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v0

    return-object v0
.end method

.method public parseEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;
    .locals 5

    .line 54
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->hasRemaining()Z

    move-result v0

    const/4 v1, 0x0

    if-nez v0, :cond_0

    return-object v1

    .line 57
    :cond_0
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->position()I

    move-result v0

    .line 59
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->get()B

    move-result v2

    const/16 v3, 0x65

    if-eq v2, v3, :cond_2

    const/16 v3, 0x66

    if-eq v2, v3, :cond_1

    packed-switch v2, :pswitch_data_0

    .line 97
    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "Unknown event type: "

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v3, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    goto :goto_0

    .line 81
    :pswitch_0
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseSetScreenPowerMode(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    goto :goto_0

    .line 78
    :pswitch_1
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseSetClipboard(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    goto :goto_0

    .line 94
    :pswitch_2
    invoke-static {v2}, Lcom/genymobile/scrcpy/ControlMessage;->createEmpty(I)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    goto :goto_0

    .line 75
    :pswitch_3
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseBackOrScreenOnEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    goto :goto_0

    .line 72
    :pswitch_4
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseInjectScrollEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    goto :goto_0

    .line 69
    :pswitch_5
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseInjectTouchEvent(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    goto :goto_0

    .line 66
    :pswitch_6
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseInjectText(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    goto :goto_0

    .line 63
    :pswitch_7
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseInjectKeycode(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    goto :goto_0

    .line 87
    :cond_1
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parsePushFile(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    goto :goto_0

    .line 84
    :cond_2
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/ControlMessageReader;->parseChangeStreamParameters(Ljava/nio/ByteBuffer;)Lcom/genymobile/scrcpy/ControlMessage;

    move-result-object v1

    :goto_0
    if-nez v1, :cond_3

    .line 104
    invoke-virtual {p1, v0}, Ljava/nio/ByteBuffer;->position(I)Ljava/nio/Buffer;

    :cond_3
    return-object v1

    nop

    :pswitch_data_0
    .packed-switch 0x0
        :pswitch_7
        :pswitch_6
        :pswitch_5
        :pswitch_4
        :pswitch_3
        :pswitch_2
        :pswitch_2
        :pswitch_2
        :pswitch_2
        :pswitch_1
        :pswitch_0
        :pswitch_2
    .end packed-switch
.end method

.method public readFrom(Ljava/io/InputStream;)V
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 36
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/ControlMessageReader;->isFull()Z

    move-result v0

    if-nez v0, :cond_1

    .line 39
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->compact()Ljava/nio/ByteBuffer;

    .line 40
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->position()I

    move-result v0

    .line 41
    iget-object v1, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->rawBuffer:[B

    array-length v2, v1

    sub-int/2addr v2, v0

    invoke-virtual {p1, v1, v0, v2}, Ljava/io/InputStream;->read([BII)I

    move-result p1

    const/4 v1, -0x1

    if-eq p1, v1, :cond_0

    .line 45
    iget-object v1, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    add-int/2addr v0, p1

    invoke-virtual {v1, v0}, Ljava/nio/ByteBuffer;->position(I)Ljava/nio/Buffer;

    .line 46
    iget-object p1, p0, Lcom/genymobile/scrcpy/ControlMessageReader;->buffer:Ljava/nio/ByteBuffer;

    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->flip()Ljava/nio/Buffer;

    return-void

    .line 43
    :cond_0
    new-instance p1, Ljava/io/EOFException;

    const-string v0, "Controller socket closed"

    invoke-direct {p1, v0}, Ljava/io/EOFException;-><init>(Ljava/lang/String;)V

    throw p1

    .line 37
    :cond_1
    new-instance p1, Ljava/lang/IllegalStateException;

    const-string v0, "Buffer full, call next() to consume"

    invoke-direct {p1, v0}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/String;)V

    throw p1
.end method
