.class public Lcom/genymobile/scrcpy/InvalidEncoderException;
.super Ljava/lang/RuntimeException;
.source "InvalidEncoderException.java"


# instance fields
.field private final availableEncoders:[Landroid/media/MediaCodecInfo;

.field private final name:Ljava/lang/String;


# direct methods
.method public constructor <init>(Ljava/lang/String;[Landroid/media/MediaCodecInfo;)V
    .registers 5

    .line 11
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "There is no encoder having name \'"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    const/16 v1, 0x22

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-direct {p0, v0}, Ljava/lang/RuntimeException;-><init>(Ljava/lang/String;)V

    .line 12
    iput-object p1, p0, Lcom/genymobile/scrcpy/InvalidEncoderException;->name:Ljava/lang/String;

    .line 13
    iput-object p2, p0, Lcom/genymobile/scrcpy/InvalidEncoderException;->availableEncoders:[Landroid/media/MediaCodecInfo;

    .line 14
    return-void
.end method


# virtual methods
.method public getAvailableEncoders()[Landroid/media/MediaCodecInfo;
    .registers 2

    .line 21
    iget-object v0, p0, Lcom/genymobile/scrcpy/InvalidEncoderException;->availableEncoders:[Landroid/media/MediaCodecInfo;

    return-object v0
.end method

.method public getName()Ljava/lang/String;
    .registers 2

    .line 17
    iget-object v0, p0, Lcom/genymobile/scrcpy/InvalidEncoderException;->name:Ljava/lang/String;

    return-object v0
.end method
