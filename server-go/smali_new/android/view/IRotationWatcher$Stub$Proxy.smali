.class Landroid/view/IRotationWatcher$Stub$Proxy;
.super Ljava/lang/Object;
.source "IRotationWatcher.java"

# interfaces
.implements Landroid/view/IRotationWatcher;


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Landroid/view/IRotationWatcher$Stub;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0xa
    name = "Proxy"
.end annotation


# static fields
.field public static sDefaultImpl:Landroid/view/IRotationWatcher;


# instance fields
.field private mRemote:Landroid/os/IBinder;


# direct methods
.method constructor <init>(Landroid/os/IBinder;)V
    .registers 2

    .line 71
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 72
    iput-object p1, p0, Landroid/view/IRotationWatcher$Stub$Proxy;->mRemote:Landroid/os/IBinder;

    .line 73
    return-void
.end method


# virtual methods
.method public asBinder()Landroid/os/IBinder;
    .registers 2

    .line 77
    iget-object v0, p0, Landroid/view/IRotationWatcher$Stub$Proxy;->mRemote:Landroid/os/IBinder;

    return-object v0
.end method

.method public getInterfaceDescriptor()Ljava/lang/String;
    .registers 2

    .line 68
    const-string v0, "android.view.IRotationWatcher"

    return-object v0
.end method

.method public onRotationChanged(I)V
    .registers 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Landroid/os/RemoteException;
        }
    .end annotation

    .line 82
    invoke-static {}, Landroid/os/Parcel;->obtain()Landroid/os/Parcel;

    move-result-object v0

    .line 84
    :try_start_4
    const-string v1, "android.view.IRotationWatcher"

    invoke-virtual {v0, v1}, Landroid/os/Parcel;->writeInterfaceToken(Ljava/lang/String;)V

    .line 85
    invoke-virtual {v0, p1}, Landroid/os/Parcel;->writeInt(I)V

    .line 86
    iget-object v1, p0, Landroid/view/IRotationWatcher$Stub$Proxy;->mRemote:Landroid/os/IBinder;

    const/4 v2, 0x0

    const/4 v3, 0x1

    invoke-interface {v1, v3, v0, v2, v3}, Landroid/os/IBinder;->transact(ILandroid/os/Parcel;Landroid/os/Parcel;I)Z

    move-result v1

    if-nez v1, :cond_29

    invoke-static {}, Landroid/view/IRotationWatcher$Stub;->getDefaultImpl()Landroid/view/IRotationWatcher;

    move-result-object v1

    if-nez v1, :cond_1d

    goto :goto_29

    .line 89
    :cond_1d
    invoke-static {}, Landroid/view/IRotationWatcher$Stub;->getDefaultImpl()Landroid/view/IRotationWatcher;

    move-result-object v1

    invoke-interface {v1, p1}, Landroid/view/IRotationWatcher;->onRotationChanged(I)V
    :try_end_24
    .catchall {:try_start_4 .. :try_end_24} :catchall_2d

    .line 91
    invoke-virtual {v0}, Landroid/os/Parcel;->recycle()V

    .line 92
    nop

    .line 93
    return-void

    .line 91
    :cond_29
    :goto_29
    invoke-virtual {v0}, Landroid/os/Parcel;->recycle()V

    .line 87
    return-void

    .line 91
    :catchall_2d
    move-exception p1

    invoke-virtual {v0}, Landroid/os/Parcel;->recycle()V

    .line 92
    throw p1
.end method
