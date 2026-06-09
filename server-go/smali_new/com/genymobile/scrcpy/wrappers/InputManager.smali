.class public final Lcom/genymobile/scrcpy/wrappers/InputManager;
.super Ljava/lang/Object;
.source "InputManager.java"


# static fields
.field public static final INJECT_INPUT_EVENT_MODE_ASYNC:I = 0x0

.field public static final INJECT_INPUT_EVENT_MODE_WAIT_FOR_FINISH:I = 0x2

.field public static final INJECT_INPUT_EVENT_MODE_WAIT_FOR_RESULT:I = 0x1

.field private static setDisplayIdMethod:Ljava/lang/reflect/Method;


# instance fields
.field private injectInputEventMethod:Ljava/lang/reflect/Method;

.field private final manager:Landroid/os/IInterface;


# direct methods
.method public constructor <init>(Landroid/os/IInterface;)V
    .registers 2

    .line 18
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 19
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->manager:Landroid/os/IInterface;

    .line 20
    return-void
.end method

.method private getInjectInputEventMethod()Ljava/lang/reflect/Method;
    .registers 5
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 23
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->injectInputEventMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_1f

    .line 24
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x2

    new-array v1, v1, [Ljava/lang/Class;

    const-class v2, Landroid/view/InputEvent;

    const/4 v3, 0x0

    aput-object v2, v1, v3

    sget-object v2, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    const/4 v3, 0x1

    aput-object v2, v1, v3

    const-string v2, "injectInputEvent"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->injectInputEventMethod:Ljava/lang/reflect/Method;

    .line 26
    :cond_1f
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->injectInputEventMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private static getSetDisplayIdMethod()Ljava/lang/reflect/Method;
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 39
    sget-object v0, Lcom/genymobile/scrcpy/wrappers/InputManager;->setDisplayIdMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_16

    .line 40
    const-class v0, Landroid/view/InputEvent;

    const/4 v1, 0x1

    new-array v1, v1, [Ljava/lang/Class;

    sget-object v2, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    const/4 v3, 0x0

    aput-object v2, v1, v3

    const-string v2, "setDisplayId"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    sput-object v0, Lcom/genymobile/scrcpy/wrappers/InputManager;->setDisplayIdMethod:Ljava/lang/reflect/Method;

    .line 42
    :cond_16
    sget-object v0, Lcom/genymobile/scrcpy/wrappers/InputManager;->setDisplayIdMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method public static setDisplayId(Landroid/view/InputEvent;I)Z
    .registers 6

    .line 47
    const/4 v0, 0x0

    :try_start_1
    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/InputManager;->getSetDisplayIdMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    invoke-static {p1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p1

    const/4 v2, 0x1

    new-array v3, v2, [Ljava/lang/Object;

    aput-object p1, v3, v0

    invoke-virtual {v1, p0, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_11
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_11} :catch_16
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_11} :catch_14
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_11} :catch_12

    .line 48
    return v2

    .line 49
    :catch_12
    move-exception p0

    goto :goto_17

    :catch_14
    move-exception p0

    goto :goto_17

    :catch_16
    move-exception p0

    .line 50
    :goto_17
    const-string p1, "Cannot associate a display id to the input event"

    invoke-static {p1, p0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 51
    return v0
.end method


# virtual methods
.method public injectInputEvent(Landroid/view/InputEvent;I)Z
    .registers 7

    .line 31
    const/4 v0, 0x0

    :try_start_1
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/InputManager;->getInjectInputEventMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->manager:Landroid/os/IInterface;

    invoke-static {p2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p2

    const/4 v3, 0x2

    new-array v3, v3, [Ljava/lang/Object;

    aput-object p1, v3, v0

    const/4 p1, 0x1

    aput-object p2, v3, p1

    invoke-virtual {v1, v2, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Ljava/lang/Boolean;

    invoke-virtual {p1}, Ljava/lang/Boolean;->booleanValue()Z

    move-result p1
    :try_end_1d
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1d} :catch_22
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1d} :catch_20
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_1d} :catch_1e

    return p1

    .line 32
    :catch_1e
    move-exception p1

    goto :goto_23

    :catch_20
    move-exception p1

    goto :goto_23

    :catch_22
    move-exception p1

    .line 33
    :goto_23
    const-string p2, "Could not invoke method"

    invoke-static {p2, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 34
    return v0
.end method
