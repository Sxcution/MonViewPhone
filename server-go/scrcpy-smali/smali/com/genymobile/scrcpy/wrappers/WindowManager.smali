.class public final Lcom/genymobile/scrcpy/wrappers/WindowManager;
.super Ljava/lang/Object;
.source "WindowManager.java"


# instance fields
.field private freezeRotationMethod:Ljava/lang/reflect/Method;

.field private getRotationMethod:Ljava/lang/reflect/Method;

.field private isRotationFrozenMethod:Ljava/lang/reflect/Method;

.field private final manager:Landroid/os/IInterface;

.field private removeRotationWatcherMethod:Ljava/lang/reflect/Method;

.field private thawRotationMethod:Ljava/lang/reflect/Method;


# direct methods
.method public constructor <init>(Landroid/os/IInterface;)V
    .locals 0

    .line 19
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 20
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    return-void
.end method

.method private getFreezeRotationMethod()Ljava/lang/reflect/Method;
    .locals 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 39
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->freezeRotationMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_0

    .line 40
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x1

    new-array v1, v1, [Ljava/lang/Class;

    const/4 v2, 0x0

    sget-object v3, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v3, v1, v2

    const-string v2, "freezeRotation"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->freezeRotationMethod:Ljava/lang/reflect/Method;

    .line 42
    :cond_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->freezeRotationMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getGetRotationMethod()Ljava/lang/reflect/Method;
    .locals 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 24
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRotationMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_0

    .line 25
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    :try_start_0
    const-string v2, "getDefaultDisplayRotation"

    new-array v3, v1, [Ljava/lang/Class;

    .line 29
    invoke-virtual {v0, v2, v3}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v2

    iput-object v2, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRotationMethod:Ljava/lang/reflect/Method;
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "getRotation"

    .line 32
    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRotationMethod:Ljava/lang/reflect/Method;

    .line 35
    :cond_0
    :goto_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRotationMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getIsRotationFrozenMethod()Ljava/lang/reflect/Method;
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 46
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->isRotationFrozenMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_0

    .line 47
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "isRotationFrozen"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->isRotationFrozenMethod:Ljava/lang/reflect/Method;

    .line 49
    :cond_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->isRotationFrozenMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getRemoveRotationWatcherMethod()Ljava/lang/reflect/Method;
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 60
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->removeRotationWatcherMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_0

    .line 61
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "removeRotationWatcher"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->removeRotationWatcherMethod:Ljava/lang/reflect/Method;

    .line 63
    :cond_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->removeRotationWatcherMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getThawRotationMethod()Ljava/lang/reflect/Method;
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 53
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->thawRotationMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_0

    .line 54
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "thawRotation"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->thawRotationMethod:Ljava/lang/reflect/Method;

    .line 56
    :cond_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->thawRotationMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method


# virtual methods
.method public freezeRotation(I)V
    .locals 4

    .line 78
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getFreezeRotationMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    .line 79
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x1

    new-array v2, v2, [Ljava/lang/Object;

    const/4 v3, 0x0

    invoke-static {p1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p1

    aput-object p1, v2, v3

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_1

    :catch_0
    move-exception p1

    goto :goto_0

    :catch_1
    move-exception p1

    goto :goto_0

    :catch_2
    move-exception p1

    :goto_0
    const-string v0, "Could not invoke method"

    .line 81
    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :goto_1
    return-void
.end method

.method public getRotation()I
    .locals 4

    const/4 v0, 0x0

    .line 68
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getGetRotationMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    .line 69
    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    new-array v3, v0, [Ljava/lang/Object;

    invoke-virtual {v1, v2, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ljava/lang/Integer;

    invoke-virtual {v1}, Ljava/lang/Integer;->intValue()I

    move-result v0
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    return v0

    :catch_0
    move-exception v1

    goto :goto_0

    :catch_1
    move-exception v1

    goto :goto_0

    :catch_2
    move-exception v1

    :goto_0
    const-string v2, "Could not invoke method"

    .line 71
    invoke-static {v2, v1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    return v0
.end method

.method public isRotationFrozen()Z
    .locals 4

    const/4 v0, 0x0

    .line 87
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getIsRotationFrozenMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    .line 88
    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    new-array v3, v0, [Ljava/lang/Object;

    invoke-virtual {v1, v2, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ljava/lang/Boolean;

    invoke-virtual {v1}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v0
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    return v0

    :catch_0
    move-exception v1

    goto :goto_0

    :catch_1
    move-exception v1

    goto :goto_0

    :catch_2
    move-exception v1

    :goto_0
    const-string v2, "Could not invoke method"

    .line 90
    invoke-static {v2, v1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    return v0
.end method

.method public registerRotationWatcher(Landroid/view/IRotationWatcher;I)V
    .locals 7

    const-string v0, "watchRotation"

    .line 106
    :try_start_0
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_1

    const/4 v2, 0x1

    const/4 v3, 0x0

    const/4 v4, 0x2

    :try_start_1
    new-array v5, v4, [Ljava/lang/Class;

    .line 110
    const-class v6, Landroid/view/IRotationWatcher;

    aput-object v6, v5, v3

    sget-object v6, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v6, v5, v2

    invoke-virtual {v1, v0, v5}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v5

    iget-object v6, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    new-array v4, v4, [Ljava/lang/Object;

    aput-object p1, v4, v3

    invoke-static {p2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p2

    aput-object p2, v4, v2

    invoke-virtual {v5, v6, v4}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1} :catch_0
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_1

    goto :goto_0

    :catch_0
    :try_start_2
    new-array p2, v2, [Ljava/lang/Class;

    .line 113
    const-class v4, Landroid/view/IRotationWatcher;

    aput-object v4, p2, v3

    invoke-virtual {v1, v0, p2}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object p2

    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    new-array v1, v2, [Ljava/lang/Object;

    aput-object p1, v1, v3

    invoke-virtual {p2, v0, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_1

    :goto_0
    return-void

    :catch_1
    move-exception p1

    .line 116
    new-instance p2, Ljava/lang/AssertionError;

    invoke-direct {p2, p1}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw p2
.end method

.method public thawRotation()V
    .locals 3

    .line 97
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getThawRotationMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    .line 98
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Object;

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_1

    :catch_0
    move-exception v0

    goto :goto_0

    :catch_1
    move-exception v0

    goto :goto_0

    :catch_2
    move-exception v0

    :goto_0
    const-string v1, "Could not invoke method"

    .line 100
    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :goto_1
    return-void
.end method

.method public unregisterRotationWatcher(Landroid/view/IRotationWatcher;)V
    .locals 4

    .line 122
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRemoveRotationWatcherMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    .line 123
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x1

    new-array v2, v2, [Ljava/lang/Object;

    const/4 v3, 0x0

    aput-object p1, v2, v3

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_1

    :catch_0
    move-exception p1

    goto :goto_0

    :catch_1
    move-exception p1

    goto :goto_0

    :catch_2
    move-exception p1

    :goto_0
    const-string v0, "Could not invoke method"

    .line 125
    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :goto_1
    return-void
.end method
