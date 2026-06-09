.class public Lcom/genymobile/scrcpy/DeviceMessageWriter;
.super Ljava/lang/Object;
.source "DeviceMessageWriter.java"


# instance fields
.field private final rawBuffer:[B


# direct methods
.method public constructor <init>()V
    .registers 2

    .line 6
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const/16 v0, 0x1000

    new-array v0, v0, [B

    .line 8
    iput-object v0, p0, Lcom/genymobile/scrcpy/DeviceMessageWriter;->rawBuffer:[B

    return-void
.end method


# virtual methods
.method public writeTo(Lcom/genymobile/scrcpy/DeviceMessage;Ljava/io/OutputStream;)V
    .registers 5
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 11
    iget-object v0, p0, Lcom/genymobile/scrcpy/DeviceMessageWriter;->rawBuffer:[B

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/DeviceMessage;->writeToByteArray([B)V

    .line 12
    iget-object v0, p0, Lcom/genymobile/scrcpy/DeviceMessageWriter;->rawBuffer:[B

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/DeviceMessage;->getLen()I

    move-result p1

    const/4 v1, 0x0

    invoke-virtual {p2, v0, v1, p1}, Ljava/io/OutputStream;->write([BII)V

    return-void
.end method
