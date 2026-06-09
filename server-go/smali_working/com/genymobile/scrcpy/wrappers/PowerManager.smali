.class public final Lcom/genymobile/scrcpy/wrappers/PowerManager;
.super Ljava/lang/Object;
.source "PowerManager.java"


# instance fields
.field private isScreenOnMethod:Ljava/lang/reflect/Method;

.field private final manager:Landroid/os/IInterface;


# direct methods
.method public constructor <init>(Landroid/os/IInterface;)V
    .registers 2

    .line 16
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 17
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->manager:Landroid/os/IInterface;

    return-void
.end method

.method private getIsScreenOnMethod()Ljava/lang/reflect/Method;
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 21
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->isScreenOnMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_1e

    .line 23
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x14

    if-lt v0, v1, :cond_d

    const-string v0, "isInteractive"

    goto :goto_f

    :cond_d
    const-string v0, "isScreenOn"

    .line 24
    :goto_f
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Class;

    invoke-virtual {v1, v0, v2}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->isScreenOnMethod:Ljava/lang/reflect/Method;

    .line 26
    :cond_1e
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->isScreenOnMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method


# virtual methods
.method public isScreenOn()Z
    .registers 5

    const/4 v0, 0x0

    .line 31
    :try_start_1
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/PowerManager;->getIsScreenOnMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    .line 32
    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/PowerManager;->manager:Landroid/os/IInterface;

    new-array v3, v0, [Ljava/lang/Object;

    invoke-virtual {v1, v2, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ljava/lang/Boolean;

    invoke-virtual {v1}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v0
    :try_end_13
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_13} :catch_18
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_13} :catch_16
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_13} :catch_14

    return v0

    :catch_14
    move-exception v1

    goto :goto_19

    :catch_16
    move-exception v1

    goto :goto_19

    :catch_18
    move-exception v1

    :goto_19
    const-string v2, "Could not invoke method"

    .line 34
    invoke-static {v2, v1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    return v0
.end method
