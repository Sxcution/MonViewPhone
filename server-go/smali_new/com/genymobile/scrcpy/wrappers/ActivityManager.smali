.class public Lcom/genymobile/scrcpy/wrappers/ActivityManager;
.super Ljava/lang/Object;
.source "ActivityManager.java"


# instance fields
.field private getContentProviderExternalMethod:Ljava/lang/reflect/Method;

.field private getContentProviderExternalMethodNewVersion:Z

.field private final manager:Landroid/os/IInterface;

.field private removeContentProviderExternalMethod:Ljava/lang/reflect/Method;


# direct methods
.method public constructor <init>(Landroid/os/IInterface;)V
    .registers 3

    .line 18
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 14
    const/4 v0, 0x1

    iput-boolean v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethodNewVersion:Z

    .line 19
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    .line 20
    return-void
.end method

.method private getContentProviderExternal(Ljava/lang/String;Landroid/os/IBinder;)Lcom/genymobile/scrcpy/wrappers/ContentProvider;
    .registers 12

    .line 43
    const/4 v0, 0x0

    :try_start_1
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getGetContentProviderExternalMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    iget-boolean v3, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethodNewVersion:Z

    const/4 v4, 0x2

    const/4 v5, 0x3

    const/4 v6, 0x1

    const/4 v7, 0x0

    if-eqz v3, :cond_1f

    invoke-static {v7}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v3

    const/4 v8, 0x4

    new-array v8, v8, [Ljava/lang/Object;

    aput-object p1, v8, v7

    aput-object v3, v8, v6

    aput-object p2, v8, v4

    aput-object v0, v8, v5

    goto :goto_2b

    :cond_1f
    invoke-static {v7}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v3

    new-array v8, v5, [Ljava/lang/Object;

    aput-object p1, v8, v7

    aput-object v3, v8, v6

    aput-object p2, v8, v4

    :goto_2b
    invoke-virtual {v1, v2, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    .line 44
    if-nez v1, :cond_32

    .line 45
    return-object v0

    .line 47
    :cond_32
    invoke-virtual {v1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    const-string v3, "provider"

    invoke-virtual {v2, v3}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v2

    .line 48
    invoke-virtual {v2, v6}, Ljava/lang/reflect/Field;->setAccessible(Z)V

    .line 49
    invoke-virtual {v2, v1}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    .line 50
    if-nez v1, :cond_46

    .line 51
    return-object v0

    .line 53
    :cond_46
    new-instance v2, Lcom/genymobile/scrcpy/wrappers/ContentProvider;

    invoke-direct {v2, p0, v1, p1, p2}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;-><init>(Lcom/genymobile/scrcpy/wrappers/ActivityManager;Ljava/lang/Object;Ljava/lang/String;Landroid/os/IBinder;)V
    :try_end_4b
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_4b} :catch_52
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_4b} :catch_50
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_4b} :catch_4e
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_4b} :catch_4c

    return-object v2

    .line 54
    :catch_4c
    move-exception p1

    goto :goto_53

    :catch_4e
    move-exception p1

    goto :goto_53

    :catch_50
    move-exception p1

    goto :goto_53

    :catch_52
    move-exception p1

    .line 55
    :goto_53
    const-string p2, "Could not invoke method"

    invoke-static {p2, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 56
    return-object v0
.end method

.method private getGetContentProviderExternalMethod()Ljava/lang/reflect/Method;
    .registers 10
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 23
    const-string v0, "getContentProviderExternal"

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethod:Ljava/lang/reflect/Method;

    if-nez v1, :cond_45

    .line 25
    const/4 v1, 0x2

    const/4 v2, 0x1

    const/4 v3, 0x3

    const/4 v4, 0x0

    :try_start_a
    iget-object v5, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v5}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v5

    const/4 v6, 0x4

    new-array v6, v6, [Ljava/lang/Class;

    const-class v7, Ljava/lang/String;

    aput-object v7, v6, v4

    sget-object v8, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v8, v6, v2

    const-class v8, Landroid/os/IBinder;

    aput-object v8, v6, v1

    aput-object v7, v6, v3

    invoke-virtual {v5, v0, v6}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v5

    iput-object v5, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethod:Ljava/lang/reflect/Method;
    :try_end_27
    .catch Ljava/lang/NoSuchMethodException; {:try_start_a .. :try_end_27} :catch_28

    .line 29
    goto :goto_45

    .line 26
    :catch_28
    move-exception v5

    .line 27
    iget-object v5, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v5}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v5

    new-array v3, v3, [Ljava/lang/Class;

    const-class v6, Ljava/lang/String;

    aput-object v6, v3, v4

    sget-object v6, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v6, v3, v2

    const-class v2, Landroid/os/IBinder;

    aput-object v2, v3, v1

    invoke-virtual {v5, v0, v3}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethod:Ljava/lang/reflect/Method;

    .line 28
    iput-boolean v4, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethodNewVersion:Z

    .line 31
    :cond_45
    :goto_45
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getRemoveContentProviderExternalMethod()Ljava/lang/reflect/Method;
    .registers 5
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 35
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->removeContentProviderExternalMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_1f

    .line 36
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x2

    new-array v1, v1, [Ljava/lang/Class;

    const-class v2, Ljava/lang/String;

    const/4 v3, 0x0

    aput-object v2, v1, v3

    const-class v2, Landroid/os/IBinder;

    const/4 v3, 0x1

    aput-object v2, v1, v3

    const-string v2, "removeContentProviderExternal"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->removeContentProviderExternalMethod:Ljava/lang/reflect/Method;

    .line 38
    :cond_1f
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->removeContentProviderExternalMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method


# virtual methods
.method public createSettingsProvider()Lcom/genymobile/scrcpy/wrappers/ContentProvider;
    .registers 3

    .line 69
    new-instance v0, Landroid/os/Binder;

    invoke-direct {v0}, Landroid/os/Binder;-><init>()V

    const-string v1, "settings"

    invoke-direct {p0, v1, v0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternal(Ljava/lang/String;Landroid/os/IBinder;)Lcom/genymobile/scrcpy/wrappers/ContentProvider;

    move-result-object v0

    return-object v0
.end method

.method removeContentProviderExternal(Ljava/lang/String;Landroid/os/IBinder;)V
    .registers 7

    .line 62
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getRemoveContentProviderExternalMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x2

    new-array v2, v2, [Ljava/lang/Object;

    const/4 v3, 0x0

    aput-object p1, v2, v3

    const/4 p1, 0x1

    aput-object p2, v2, p1

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_12
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_12} :catch_17
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_12} :catch_15
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_12} :catch_13

    .line 65
    goto :goto_1d

    .line 63
    :catch_13
    move-exception p1

    goto :goto_18

    :catch_15
    move-exception p1

    goto :goto_18

    :catch_17
    move-exception p1

    .line 64
    :goto_18
    const-string p2, "Could not invoke method"

    invoke-static {p2, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 66
    :goto_1d
    return-void
.end method
