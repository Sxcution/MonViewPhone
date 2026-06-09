.class public abstract Lcom/genymobile/scrcpy/DeviceMessage;
.super Ljava/lang/Object;
.source "DeviceMessage.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/genymobile/scrcpy/DeviceMessage$FilePushResponseMessage;,
        Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;
    }
.end annotation


# static fields
.field public static final MAX_EVENT_SIZE:I = 0x1000

.field private static final MESSAGE_MAX_SIZE:I = 0x40000

.field public static final TYPE_CLIPBOARD:I = 0x0

.field public static final TYPE_PUSH_RESPONSE:I = 0x65


# instance fields
.field private type:I


# direct methods
.method private constructor <init>(I)V
    .registers 2

    .line 14
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 15
    iput p1, p0, Lcom/genymobile/scrcpy/DeviceMessage;->type:I

    return-void
.end method

.method synthetic constructor <init>(ILcom/genymobile/scrcpy/DeviceMessage$1;)V
    .registers 3

    .line 6
    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/DeviceMessage;-><init>(I)V

    return-void
.end method

.method public static createClipboard(Ljava/lang/String;)Lcom/genymobile/scrcpy/DeviceMessage;
    .registers 3

    .line 63
    new-instance v0, Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;

    const/4 v1, 0x0

    invoke-direct {v0, p0, v1}, Lcom/genymobile/scrcpy/DeviceMessage$ClipboardMessage;-><init>(Ljava/lang/String;Lcom/genymobile/scrcpy/DeviceMessage$1;)V

    return-object v0
.end method

.method public static createPushResponse(SI)Lcom/genymobile/scrcpy/DeviceMessage;
    .registers 4

    .line 67
    new-instance v0, Lcom/genymobile/scrcpy/DeviceMessage$FilePushResponseMessage;

    const/4 v1, 0x0

    invoke-direct {v0, p0, p1, v1}, Lcom/genymobile/scrcpy/DeviceMessage$FilePushResponseMessage;-><init>(SILcom/genymobile/scrcpy/DeviceMessage$1;)V

    return-object v0
.end method


# virtual methods
.method public abstract getLen()I
.end method

.method public getType()I
    .registers 2

    .line 71
    iget v0, p0, Lcom/genymobile/scrcpy/DeviceMessage;->type:I

    return v0
.end method

.method public writeToByteArray([B)V
    .registers 3

    const/4 v0, 0x0

    .line 74
    invoke-virtual {p0, p1, v0}, Lcom/genymobile/scrcpy/DeviceMessage;->writeToByteArray([BI)V

    return-void
.end method

.method public abstract writeToByteArray([BI)V
.end method

.method public writeToByteArray(I)[B
    .registers 3

    .line 77
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/DeviceMessage;->getLen()I

    move-result v0

    add-int/2addr v0, p1

    new-array v0, v0, [B

    .line 78
    invoke-virtual {p0, v0, p1}, Lcom/genymobile/scrcpy/DeviceMessage;->writeToByteArray([BI)V

    return-object v0
.end method
