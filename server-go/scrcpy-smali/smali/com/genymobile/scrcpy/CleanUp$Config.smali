.class public Lcom/genymobile/scrcpy/CleanUp$Config;
.super Ljava/lang/Object;
.source "CleanUp.java"

# interfaces
.implements Landroid/os/Parcelable;


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/genymobile/scrcpy/CleanUp;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x9
    name = "Config"
.end annotation


# static fields
.field public static final CREATOR:Landroid/os/Parcelable$Creator;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Landroid/os/Parcelable$Creator<",
            "Lcom/genymobile/scrcpy/CleanUp$Config;",
            ">;"
        }
    .end annotation
.end field

.field private static final FLAG_DISABLE_SHOW_TOUCHES:I = 0x1

.field private static final FLAG_POWER_OFF_SCREEN:I = 0x4

.field private static final FLAG_RESTORE_NORMAL_POWER_MODE:I = 0x2


# instance fields
.field private disableShowTouches:Z

.field private displayId:I

.field private powerOffScreen:Z

.field private restoreNormalPowerMode:Z

.field private restoreStayOn:I


# direct methods
.method static constructor <clinit>()V
    .locals 1

    .line 25
    new-instance v0, Lcom/genymobile/scrcpy/CleanUp$Config$1;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/CleanUp$Config$1;-><init>()V

    sput-object v0, Lcom/genymobile/scrcpy/CleanUp$Config;->CREATOR:Landroid/os/Parcelable$Creator;

    return-void
.end method

.method public constructor <init>()V
    .locals 1

    .line 51
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const/4 v0, -0x1

    .line 45
    iput v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I

    return-void
.end method

.method protected constructor <init>(Landroid/os/Parcel;)V
    .locals 3

    .line 55
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const/4 v0, -0x1

    .line 45
    iput v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I

    .line 56
    invoke-virtual {p1}, Landroid/os/Parcel;->readInt()I

    move-result v0

    iput v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->displayId:I

    .line 57
    invoke-virtual {p1}, Landroid/os/Parcel;->readInt()I

    move-result v0

    iput v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I

    .line 58
    invoke-virtual {p1}, Landroid/os/Parcel;->readByte()B

    move-result p1

    and-int/lit8 v0, p1, 0x1

    const/4 v1, 0x0

    const/4 v2, 0x1

    if-eqz v0, :cond_0

    const/4 v0, 0x1

    goto :goto_0

    :cond_0
    const/4 v0, 0x0

    .line 59
    :goto_0
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->disableShowTouches:Z

    and-int/lit8 v0, p1, 0x2

    if-eqz v0, :cond_1

    const/4 v0, 0x1

    goto :goto_1

    :cond_1
    const/4 v0, 0x0

    .line 60
    :goto_1
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreNormalPowerMode:Z

    and-int/lit8 p1, p1, 0x4

    if-eqz p1, :cond_2

    const/4 v1, 0x1

    .line 61
    :cond_2
    iput-boolean v1, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->powerOffScreen:Z

    return-void
.end method

.method static synthetic access$000(Lcom/genymobile/scrcpy/CleanUp$Config;)I
    .locals 0

    .line 23
    iget p0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->displayId:I

    return p0
.end method

.method static synthetic access$002(Lcom/genymobile/scrcpy/CleanUp$Config;I)I
    .locals 0

    .line 23
    iput p1, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->displayId:I

    return p1
.end method

.method static synthetic access$100(Lcom/genymobile/scrcpy/CleanUp$Config;)Z
    .locals 0

    .line 23
    iget-boolean p0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->disableShowTouches:Z

    return p0
.end method

.method static synthetic access$102(Lcom/genymobile/scrcpy/CleanUp$Config;Z)Z
    .locals 0

    .line 23
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->disableShowTouches:Z

    return p1
.end method

.method static synthetic access$200(Lcom/genymobile/scrcpy/CleanUp$Config;)I
    .locals 0

    .line 23
    iget p0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I

    return p0
.end method

.method static synthetic access$202(Lcom/genymobile/scrcpy/CleanUp$Config;I)I
    .locals 0

    .line 23
    iput p1, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I

    return p1
.end method

.method static synthetic access$300(Lcom/genymobile/scrcpy/CleanUp$Config;)Z
    .locals 0

    .line 23
    iget-boolean p0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreNormalPowerMode:Z

    return p0
.end method

.method static synthetic access$302(Lcom/genymobile/scrcpy/CleanUp$Config;Z)Z
    .locals 0

    .line 23
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreNormalPowerMode:Z

    return p1
.end method

.method static synthetic access$400(Lcom/genymobile/scrcpy/CleanUp$Config;)Z
    .locals 0

    .line 23
    iget-boolean p0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->powerOffScreen:Z

    return p0
.end method

.method static synthetic access$402(Lcom/genymobile/scrcpy/CleanUp$Config;Z)Z
    .locals 0

    .line 23
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->powerOffScreen:Z

    return p1
.end method

.method static synthetic access$500(Lcom/genymobile/scrcpy/CleanUp$Config;)Z
    .locals 0

    .line 23
    invoke-direct {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->hasWork()Z

    move-result p0

    return p0
.end method

.method static deserialize([B)Lcom/genymobile/scrcpy/CleanUp$Config;
    .locals 3

    .line 99
    invoke-static {}, Landroid/os/Parcel;->obtain()Landroid/os/Parcel;

    move-result-object v0

    .line 100
    array-length v1, p0

    const/4 v2, 0x0

    invoke-virtual {v0, p0, v2, v1}, Landroid/os/Parcel;->unmarshall([BII)V

    .line 101
    invoke-virtual {v0, v2}, Landroid/os/Parcel;->setDataPosition(I)V

    .line 102
    sget-object p0, Lcom/genymobile/scrcpy/CleanUp$Config;->CREATOR:Landroid/os/Parcelable$Creator;

    invoke-interface {p0, v0}, Landroid/os/Parcelable$Creator;->createFromParcel(Landroid/os/Parcel;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Lcom/genymobile/scrcpy/CleanUp$Config;

    return-object p0
.end method

.method static fromBase64(Ljava/lang/String;)Lcom/genymobile/scrcpy/CleanUp$Config;
    .locals 1

    const/4 v0, 0x2

    .line 106
    invoke-static {p0, v0}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B

    move-result-object p0

    .line 107
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->deserialize([B)Lcom/genymobile/scrcpy/CleanUp$Config;

    move-result-object p0

    return-object p0
.end method

.method private hasWork()Z
    .locals 2

    .line 82
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->disableShowTouches:Z

    if-nez v0, :cond_1

    iget v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I

    const/4 v1, -0x1

    if-ne v0, v1, :cond_1

    iget-boolean v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreNormalPowerMode:Z

    if-nez v0, :cond_1

    iget-boolean v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->powerOffScreen:Z

    if-eqz v0, :cond_0

    goto :goto_0

    :cond_0
    const/4 v0, 0x0

    goto :goto_1

    :cond_1
    :goto_0
    const/4 v0, 0x1

    :goto_1
    return v0
.end method


# virtual methods
.method public describeContents()I
    .locals 1

    const/4 v0, 0x0

    return v0
.end method

.method serialize()[B
    .locals 2

    .line 91
    invoke-static {}, Landroid/os/Parcel;->obtain()Landroid/os/Parcel;

    move-result-object v0

    const/4 v1, 0x0

    .line 92
    invoke-virtual {p0, v0, v1}, Lcom/genymobile/scrcpy/CleanUp$Config;->writeToParcel(Landroid/os/Parcel;I)V

    .line 93
    invoke-virtual {v0}, Landroid/os/Parcel;->marshall()[B

    move-result-object v1

    .line 94
    invoke-virtual {v0}, Landroid/os/Parcel;->recycle()V

    return-object v1
.end method

.method toBase64()Ljava/lang/String;
    .locals 2

    .line 111
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->serialize()[B

    move-result-object v0

    const/4 v1, 0x2

    .line 112
    invoke-static {v0, v1}, Landroid/util/Base64;->encodeToString([BI)Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method

.method public writeToParcel(Landroid/os/Parcel;I)V
    .locals 1

    .line 66
    iget p2, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->displayId:I

    invoke-virtual {p1, p2}, Landroid/os/Parcel;->writeInt(I)V

    .line 67
    iget p2, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I

    invoke-virtual {p1, p2}, Landroid/os/Parcel;->writeInt(I)V

    .line 69
    iget-boolean p2, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->disableShowTouches:Z

    if-eqz p2, :cond_0

    const/4 p2, 0x1

    int-to-byte p2, p2

    goto :goto_0

    :cond_0
    const/4 p2, 0x0

    .line 72
    :goto_0
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->restoreNormalPowerMode:Z

    if-eqz v0, :cond_1

    or-int/lit8 p2, p2, 0x2

    int-to-byte p2, p2

    .line 75
    :cond_1
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/CleanUp$Config;->powerOffScreen:Z

    if-eqz v0, :cond_2

    or-int/lit8 p2, p2, 0x4

    int-to-byte p2, p2

    .line 78
    :cond_2
    invoke-virtual {p1, p2}, Landroid/os/Parcel;->writeByte(B)V

    return-void
.end method
