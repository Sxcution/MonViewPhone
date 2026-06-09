.class public abstract Landroid/view/IRotationWatcher$Stub;
.super Landroid/os/Binder;
.source "IRotationWatcher.java"

# interfaces
.implements Landroid/view/IRotationWatcher;


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Landroid/view/IRotationWatcher;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x409
    name = "Stub"
.end annotation

.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Landroid/view/IRotationWatcher$Stub$Proxy;
    }
.end annotation


# static fields
.field private static final DESCRIPTOR:Ljava/lang/String; = "android.view.IRotationWatcher"

.field static final TRANSACTION_onRotationChanged:I = 0x1


# direct methods
.method public constructor <init>()V
    .registers 2

    .line 34
    invoke-direct {p0}, Landroid/os/Binder;-><init>()V

    .line 35
    const-string v0, "android.view.IRotationWatcher"

    invoke-virtual {p0, p0, v0}, Landroid/view/IRotationWatcher$Stub;->attachInterface(Landroid/os/IInterface;Ljava/lang/String;)V

    .line 36
    return-void
.end method

.method public static asInterface(Landroid/os/IBinder;)Landroid/view/IRotationWatcher;
    .registers 3

    .line 39
    if-nez p0, :cond_4

    .line 40
    const/4 p0, 0x0

    return-object p0

    .line 42
    :cond_4
    const-string v0, "android.view.IRotationWatcher"

    invoke-interface {p0, v0}, Landroid/os/IBinder;->queryLocalInterface(Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v0

    .line 43
    if-eqz v0, :cond_13

    instance-of v1, v0, Landroid/view/IRotationWatcher;

    if-eqz v1, :cond_13

    .line 44
    check-cast v0, Landroid/view/IRotationWatcher;

    return-object v0

    .line 46
    :cond_13
    new-instance v0, Landroid/view/IRotationWatcher$Stub$Proxy;

    invoke-direct {v0, p0}, Landroid/view/IRotationWatcher$Stub$Proxy;-><init>(Landroid/os/IBinder;)V

    return-object v0
.end method

.method public static getDefaultImpl()Landroid/view/IRotationWatcher;
    .registers 1

    .line 105
    sget-object v0, Landroid/view/IRotationWatcher$Stub$Proxy;->sDefaultImpl:Landroid/view/IRotationWatcher;

    return-object v0
.end method

.method public static setDefaultImpl(Landroid/view/IRotationWatcher;)Z
    .registers 2

    .line 97
    sget-object v0, Landroid/view/IRotationWatcher$Stub$Proxy;->sDefaultImpl:Landroid/view/IRotationWatcher;

    if-nez v0, :cond_b

    if-nez p0, :cond_7

    goto :goto_b

    .line 100
    :cond_7
    sput-object p0, Landroid/view/IRotationWatcher$Stub$Proxy;->sDefaultImpl:Landroid/view/IRotationWatcher;

    .line 101
    const/4 p0, 0x1

    return p0

    .line 98
    :cond_b
    :goto_b
    const/4 p0, 0x0

    return p0
.end method


# virtual methods
.method public asBinder()Landroid/os/IBinder;
    .registers 1

    .line 31
    return-object p0
.end method

.method public onTransact(ILandroid/os/Parcel;Landroid/os/Parcel;I)Z
    .registers 8
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Landroid/os/RemoteException;
        }
    .end annotation

    .line 51
    const-string v0, "android.view.IRotationWatcher"

    const/4 v1, 0x1

    if-ne p1, v1, :cond_10

    .line 52
    invoke-virtual {p2, v0}, Landroid/os/Parcel;->enforceInterface(Ljava/lang/String;)V

    .line 53
    invoke-virtual {p2}, Landroid/os/Parcel;->readInt()I

    move-result p1

    invoke-virtual {p0, p1}, Landroid/view/IRotationWatcher$Stub;->onRotationChanged(I)V

    .line 54
    return v1

    .line 56
    :cond_10
    const v2, 0x5f4e5446

    if-ne p1, v2, :cond_19

    .line 57
    invoke-virtual {p3, v0}, Landroid/os/Parcel;->writeString(Ljava/lang/String;)V

    .line 58
    return v1

    .line 60
    :cond_19
    invoke-super {p0, p1, p2, p3, p4}, Landroid/os/Binder;->onTransact(ILandroid/os/Parcel;Landroid/os/Parcel;I)Z

    move-result p1

    return p1
.end method
