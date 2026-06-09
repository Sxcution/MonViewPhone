.class final Lcom/genymobile/scrcpy/DeviceMessage$FilePushResponseMessage;
.super Lcom/genymobile/scrcpy/DeviceMessage;
.source "DeviceMessage.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/genymobile/scrcpy/DeviceMessage;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x1a
    name = "FilePushResponseMessage"
.end annotation


# instance fields
.field private id:S

.field private result:I


# direct methods
.method private constructor <init>(SI)V
    .registers 5

    .line 58
    const/16 v0, 0x65

    const/4 v1, 0x0

    invoke-direct {p0, v0, v1}, Lcom/genymobile/scrcpy/DeviceMessage;-><init>(ILcom/genymobile/scrcpy/DeviceMessage$1;)V

    .line 59
    iput-short p1, p0, Lcom/genymobile/scrcpy/DeviceMessage$FilePushResponseMessage;->id:S

    .line 60
    iput p2, p0, Lcom/genymobile/scrcpy/DeviceMessage$FilePushResponseMessage;->result:I

    .line 61
    return-void
.end method

.method synthetic constructor <init>(SILcom/genymobile/scrcpy/DeviceMessage$1;)V
    .registers 4

    .line 48
    invoke-direct {p0, p1, p2}, Lcom/genymobile/scrcpy/DeviceMessage$FilePushResponseMessage;-><init>(SI)V

    return-void
.end method


# virtual methods
.method public getLen()I
    .registers 2

    .line 54
    const/4 v0, 0x4

    return v0
.end method

.method public writeToByteArray([BI)V
    .registers 4

    .line 65
    array-length v0, p1

    sub-int/2addr v0, p2

    invoke-static {p1, p2, v0}, Ljava/nio/ByteBuffer;->wrap([BII)Ljava/nio/ByteBuffer;

    move-result-object p1

    .line 66
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/DeviceMessage$FilePushResponseMessage;->getType()I

    move-result p2

    int-to-byte p2, p2

    invoke-virtual {p1, p2}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 67
    iget-short p2, p0, Lcom/genymobile/scrcpy/DeviceMessage$FilePushResponseMessage;->id:S

    invoke-virtual {p1, p2}, Ljava/nio/ByteBuffer;->putShort(S)Ljava/nio/ByteBuffer;

    .line 68
    iget p2, p0, Lcom/genymobile/scrcpy/DeviceMessage$FilePushResponseMessage;->result:I

    int-to-byte p2, p2

    invoke-virtual {p1, p2}, Ljava/nio/ByteBuffer;->put(B)Ljava/nio/ByteBuffer;

    .line 69
    return-void
.end method
