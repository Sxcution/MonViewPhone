.class final Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;
.super Lcom/genymobile/scrcpy/DeviceMessage;
.source "DeviceMessage.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/genymobile/scrcpy/DeviceMessage;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x1a
    name = "ClipboardMessage"
.end annotation


# static fields
.field public static final CLIPBOARD_TEXT_MAX_LENGTH:I = 0x3fffb


# instance fields
.field private len:I

.field private raw:[B


# direct methods
.method private constructor <init>(Ljava/lang/String;)V
    .locals 2

    const/4 v0, 0x0

    const/4 v1, 0x0

    .line 23
    invoke-direct {p0, v0, v1}, Lcom/genymobile/scrcpy/DeviceMessage;-><init>(ILcom/genymobile/scrcpy/DeviceMessage$1;)V

    .line 24
    sget-object v0, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {p1, v0}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object p1

    iput-object p1, p0, Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;->raw:[B

    const v0, 0x3fffb

    .line 25
    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/StringUtils;->getUtf8TruncationIndex([BI)I

    move-result p1

    iput p1, p0, Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;->len:I

    return-void
.end method

.method synthetic constructor <init>(Ljava/lang/String;Lcom/genymobile/scrcpy/DeviceMessage$1;)V
    .locals 0

    .line 18
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;-><init>(Ljava/lang/String;)V

    return-void
.end method


# virtual methods
.method public getLen()I
    .locals 1

    .line 34
    iget v0, p0, Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;->len:I

    add-int/lit8 v0, v0, 0x5

    return v0
.end method

.method public writeToByteArray([BI)V
    .locals 2

    .line 28
    array-length v0, p1

    sub-int/2addr v0, p2

    invoke-static {p1, p2, v0}, Ljava/nio/ByteBuffer;->wrap([BII)Ljava/nio/ByteBuffer;

    move-result-object p1

    .line 29
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;->getType()I

    move-result p2

    int-to-byte p2, p2

    invoke-virtual {p1, p2}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 30
    iget p2, p0, Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;->len:I

    invoke-virtual {p1, p2}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 31
    iget-object p2, p0, Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;->raw:[B

    iget v0, p0, Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;->len:I

    const/4 v1, 0x0

    invoke-virtual {p1, p2, v1, v0}, Ljava/nio/ByteBuffer;->put([BII)Ljava/nio/ByteBuffer;

    return-void
.end method
