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

    .line 20
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const/4 v0, 0x1

    .line 17
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethodNewVersion:Z

    .line 21
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    return-void
.end method

.method private getContentProviderExternal(Ljava/lang/String;Landroid/os/IBinder;)Lcom/genymobile/scrcpy/wrappers/ContentProvider;
    .registers 10

    const/4 v0, 0x0

    .line 47
    :try_start_1
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getGetContentProviderExternalMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    .line 49
    iget-boolean v2, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethodNewVersion:Z

    const/4 v3, 0x2

    const/4 v4, 0x3

    const/4 v5, 0x1

    const/4 v6, 0x0

    if-eqz v2, :cond_1d

    const/4 v2, 0x4

    new-array v2, v2, [Ljava/lang/Object;

    aput-object p1, v2, v6

    .line 51
    invoke-static {v6}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v6

    aput-object v6, v2, v5

    aput-object p2, v2, v3

    aput-object v0, v2, v4

    goto :goto_29

    :cond_1d
    new-array v2, v4, [Ljava/lang/Object;

    aput-object p1, v2, v6

    .line 54
    invoke-static {v6}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    aput-object v4, v2, v5

    aput-object p2, v2, v3

    .line 57
    :goto_29
    iget-object v3, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v1, v3, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    if-nez v1, :cond_32

    return-object v0

    .line 62
    :cond_32
    invoke-virtual {v1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    const-string v3, "provider"

    invoke-virtual {v2, v3}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v2

    .line 63
    invoke-virtual {v2, v5}, Ljava/lang/reflect/Field;->setAccessible(Z)V

    .line 64
    invoke-virtual {v2, v1}, Ljava/lang/reflect/Field;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    if-nez v1, :cond_46

    return-object v0

    .line 68
    :cond_46
    new-instance v2, Lcom/genymobile/scrcpy/wrappers/ContentProvider;

    invoke-direct {v2, p0, v1, p1, p2}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;-><init>(Lcom/genymobile/scrcpy/wrappers/ActivityManager;Ljava/lang/Object;Ljava/lang/String;Landroid/os/IBinder;)V
    :try_end_4b
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_4b} :catch_52
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_4b} :catch_50
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_4b} :catch_4e
    .catch Ljava/lang/NoSuchFieldException; {:try_start_1 .. :try_end_4b} :catch_4c

    return-object v2

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

    :goto_53
    const-string p2, "Could not invoke method"

    .line 70
    invoke-static {p2, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    return-object v0
.end method

.method private getGetContentProviderExternalMethod()Ljava/lang/reflect/Method;
    .registers 9
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    const-string v0, "getContentProviderExternal"

    .line 25
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethod:Ljava/lang/reflect/Method;

    if-nez v1, :cond_46

    const/4 v1, 0x2

    const/4 v2, 0x1

    const/4 v3, 0x3

    const/4 v4, 0x0

    .line 27
    :try_start_a
    iget-object v5, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v5}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v5

    const/4 v6, 0x4

    new-array v6, v6, [Ljava/lang/Class;

    const-class v7, Ljava/lang/String;

    aput-object v7, v6, v4

    sget-object v7, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v7, v6, v2

    const-class v7, Landroid/os/IBinder;

    aput-object v7, v6, v1

    const-class v7, Ljava/lang/String;

    aput-object v7, v6, v3

    .line 28
    invoke-virtual {v5, v0, v6}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v5

    iput-object v5, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethod:Ljava/lang/reflect/Method;
    :try_end_29
    .catch Ljava/lang/NoSuchMethodException; {:try_start_a .. :try_end_29} :catch_2a

    goto :goto_46

    .line 31
    :catch_2a
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

    .line 32
    iput-boolean v4, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternalMethodNewVersion:Z

    .line 35
    :cond_46
    :goto_46
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

    .line 39
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->removeContentProviderExternalMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_1f

    .line 40
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x2

    new-array v1, v1, [Ljava/lang/Class;

    const/4 v2, 0x0

    const-class v3, Ljava/lang/String;

    aput-object v3, v1, v2

    const/4 v2, 0x1

    const-class v3, Landroid/os/IBinder;

    aput-object v3, v1, v2

    const-string v2, "removeContentProviderExternal"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->removeContentProviderExternalMethod:Ljava/lang/reflect/Method;

    .line 42
    :cond_1f
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->removeContentProviderExternalMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method


# virtual methods
.method public createSettingsProvider()Lcom/genymobile/scrcpy/wrappers/ContentProvider;
    .registers 3

    .line 85
    new-instance v0, Landroid/os/Binder;

    invoke-direct {v0}, Landroid/os/Binder;-><init>()V

    const-string v1, "settings"

    invoke-direct {p0, v1, v0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getContentProviderExternal(Ljava/lang/String;Landroid/os/IBinder;)Lcom/genymobile/scrcpy/wrappers/ContentProvider;

    move-result-object v0

    return-object v0
.end method

.method removeContentProviderExternal(Ljava/lang/String;Landroid/os/IBinder;)V
    .registers 7

    .line 77
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->getRemoveContentProviderExternalMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    .line 78
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x2

    new-array v2, v2, [Ljava/lang/Object;

    const/4 v3, 0x0

    aput-object p1, v2, v3

    const/4 p1, 0x1

    aput-object p2, v2, p1

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_12
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_12} :catch_17
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_12} :catch_15
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_12} :catch_13

    goto :goto_1d

    :catch_13
    move-exception p1

    goto :goto_18

    :catch_15
    move-exception p1

    goto :goto_18

    :catch_17
    move-exception p1

    :goto_18
    const-string p2, "Could not invoke method"

    .line 80
    invoke-static {p2, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :goto_1d
    return-void
.end method
