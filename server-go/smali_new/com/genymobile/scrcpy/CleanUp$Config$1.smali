.class Lcom/genymobile/scrcpy/CleanUp$Config$1;
.super Ljava/lang/Object;
.source "CleanUp.java"

# interfaces
.implements Landroid/os/Parcelable$Creator;


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/genymobile/scrcpy/CleanUp$Config;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation

.annotation system Ldalvik/annotation/Signature;
    value = {
        "Ljava/lang/Object;",
        "Landroid/os/Parcelable$Creator<",
        "Lcom/genymobile/scrcpy/CleanUp$Config;",
        ">;"
    }
.end annotation


# direct methods
.method constructor <init>()V
    .registers 1

    .line 16
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public createFromParcel(Landroid/os/Parcel;)Lcom/genymobile/scrcpy/CleanUp$Config;
    .registers 3

    .line 20
    new-instance v0, Lcom/genymobile/scrcpy/CleanUp$Config;

    invoke-direct {v0, p1}, Lcom/genymobile/scrcpy/CleanUp$Config;-><init>(Landroid/os/Parcel;)V

    return-object v0
.end method

.method public bridge synthetic createFromParcel(Landroid/os/Parcel;)Ljava/lang/Object;
    .registers 2

    .line 16
    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/CleanUp$Config$1;->createFromParcel(Landroid/os/Parcel;)Lcom/genymobile/scrcpy/CleanUp$Config;

    move-result-object p1

    return-object p1
.end method

.method public newArray(I)[Lcom/genymobile/scrcpy/CleanUp$Config;
    .registers 2

    .line 26
    new-array p1, p1, [Lcom/genymobile/scrcpy/CleanUp$Config;

    return-object p1
.end method

.method public bridge synthetic newArray(I)[Ljava/lang/Object;
    .registers 2

    .line 16
    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/CleanUp$Config$1;->newArray(I)[Lcom/genymobile/scrcpy/CleanUp$Config;

    move-result-object p1

    return-object p1
.end method
