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
    .locals 0

    .line 22
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 23
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->manager:Landroid/os/IInterface;

    return-void
.end method

.method private getInjectInputEventMethod()Ljava/lang/reflect/Method;
    .locals 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 27
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->injectInputEventMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_0

    .line 28
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x2

    new-array v1, v1, [Ljava/lang/Class;

    const/4 v2, 0x0

    const-class v3, Landroid/view/InputEvent;

    aput-object v3, v1, v2

    const/4 v2, 0x1

    sget-object v3, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v3, v1, v2

    const-string v2, "injectInputEvent"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->injectInputEventMethod:Ljava/lang/reflect/Method;

    .line 30
    :cond_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->injectInputEventMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private static getSetDisplayIdMethod()Ljava/lang/reflect/Method;
    .locals 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 44
    sget-object v0, Lcom/genymobile/scrcpy/wrappers/InputManager;->setDisplayIdMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_0

    .line 45
    const-class v0, Landroid/view/InputEvent;

    const/4 v1, 0x1

    new-array v1, v1, [Ljava/lang/Class;

    const/4 v2, 0x0

    sget-object v3, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v3, v1, v2

    const-string v2, "setDisplayId"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    sput-object v0, Lcom/genymobile/scrcpy/wrappers/InputManager;->setDisplayIdMethod:Ljava/lang/reflect/Method;

    .line 47
    :cond_0
    sget-object v0, Lcom/genymobile/scrcpy/wrappers/InputManager;->setDisplayIdMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method public static setDisplayId(Landroid/view/InputEvent;I)Z
    .locals 4

    const/4 v0, 0x0

    .line 52
    :try_start_0
    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/InputManager;->getSetDisplayIdMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    const/4 v2, 0x1

    new-array v3, v2, [Ljava/lang/Object;

    .line 53
    invoke-static {p1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p1

    aput-object p1, v3, v0

    invoke-virtual {v1, p0, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    return v2

    :catch_0
    move-exception p0

    goto :goto_0

    :catch_1
    move-exception p0

    goto :goto_0

    :catch_2
    move-exception p0

    :goto_0
    const-string p1, "Cannot associate a display id to the input event"

    .line 56
    invoke-static {p1, p0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    return v0
.end method


# virtual methods
.method public injectInputEvent(Landroid/view/InputEvent;I)Z
    .locals 4

    const/4 v0, 0x0

    .line 35
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/InputManager;->getInjectInputEventMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    .line 36
    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/InputManager;->manager:Landroid/os/IInterface;

    const/4 v3, 0x2

    new-array v3, v3, [Ljava/lang/Object;

    aput-object p1, v3, v0

    const/4 p1, 0x1

    invoke-static {p2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p2

    aput-object p2, v3, p1

    invoke-virtual {v1, v2, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Ljava/lang/Boolean;

    invoke-virtual {p1}, Ljava/lang/Boolean;->booleanValue()Z

    move-result p1
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    return p1

    :catch_0
    move-exception p1

    goto :goto_0

    :catch_1
    move-exception p1

    goto :goto_0

    :catch_2
    move-exception p1

    :goto_0
    const-string p2, "Could not invoke method"

    .line 38
    invoke-static {p2, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    return v0
.end method
