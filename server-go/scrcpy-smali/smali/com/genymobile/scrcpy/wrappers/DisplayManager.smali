.class public final Lcom/genymobile/scrcpy/wrappers/DisplayManager;
.super Ljava/lang/Object;
.source "DisplayManager.java"


# instance fields
.field private createVirtualDisplayMethod:Ljava/lang/reflect/Method;

.field private final manager:Landroid/os/IInterface;


# direct methods
.method public constructor <init>(Landroid/os/IInterface;)V
    .locals 0

    .line 18
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 19
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->manager:Landroid/os/IInterface;

    return-void
.end method

.method private getCreateVirtualDisplayMethod()Ljava/lang/reflect/Method;
    .locals 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 57
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->createVirtualDisplayMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_0

    .line 58
    const-class v0, Landroid/hardware/display/DisplayManager;

    const/4 v1, 0x5

    new-array v1, v1, [Ljava/lang/Class;

    const/4 v2, 0x0

    const-class v3, Ljava/lang/String;

    aput-object v3, v1, v2

    const/4 v2, 0x1

    sget-object v3, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v3, v1, v2

    const/4 v2, 0x2

    sget-object v3, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v3, v1, v2

    const/4 v2, 0x3

    sget-object v3, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    aput-object v3, v1, v2

    const/4 v2, 0x4

    const-class v3, Landroid/view/Surface;

    aput-object v3, v1, v2

    const-string v2, "createVirtualDisplay"

    .line 59
    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->createVirtualDisplayMethod:Ljava/lang/reflect/Method;

    .line 61
    :cond_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->createVirtualDisplayMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method


# virtual methods
.method public createVirtualDisplay(Ljava/lang/String;IIILandroid/view/Surface;)Landroid/hardware/display/VirtualDisplay;
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    .line 65
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->getCreateVirtualDisplayMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    const/4 v1, 0x5

    new-array v1, v1, [Ljava/lang/Object;

    const/4 v2, 0x0

    aput-object p1, v1, v2

    .line 66
    invoke-static {p2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p1

    const/4 p2, 0x1

    aput-object p1, v1, p2

    invoke-static {p3}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p1

    const/4 p2, 0x2

    aput-object p1, v1, p2

    invoke-static {p4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p1

    const/4 p2, 0x3

    aput-object p1, v1, p2

    const/4 p1, 0x4

    aput-object p5, v1, p1

    const/4 p1, 0x0

    invoke-virtual {v0, p1, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Landroid/hardware/display/VirtualDisplay;

    return-object p1
.end method

.method public getDisplayIds()[I
    .locals 4

    const-string v0, "getDisplayIds"

    const/4 v1, 0x0

    .line 45
    :try_start_0
    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v2}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    new-array v3, v1, [Ljava/lang/Class;

    invoke-virtual {v2, v0, v3}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    .line 46
    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->manager:Landroid/os/IInterface;

    new-array v3, v1, [Ljava/lang/Object;

    invoke-virtual {v0, v2, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [I

    check-cast v0, [I
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-object v0

    :catch_0
    move-exception v0

    .line 52
    new-instance v1, Ljava/lang/AssertionError;

    invoke-direct {v1, v0}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw v1

    :catch_1
    const-string v0, "FIXME: Returning only default display."

    .line 48
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    const-string v0, "See https://github.com/NetrisTV/ws-scrcpy/issues/217"

    .line 49
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    const/4 v0, 0x1

    new-array v0, v0, [I

    aput v1, v0, v1

    return-object v0
.end method

.method public getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;
    .locals 11

    .line 24
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

    new-array v2, v2, [Ljava/lang/Object;

    invoke-static {p1}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v3

    aput-object v3, v2, v5

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    if-nez v0, :cond_0

    const/4 p1, 0x0

    return-object p1

    .line 28
    :cond_0
    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    const-string v2, "logicalWidth"

    .line 30
    invoke-virtual {v1, v2}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v2

    invoke-virtual {v2, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v2

    const-string v3, "logicalHeight"

    .line 31
    invoke-virtual {v1, v3}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v3

    invoke-virtual {v3, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v3

    const-string v4, "rotation"

    .line 32
    invoke-virtual {v1, v4}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v4

    invoke-virtual {v4, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v8

    const-string v4, "layerStack"

    .line 33
    invoke-virtual {v1, v4}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v4

    invoke-virtual {v4, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v9

    const-string v4, "flags"

    .line 34
    invoke-virtual {v1, v4}, Ljava/lang/Class;->getDeclaredField(Ljava/lang/String;)Ljava/lang/reflect/Field;

    move-result-object v1

    invoke-virtual {v1, v0}, Ljava/lang/reflect/Field;->getInt(Ljava/lang/Object;)I

    move-result v10

    .line 35
    new-instance v0, Lcom/genymobile/scrcpy/DisplayInfo;

    new-instance v7, Lcom/genymobile/scrcpy/Size;

    invoke-direct {v7, v2, v3}, Lcom/genymobile/scrcpy/Size;-><init>(II)V

    move-object v5, v0

    move v6, p1

    invoke-direct/range {v5 .. v10}, Lcom/genymobile/scrcpy/DisplayInfo;-><init>(ILcom/genymobile/scrcpy/Size;III)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-object v0

    :catch_0
    move-exception p1

    .line 37
    new-instance v0, Ljava/lang/AssertionError;

    invoke-direct {v0, p1}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw v0
.end method
