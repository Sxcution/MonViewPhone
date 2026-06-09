.class public final Lcom/genymobile/scrcpy/wrappers/PowerManager;
.super Ljava/lang/Object;
.source "PowerManager.java"


# instance fields
.field private isScreenOnMethod:Ljava/lang/reflect/Method;

.field private final manager:Landroid/os/IInterface;


# direct methods
.method public constructor <init>(Landroid/os/IInterface;)V
    .registers 2

    .line 14
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 15
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->manager:Landroid/os/IInterface;

    .line 16
    return-void
.end method

.method private getIsScreenOnMethod()Ljava/lang/reflect/Method;
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 19
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->isScreenOnMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_15

    .line 20
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "isInteractive"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->isScreenOnMethod:Ljava/lang/reflect/Method;

    .line 22
    :cond_15
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->isScreenOnMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method


# virtual methods
.method public isScreenOn()Z
    .registers 5

    .line 27
    const/4 v0, 0x0

    :try_start_1
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/PowerManager;->getIsScreenOnMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->manager:Landroid/os/IInterface;

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

    .line 28
    :catch_14
    move-exception v1

    goto :goto_19

    :catch_16
    move-exception v1

    goto :goto_19

    :catch_18
    move-exception v1

    .line 29
    :goto_19
    const-string v2, "Could not invoke method"

    invoke-static {v2, v1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 30
    return v0
.end method
