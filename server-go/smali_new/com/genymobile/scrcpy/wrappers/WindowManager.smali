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
    .registers 2

    .line 18
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 19
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    .line 20
    return-void
.end method

.method private getFreezeRotationMethod()Ljava/lang/reflect/Method;
    .registers 5
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 35
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->freezeRotationMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_1a

    .line 36
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x1

    new-array v1, v1, [Ljava/lang/Class;

    sget-object v2, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    const/4 v3, 0x0

    aput-object v2, v1, v3

    const-string v2, "freezeRotation"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->freezeRotationMethod:Ljava/lang/reflect/Method;

    .line 38
    :cond_1a
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->freezeRotationMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getGetRotationMethod()Ljava/lang/reflect/Method;
    .registers 5
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 23
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRotationMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_21

    .line 24
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    .line 26
    const/4 v1, 0x0

    :try_start_b
    const-string v2, "getDefaultDisplayRotation"

    new-array v3, v1, [Ljava/lang/Class;

    invoke-virtual {v0, v2, v3}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v2

    iput-object v2, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRotationMethod:Ljava/lang/reflect/Method;
    :try_end_15
    .catch Ljava/lang/NoSuchMethodException; {:try_start_b .. :try_end_15} :catch_16

    .line 29
    goto :goto_21

    .line 27
    :catch_16
    move-exception v2

    .line 28
    const-string v2, "getRotation"

    new-array v1, v1, [Ljava/lang/Class;

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRotationMethod:Ljava/lang/reflect/Method;

    .line 31
    :cond_21
    :goto_21
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRotationMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getIsRotationFrozenMethod()Ljava/lang/reflect/Method;
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 42
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->isRotationFrozenMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_15

    .line 43
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "isRotationFrozen"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->isRotationFrozenMethod:Ljava/lang/reflect/Method;

    .line 45
    :cond_15
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->isRotationFrozenMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getRemoveRotationWatcherMethod()Ljava/lang/reflect/Method;
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 56
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->removeRotationWatcherMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_15

    .line 57
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "removeRotationWatcher"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->removeRotationWatcherMethod:Ljava/lang/reflect/Method;

    .line 59
    :cond_15
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->removeRotationWatcherMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getThawRotationMethod()Ljava/lang/reflect/Method;
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 49
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->thawRotationMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_15

    .line 50
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "thawRotation"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->thawRotationMethod:Ljava/lang/reflect/Method;

    .line 52
    :cond_15
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->thawRotationMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method


# virtual methods
.method public freezeRotation(I)V
    .registers 6

    .line 73
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getFreezeRotationMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-static {p1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p1

    const/4 v2, 0x1

    new-array v2, v2, [Ljava/lang/Object;

    const/4 v3, 0x0

    aput-object p1, v2, v3

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_13
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_13} :catch_18
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_13} :catch_16
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_13} :catch_14

    .line 76
    goto :goto_1e

    .line 74
    :catch_14
    move-exception p1

    goto :goto_19

    :catch_16
    move-exception p1

    goto :goto_19

    :catch_18
    move-exception p1

    .line 75
    :goto_19
    const-string v0, "Could not invoke method"

    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 77
    :goto_1e
    return-void
.end method

.method public getRotation()I
    .registers 5

    .line 64
    const/4 v0, 0x0

    :try_start_1
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getGetRotationMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    new-array v3, v0, [Ljava/lang/Object;

    invoke-virtual {v1, v2, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ljava/lang/Integer;

    invoke-virtual {v1}, Ljava/lang/Integer;->intValue()I

    move-result v0
    :try_end_13
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_13} :catch_18
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_13} :catch_16
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_13} :catch_14

    return v0

    .line 65
    :catch_14
    move-exception v1

    goto :goto_19

    :catch_16
    move-exception v1

    goto :goto_19

    :catch_18
    move-exception v1

    .line 66
    :goto_19
    const-string v2, "Could not invoke method"

    invoke-static {v2, v1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 67
    return v0
.end method

.method public isRotationFrozen()Z
    .registers 5

    .line 81
    const/4 v0, 0x0

    :try_start_1
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getIsRotationFrozenMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    new-array v3, v0, [Ljava/lang/Object;

    invoke-virtual {v1, v2, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ljava/lang/Boolean;

    invoke-virtual {v1}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v0
    :try_end_13
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_13} :catch_18
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_13} :catch_16
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_13} :catch_14

    return v0

    .line 82
    :catch_14
    move-exception v1

    goto :goto_19

    :catch_16
    move-exception v1

    goto :goto_19

    :catch_18
    move-exception v1

    .line 83
    :goto_19
    const-string v2, "Could not invoke method"

    invoke-static {v2, v1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 84
    return v0
.end method

.method public registerRotationWatcher(Landroid/view/IRotationWatcher;I)V
    .registers 10

    .line 98
    const-string v0, "watchRotation"

    :try_start_2
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1
    :try_end_8
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_8} :catch_3f

    .line 100
    const/4 v2, 0x0

    const/4 v3, 0x1

    const/4 v4, 0x2

    :try_start_b
    new-array v5, v4, [Ljava/lang/Class;

    const-class v6, Landroid/view/IRotationWatcher;

    aput-object v6, v5, v2

    sget-object v6, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v6, v5, v3

    invoke-virtual {v1, v0, v5}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v5

    iget-object v6, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    invoke-static {p2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p2

    new-array v4, v4, [Ljava/lang/Object;

    aput-object p1, v4, v2

    aput-object p2, v4, v3

    invoke-virtual {v5, v6, v4}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_28
    .catch Ljava/lang/NoSuchMethodException; {:try_start_b .. :try_end_28} :catch_29
    .catch Ljava/lang/Exception; {:try_start_b .. :try_end_28} :catch_3f

    .line 103
    goto :goto_3d

    .line 101
    :catch_29
    move-exception p2

    .line 102
    :try_start_2a
    new-array p2, v3, [Ljava/lang/Class;

    const-class v4, Landroid/view/IRotationWatcher;

    aput-object v4, p2, v2

    invoke-virtual {v1, v0, p2}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object p2

    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    new-array v1, v3, [Ljava/lang/Object;

    aput-object p1, v1, v2

    invoke-virtual {p2, v0, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_3d
    .catch Ljava/lang/Exception; {:try_start_2a .. :try_end_3d} :catch_3f

    .line 106
    :goto_3d
    nop

    .line 107
    return-void

    .line 104
    :catch_3f
    move-exception p1

    .line 105
    new-instance p2, Ljava/lang/AssertionError;

    invoke-direct {p2, p1}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw p2
.end method

.method public thawRotation()V
    .registers 4

    .line 90
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getThawRotationMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Object;

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_c
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_c} :catch_11
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_c} :catch_f
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_c} :catch_d

    .line 93
    goto :goto_17

    .line 91
    :catch_d
    move-exception v0

    goto :goto_12

    :catch_f
    move-exception v0

    goto :goto_12

    :catch_11
    move-exception v0

    .line 92
    :goto_12
    const-string v1, "Could not invoke method"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 94
    :goto_17
    return-void
.end method

.method public unregisterRotationWatcher(Landroid/view/IRotationWatcher;)V
    .registers 6

    .line 111
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRemoveRotationWatcherMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/WindowManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x1

    new-array v2, v2, [Ljava/lang/Object;

    const/4 v3, 0x0

    aput-object p1, v2, v3

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_f
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_f} :catch_14
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_f} :catch_12
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_f} :catch_10

    .line 114
    goto :goto_1a

    .line 112
    :catch_10
    move-exception p1

    goto :goto_15

    :catch_12
    move-exception p1

    goto :goto_15

    :catch_14
    move-exception p1

    .line 113
    :goto_15
    const-string v0, "Could not invoke method"

    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 115
    :goto_1a
    return-void
.end method
