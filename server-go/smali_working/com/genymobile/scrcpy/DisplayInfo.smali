.class public final Lcom/genymobile/scrcpy/DisplayInfo;
.super Ljava/lang/Object;
.source "DisplayInfo.java"


# static fields
.field public static final FLAG_SUPPORTS_PROTECTED_BUFFERS:I = 0x1


# instance fields
.field private final displayId:I

.field private final flags:I

.field private final layerStack:I

.field private final rotation:I

.field private final size:Lcom/genymobile/scrcpy/Size;


# direct methods
.method public constructor <init>(ILcom/genymobile/scrcpy/Size;III)V
    .registers 6

    .line 14
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 15
    iput p1, p0, Lcom/genymobile/scrcpy/DisplayInfo;->displayId:I

    .line 16
    iput-object p2, p0, Lcom/genymobile/scrcpy/DisplayInfo;->size:Lcom/genymobile/scrcpy/Size;

    .line 17
    iput p3, p0, Lcom/genymobile/scrcpy/DisplayInfo;->rotation:I

    .line 18
    iput p4, p0, Lcom/genymobile/scrcpy/DisplayInfo;->layerStack:I

    .line 19
    iput p5, p0, Lcom/genymobile/scrcpy/DisplayInfo;->flags:I

    return-void
.end method


# virtual methods
.method public getDisplayId()I
    .registers 2

    .line 23
    iget v0, p0, Lcom/genymobile/scrcpy/DisplayInfo;->displayId:I

    return v0
.end method

.method public getFlags()I
    .registers 2

    .line 39
    iget v0, p0, Lcom/genymobile/scrcpy/DisplayInfo;->flags:I

    return v0
.end method

.method public getLayerStack()I
    .registers 2

    .line 35
    iget v0, p0, Lcom/genymobile/scrcpy/DisplayInfo;->layerStack:I

    return v0
.end method

.method public getRotation()I
    .registers 2

    .line 31
    iget v0, p0, Lcom/genymobile/scrcpy/DisplayInfo;->rotation:I

    return v0
.end method

.method public getSize()Lcom/genymobile/scrcpy/Size;
    .registers 2

    .line 27
    iget-object v0, p0, Lcom/genymobile/scrcpy/DisplayInfo;->size:Lcom/genymobile/scrcpy/Size;

    return-object v0
.end method

.method public toByteArray()[B
    .registers 3

    const/16 v0, 0x18

    .line 43
    invoke-static {v0}, Ljava/nio/ByteBuffer;->allocate(I)Ljava/nio/ByteBuffer;

    move-result-object v0

    .line 44
    iget v1, p0, Lcom/genymobile/scrcpy/DisplayInfo;->displayId:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 45
    iget-object v1, p0, Lcom/genymobile/scrcpy/DisplayInfo;->size:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 46
    iget-object v1, p0, Lcom/genymobile/scrcpy/DisplayInfo;->size:Lcom/genymobile/scrcpy/Size;

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v1

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 47
    iget v1, p0, Lcom/genymobile/scrcpy/DisplayInfo;->rotation:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 48
    iget v1, p0, Lcom/genymobile/scrcpy/DisplayInfo;->layerStack:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 49
    iget v1, p0, Lcom/genymobile/scrcpy/DisplayInfo;->flags:I

    invoke-virtual {v0, v1}, Ljava/nio/ByteBuffer;->putInt(I)Ljava/nio/ByteBuffer;

    .line 50
    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->rewind()Ljava/nio/Buffer;

    .line 51
    invoke-virtual {v0}, Ljava/nio/ByteBuffer;->array()[B

    move-result-object v0

    return-object v0
.end method
