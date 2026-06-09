.class public final Lcom/genymobile/scrcpy/wrappers/DisplayManager;
.super Ljava/lang/Object;
.source "DisplayManager.java"


# instance fields
.field private createVirtualDisplayMethod:Ljava/lang/reflect/Method;

.field private final manager:Landroid/os/IInterface;


# direct methods
.method public constructor <init>(Landroid/os/IInterface;)V
    .registers 2

    .line 16
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 17
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->manager:Landroid/os/IInterface;

    .line 18
    return-void
.end method

.method private getCreateVirtualDisplayMethod()Ljava/lang/reflect/Method;
    .registers 5
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 46
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->createVirtualDisplayMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_26

    .line 47
    const-class v0, Landroid/hardware/display/DisplayManager;

    const/4 v1, 0x5

    new-array v1, v1, [Ljava/lang/Class;

    const-class v2, Ljava/lang/String;

    const/4 v3, 0x0

    aput-object v2, v1, v3

    sget-object v2, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    const/4 v3, 0x1

    aput-object v2, v1, v3

    const/4 v3, 0x2

    aput-object v2, v1, v3

    const/4 v3, 0x3

    aput-object v2, v1, v3

    const-class v2, Landroid/view/Surface;

    const/4 v3, 0x4

    aput-object v2, v1, v3

    const-string v2, "createVirtualDisplay"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->createVirtualDisplayMethod:Ljava/lang/reflect/Method;

    .line 49
    :cond_26
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->createVirtualDisplayMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method


# virtual methods
.method public createVirtualDisplay(Ljava/lang/String;IIILandroid/view/Surface;)Landroid/hardware/display/VirtualDisplay;
    .registers 9
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    .line 53
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->getCreateVirtualDisplayMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    invoke-static {p2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p2

    invoke-static {p3}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p3

    invoke-static {p4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p4

    const/4 v1, 0x5

    new-array v1, v1, [Ljava/lang/Object;

    const/4 v2, 0x0

    aput-object p1, v1, v2

    const/4 p1, 0x1

    aput-object p2, v1, p1

    const/4 p1, 0x2

    aput-object p3, v1, p1

    const/4 p1, 0x3

    aput-object p4, v1, p1

    const/4 p1, 0x4

    aput-object p5, v1, p1

    const/4 p1, 0x0

    invoke-virtual {v0, p1, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Landroid/hardware/display/VirtualDisplay;

    return-object p1
.end method

.method public getDisplayIds()[I
    .registers 5

    .line 35
    const/4 v0, 0x0

    :try_start_1
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    const-string v2, "getDisplayIds"

    new-array v3, v0, [Ljava/lang/Class;

    invoke-virtual {v1, v2, v3}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v1

    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->manager:Landroid/os/IInterface;

    new-array v3, v0, [Ljava/lang/Object;

    invoke-virtual {v1, v2, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, [I
    :try_end_19
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_19} :catch_21
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_19} :catch_1a

    return-object v1

    .line 40
    :catch_1a
    move-exception v0

    .line 41
    new-instance v1, Ljava/lang/AssertionError;

    invoke-direct {v1, v0}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw v1

    .line 36
    :catch_21
    move-exception v1

    .line 37
    const-string v1, "FIXME: Returning only default display."

    invoke-static {v1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 38
    const-string v1, "See https://github.com/NetrisTV/ws-scrcpy/issues/217"

    invoke-static {v1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 39
    filled-new-array {v0}, [I

    move-result-object v0

    return-object v0
.end method

.method public getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;
    .registers 10

    .line 22
    :try_start_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const-string v1, "getDisplayInfo"

    const/4 v2, 0x1

    new-array v3, v2, [Ljava/lang/Class;

    sget-object v4, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    const/4 v5, 0x0

    aput-object v4, v3, v5

    invoke-virtual {v0, v1, v3}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->manager:Landroid/os/IInterface;

    invoke-static {p1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v3

    new-array v2, v2, [Ljava/lang/Object;

    aput-object v3, v2, v5

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    .line 23
    if-nez v0, :cond_26

    .line 24
    const/4 p1, 0x0

    return-object p1

    .line 26
    :cond_26
    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    .line 27
    new-instance v2, Lcom/genymobile/scrcpy/DisplayInfo;

    new-instance v4, Lcom/genymobile/scrcpy/Size;

    const-string v3, "logicalWidth"

    invoke-virtual {v1, v3}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v3

    invoke-virtual {v3, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v3

    const-string v5, "logicalHeight"

    invoke-virtual {v1, v5}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v5

    invoke-virtual {v5, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v5

    invoke-direct {v4, v3, v5}, Lcom/genymobile/scrcpy/Size;-><init>(II)V

    const-string v3, "rotation"

    invoke-virtual {v1, v3}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v3

    invoke-virtual {v3, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v5

    const-string v3, "layerStack"

    invoke-virtual {v1, v3}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v3

    invoke-virtual {v3, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v6

    const-string v3, "flags"

    invoke-virtual {v1, v3}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    invoke-virtual {v1, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v7

    move v3, p1

    invoke-direct/range {v2 .. v7}, Lcom/genymobile/scrcpy/DisplayInfo;-><init>(ILcom/genymobile/scrcpy/Size;III)V
    :try_end_67
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_67} :catch_68

    return-object v2

    .line 28
    :catch_68
    move-exception v0

    move-object p1, v0

    .line 29
    new-instance v0, Ljava/lang/AssertionError;

    invoke-direct {v0, p1}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw v0
.end method
