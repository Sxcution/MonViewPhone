.class public Lcom/genymobile/scrcpy/wrappers/ClipboardManager;
.super Ljava/lang/Object;
.source "ClipboardManager.java"


# static fields
.field private static fakeContext:Landroid/content/Context;


# instance fields
.field private final manager:Landroid/os/IInterface;


# direct methods
.method public constructor <init>(Landroid/os/IInterface;)V
    .registers 2

    .line 15
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 16
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    .line 17
    return-void
.end method

.method private static getFakeContext()Landroid/content/Context;
    .registers 5

    .line 20
    sget-object v0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->fakeContext:Landroid/content/Context;

    if-nez v0, :cond_3c

    .line 22
    :try_start_4
    invoke-static {}, Landroid/os/Looper;->myLooper()Landroid/os/Looper;

    move-result-object v0

    if-nez v0, :cond_d

    .line 23
    invoke-static {}, Landroid/os/Looper;->prepare()V

    .line 25
    :cond_d
    const-string v0, "android.app.ActivityThread"

    invoke-static {v0}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object v0

    .line 26
    const-string v1, "systemMain"

    const/4 v2, 0x0

    new-array v3, v2, [Ljava/lang/Class;

    invoke-virtual {v0, v1, v3}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v1

    new-array v3, v2, [Ljava/lang/Object;

    const/4 v4, 0x0

    invoke-virtual {v1, v4, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    .line 27
    const-string v3, "getSystemContext"

    new-array v4, v2, [Ljava/lang/Class;

    invoke-virtual {v0, v3, v4}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    new-array v2, v2, [Ljava/lang/Object;

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/content/Context;

    sput-object v0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->fakeContext:Landroid/content/Context;
    :try_end_35
    .catchall {:try_start_4 .. :try_end_35} :catchall_36

    .line 30
    goto :goto_3c

    .line 28
    :catchall_36
    move-exception v0

    .line 29
    const-string v1, "Failed to create FakeContext"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 32
    :cond_3c
    :goto_3c
    sget-object v0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->fakeContext:Landroid/content/Context;

    return-object v0
.end method

.method private getPrimaryClip()Landroid/content/ClipData;
    .registers 16

    .line 36
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Class;->getMethods()[Ljava/lang/reflect/Method;

    move-result-object v0

    .line 38
    array-length v1, v0

    const/4 v2, 0x0

    .line 47
    invoke-static {v2}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v3

    .line 38
    const/4 v4, 0x0

    :goto_11
    const/4 v5, 0x0

    if-ge v4, v1, :cond_109

    aget-object v6, v0, v4

    .line 39
    const-string v7, "getPrimaryClip"

    invoke-virtual {v6}, Ljava/lang/reflect/Method;->getName()Ljava/lang/String;

    move-result-object v8

    invoke-virtual {v7, v8}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v7

    if-eqz v7, :cond_105

    .line 40
    invoke-virtual {v6}, Ljava/lang/reflect/Method;->getParameterTypes()[Ljava/lang/Class;

    move-result-object v7

    .line 42
    :try_start_26
    array-length v8, v7
    :try_end_27
    .catchall {:try_start_26 .. :try_end_27} :catchall_e7

    const/4 v9, 0x4

    const-string v10, "com.android.shell"

    const/4 v11, 0x3

    const/4 v12, 0x2

    const/4 v13, 0x1

    if-ne v8, v9, :cond_5e

    :try_start_2f
    aget-object v8, v7, v2

    const-class v14, Ljava/lang/String;

    if-ne v8, v14, :cond_5e

    aget-object v8, v7, v13

    const-class v14, Ljava/lang/String;

    if-ne v8, v14, :cond_5e

    aget-object v8, v7, v12

    invoke-direct {p0, v8}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v8

    if-eqz v8, :cond_5e

    aget-object v8, v7, v11

    invoke-direct {p0, v8}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v8

    if-eqz v8, :cond_5e

    .line 43
    iget-object v8, p0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v9, v9, [Ljava/lang/Object;

    aput-object v10, v9, v2

    aput-object v5, v9, v13

    aput-object v3, v9, v12

    aput-object v3, v9, v11

    invoke-virtual {v6, v8, v9}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v5

    check-cast v5, Landroid/content/ClipData;

    return-object v5

    .line 44
    :cond_5e
    array-length v8, v7

    if-ne v8, v11, :cond_86

    aget-object v8, v7, v2

    const-class v9, Ljava/lang/String;

    if-ne v8, v9, :cond_86

    aget-object v8, v7, v13

    const-class v9, Ljava/lang/String;

    if-ne v8, v9, :cond_86

    aget-object v8, v7, v12

    invoke-direct {p0, v8}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v8

    if-eqz v8, :cond_86

    .line 45
    iget-object v8, p0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v9, v11, [Ljava/lang/Object;

    aput-object v10, v9, v2

    aput-object v5, v9, v13

    aput-object v3, v9, v12

    invoke-virtual {v6, v8, v9}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v5

    check-cast v5, Landroid/content/ClipData;

    return-object v5

    .line 46
    :cond_86
    array-length v5, v7

    if-ne v5, v12, :cond_a6

    aget-object v5, v7, v2

    const-class v8, Ljava/lang/String;

    if-ne v5, v8, :cond_a6

    aget-object v5, v7, v13

    invoke-direct {p0, v5}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v5

    if-eqz v5, :cond_a6

    .line 47
    iget-object v5, p0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v12, [Ljava/lang/Object;

    aput-object v10, v8, v2

    aput-object v3, v8, v13

    invoke-virtual {v6, v5, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v5

    check-cast v5, Landroid/content/ClipData;

    return-object v5

    .line 48
    :cond_a6
    array-length v5, v7

    if-ne v5, v13, :cond_bc

    aget-object v5, v7, v2

    const-class v8, Ljava/lang/String;

    if-ne v5, v8, :cond_bc

    .line 49
    iget-object v5, p0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v13, [Ljava/lang/Object;

    aput-object v10, v8, v2

    invoke-virtual {v6, v5, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v5

    check-cast v5, Landroid/content/ClipData;

    return-object v5

    .line 50
    :cond_bc
    array-length v5, v7

    if-ne v5, v11, :cond_e6

    aget-object v5, v7, v2

    const-class v8, Ljava/lang/String;

    if-ne v5, v8, :cond_e6

    aget-object v5, v7, v13

    invoke-direct {p0, v5}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v5

    if-eqz v5, :cond_e6

    aget-object v5, v7, v12

    invoke-direct {p0, v5}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v5

    if-eqz v5, :cond_e6

    .line 52
    iget-object v5, p0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v11, [Ljava/lang/Object;

    aput-object v10, v8, v2

    aput-object v3, v8, v13

    aput-object v3, v8, v12

    invoke-virtual {v6, v5, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v5

    check-cast v5, Landroid/content/ClipData;
    :try_end_e5
    .catchall {:try_start_2f .. :try_end_e5} :catchall_e7

    return-object v5

    .line 56
    :cond_e6
    goto :goto_105

    .line 54
    :catchall_e7
    move-exception v5

    .line 55
    new-instance v6, Ljava/lang/StringBuilder;

    invoke-direct {v6}, Ljava/lang/StringBuilder;-><init>()V

    const-string v8, "Failed invoking getPrimaryClip("

    invoke-virtual {v6, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v6

    array-length v7, v7

    invoke-virtual {v6, v7}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v6

    const-string v7, " args)"

    invoke-virtual {v6, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v6

    invoke-virtual {v6}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v6

    invoke-static {v6, v5}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 38
    :cond_105
    :goto_105
    add-int/lit8 v4, v4, 0x1

    goto/16 :goto_11

    .line 61
    :cond_109
    :try_start_109
    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->getFakeContext()Landroid/content/Context;

    move-result-object v0

    .line 62
    if-eqz v0, :cond_11e

    .line 63
    const-string v1, "clipboard"

    invoke-virtual {v0, v1}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/content/ClipboardManager;

    .line 64
    if-eqz v0, :cond_11e

    .line 65
    invoke-virtual {v0}, Landroid/content/ClipboardManager;->getPrimaryClip()Landroid/content/ClipData;

    move-result-object v0
    :try_end_11d
    .catchall {:try_start_109 .. :try_end_11d} :catchall_11f

    return-object v0

    .line 70
    :cond_11e
    goto :goto_125

    .line 68
    :catchall_11f
    move-exception v0

    .line 69
    const-string v1, "Failed invoking getPrimaryClip via FakeContext"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 72
    :goto_125
    const-string v0, "No matching getPrimaryClip method found"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 73
    return-object v5
.end method

.method private isInt(Ljava/lang/Class;)Z
    .registers 3
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/Class<",
            "*>;)Z"
        }
    .end annotation

    .line 201
    sget-object v0, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    if-eq p1, v0, :cond_b

    sget-object v0, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    if-ne p1, v0, :cond_9

    goto :goto_b

    :cond_9
    const/4 p1, 0x0

    goto :goto_c

    :cond_b
    :goto_b
    const/4 p1, 0x1

    :goto_c
    return p1
.end method

.method private setPrimaryClip(Landroid/content/ClipData;)Z
    .registers 20

    .line 77
    move-object/from16 v1, p0

    move-object/from16 v2, p1

    iget-object v0, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Class;->getMethods()[Ljava/lang/reflect/Method;

    move-result-object v3

    .line 79
    array-length v4, v3

    const/4 v5, 0x0

    .line 90
    invoke-static {v5}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v6

    .line 79
    const/4 v7, 0x0

    :goto_15
    if-ge v7, v4, :cond_134

    aget-object v8, v3, v7

    .line 80
    const-string v9, "setPrimaryClip"

    invoke-virtual {v8}, Ljava/lang/reflect/Method;->getName()Ljava/lang/String;

    move-result-object v10

    invoke-virtual {v9, v10}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v9

    if-eqz v9, :cond_12d

    .line 81
    invoke-virtual {v8}, Ljava/lang/reflect/Method;->getParameterTypes()[Ljava/lang/Class;

    move-result-object v9

    .line 83
    :try_start_29
    array-length v10, v9
    :try_end_2a
    .catchall {:try_start_29 .. :try_end_2a} :catchall_10c

    const/4 v11, 0x0

    const/4 v12, 0x5

    const-string v13, "com.android.shell"

    const/4 v14, 0x4

    const/4 v15, 0x3

    const/16 v16, 0x1

    const/4 v0, 0x2

    if-ne v10, v12, :cond_6b

    :try_start_35
    aget-object v10, v9, v5
    :try_end_37
    .catchall {:try_start_35 .. :try_end_37} :catchall_10c

    const/16 v17, 0x0

    :try_start_39
    const-class v5, Landroid/content/ClipData;

    if-ne v10, v5, :cond_6d

    aget-object v5, v9, v16

    const-class v10, Ljava/lang/String;

    if-ne v5, v10, :cond_6d

    aget-object v5, v9, v0

    const-class v10, Ljava/lang/String;

    if-ne v5, v10, :cond_6d

    aget-object v5, v9, v15

    invoke-direct {v1, v5}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v5

    if-eqz v5, :cond_6d

    aget-object v5, v9, v14

    invoke-direct {v1, v5}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v5

    if-eqz v5, :cond_6d

    .line 84
    iget-object v5, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v10, v12, [Ljava/lang/Object;

    aput-object v2, v10, v17

    aput-object v13, v10, v16

    aput-object v11, v10, v0

    aput-object v6, v10, v15

    aput-object v6, v10, v14

    invoke-virtual {v8, v5, v10}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 85
    return v16

    .line 83
    :cond_6b
    const/16 v17, 0x0

    .line 86
    :cond_6d
    array-length v5, v9

    if-ne v5, v14, :cond_9a

    aget-object v5, v9, v17

    const-class v10, Landroid/content/ClipData;

    if-ne v5, v10, :cond_9a

    aget-object v5, v9, v16

    const-class v10, Ljava/lang/String;

    if-ne v5, v10, :cond_9a

    aget-object v5, v9, v0

    const-class v10, Ljava/lang/String;

    if-ne v5, v10, :cond_9a

    aget-object v5, v9, v15

    invoke-direct {v1, v5}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v5

    if-eqz v5, :cond_9a

    .line 87
    iget-object v5, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v10, v14, [Ljava/lang/Object;

    aput-object v2, v10, v17

    aput-object v13, v10, v16

    aput-object v11, v10, v0

    aput-object v6, v10, v15

    invoke-virtual {v8, v5, v10}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 88
    return v16

    .line 89
    :cond_9a
    array-length v5, v9

    if-ne v5, v15, :cond_bf

    aget-object v5, v9, v17

    const-class v10, Landroid/content/ClipData;

    if-ne v5, v10, :cond_bf

    aget-object v5, v9, v16

    const-class v10, Ljava/lang/String;

    if-ne v5, v10, :cond_bf

    aget-object v5, v9, v0

    invoke-direct {v1, v5}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v5

    if-eqz v5, :cond_bf

    .line 90
    iget-object v5, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v10, v15, [Ljava/lang/Object;

    aput-object v2, v10, v17

    aput-object v13, v10, v16

    aput-object v6, v10, v0

    invoke-virtual {v8, v5, v10}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 91
    return v16

    .line 92
    :cond_bf
    array-length v5, v9

    if-ne v5, v0, :cond_da

    aget-object v5, v9, v17

    const-class v10, Landroid/content/ClipData;

    if-ne v5, v10, :cond_da

    aget-object v5, v9, v16

    const-class v10, Ljava/lang/String;

    if-ne v5, v10, :cond_da

    .line 93
    iget-object v5, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v0, v0, [Ljava/lang/Object;

    aput-object v2, v0, v17

    aput-object v13, v0, v16

    invoke-virtual {v8, v5, v0}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 94
    return v16

    .line 95
    :cond_da
    array-length v5, v9

    if-ne v5, v14, :cond_109

    aget-object v5, v9, v17

    const-class v10, Landroid/content/ClipData;

    if-ne v5, v10, :cond_109

    aget-object v5, v9, v16

    const-class v10, Ljava/lang/String;

    if-ne v5, v10, :cond_109

    aget-object v5, v9, v0

    invoke-direct {v1, v5}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v5

    if-eqz v5, :cond_109

    aget-object v5, v9, v15

    invoke-direct {v1, v5}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v5

    if-eqz v5, :cond_109

    .line 97
    iget-object v5, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v10, v14, [Ljava/lang/Object;

    aput-object v2, v10, v17

    aput-object v13, v10, v16

    aput-object v6, v10, v0

    aput-object v6, v10, v15

    invoke-virtual {v8, v5, v10}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_108
    .catchall {:try_start_39 .. :try_end_108} :catchall_10a

    .line 98
    return v16

    .line 102
    :cond_109
    goto :goto_12f

    .line 100
    :catchall_10a
    move-exception v0

    goto :goto_10f

    :catchall_10c
    move-exception v0

    const/16 v17, 0x0

    .line 101
    :goto_10f
    new-instance v5, Ljava/lang/StringBuilder;

    invoke-direct {v5}, Ljava/lang/StringBuilder;-><init>()V

    const-string v8, "Failed invoking setPrimaryClip("

    invoke-virtual {v5, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v5

    array-length v8, v9

    invoke-virtual {v5, v8}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v5

    const-string v8, " args)"

    invoke-virtual {v5, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v5

    invoke-virtual {v5}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v5

    invoke-static {v5, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    goto :goto_12f

    .line 80
    :cond_12d
    const/16 v17, 0x0

    .line 79
    :goto_12f
    add-int/lit8 v7, v7, 0x1

    const/4 v5, 0x0

    goto/16 :goto_15

    .line 107
    :cond_134
    const/16 v16, 0x1

    const/16 v17, 0x0

    :try_start_138
    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->getFakeContext()Landroid/content/Context;

    move-result-object v0

    .line 108
    if-eqz v0, :cond_14c

    .line 109
    const-string v3, "clipboard"

    invoke-virtual {v0, v3}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/content/ClipboardManager;

    .line 110
    if-eqz v0, :cond_14c

    .line 111
    invoke-virtual {v0, v2}, Landroid/content/ClipboardManager;->setPrimaryClip(Landroid/content/ClipData;)V
    :try_end_14b
    .catchall {:try_start_138 .. :try_end_14b} :catchall_14d

    .line 112
    return v16

    .line 117
    :cond_14c
    goto :goto_153

    .line 115
    :catchall_14d
    move-exception v0

    .line 116
    const-string v2, "Failed invoking setPrimaryClip via FakeContext"

    invoke-static {v2, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 119
    :goto_153
    const-string v0, "No matching setPrimaryClip method found"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 120
    return v17
.end method


# virtual methods
.method public addPrimaryClipChangedListener(Landroid/content/IOnPrimaryClipChangedListener;)Z
    .registers 19

    .line 136
    move-object/from16 v1, p0

    iget-object v0, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Class;->getMethods()[Ljava/lang/reflect/Method;

    move-result-object v2

    .line 138
    array-length v3, v2

    const/4 v4, 0x0

    .line 149
    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v5

    .line 138
    const/4 v6, 0x0

    :goto_13
    if-ge v6, v3, :cond_131

    aget-object v0, v2, v6

    .line 139
    const-string v7, "addPrimaryClipChangedListener"

    invoke-virtual {v0}, Ljava/lang/reflect/Method;->getName()Ljava/lang/String;

    move-result-object v8

    invoke-virtual {v7, v8}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v7

    if-eqz v7, :cond_12a

    .line 140
    invoke-virtual {v0}, Ljava/lang/reflect/Method;->getParameterTypes()[Ljava/lang/Class;

    move-result-object v7

    .line 142
    :try_start_27
    array-length v8, v7
    :try_end_28
    .catchall {:try_start_27 .. :try_end_28} :catchall_109

    const/4 v9, 0x0

    const/4 v10, 0x5

    const-string v11, "com.android.shell"

    const/4 v12, 0x4

    const/4 v13, 0x3

    const/4 v14, 0x2

    const/4 v15, 0x1

    if-ne v8, v10, :cond_68

    :try_start_32
    aget-object v8, v7, v4
    :try_end_34
    .catchall {:try_start_32 .. :try_end_34} :catchall_109

    const/16 v16, 0x0

    :try_start_36
    const-class v4, Landroid/content/IOnPrimaryClipChangedListener;

    if-ne v8, v4, :cond_6a

    aget-object v4, v7, v15

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_6a

    aget-object v4, v7, v14

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_6a

    aget-object v4, v7, v13

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_6a

    aget-object v4, v7, v12

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_6a

    .line 143
    iget-object v4, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v10, [Ljava/lang/Object;

    aput-object p1, v8, v16

    aput-object v11, v8, v15

    aput-object v9, v8, v14

    aput-object v5, v8, v13

    aput-object v5, v8, v12

    invoke-virtual {v0, v4, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 144
    return v15

    .line 142
    :cond_68
    const/16 v16, 0x0

    .line 145
    :cond_6a
    array-length v4, v7

    if-ne v4, v12, :cond_97

    aget-object v4, v7, v16

    const-class v8, Landroid/content/IOnPrimaryClipChangedListener;

    if-ne v4, v8, :cond_97

    aget-object v4, v7, v15

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_97

    aget-object v4, v7, v14

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_97

    aget-object v4, v7, v13

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_97

    .line 146
    iget-object v4, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v12, [Ljava/lang/Object;

    aput-object p1, v8, v16

    aput-object v11, v8, v15

    aput-object v9, v8, v14

    aput-object v5, v8, v13

    invoke-virtual {v0, v4, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 147
    return v15

    .line 148
    :cond_97
    array-length v4, v7

    if-ne v4, v13, :cond_bc

    aget-object v4, v7, v16

    const-class v8, Landroid/content/IOnPrimaryClipChangedListener;

    if-ne v4, v8, :cond_bc

    aget-object v4, v7, v15

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_bc

    aget-object v4, v7, v14

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_bc

    .line 149
    iget-object v4, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v13, [Ljava/lang/Object;

    aput-object p1, v8, v16

    aput-object v11, v8, v15

    aput-object v5, v8, v14

    invoke-virtual {v0, v4, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 150
    return v15

    .line 151
    :cond_bc
    array-length v4, v7

    if-ne v4, v14, :cond_d7

    aget-object v4, v7, v16

    const-class v8, Landroid/content/IOnPrimaryClipChangedListener;

    if-ne v4, v8, :cond_d7

    aget-object v4, v7, v15

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_d7

    .line 152
    iget-object v4, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v14, [Ljava/lang/Object;

    aput-object p1, v8, v16

    aput-object v11, v8, v15

    invoke-virtual {v0, v4, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 153
    return v15

    .line 154
    :cond_d7
    array-length v4, v7

    if-ne v4, v12, :cond_106

    aget-object v4, v7, v16

    const-class v8, Landroid/content/IOnPrimaryClipChangedListener;

    if-ne v4, v8, :cond_106

    aget-object v4, v7, v15

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_106

    aget-object v4, v7, v14

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_106

    aget-object v4, v7, v13

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_106

    .line 155
    iget-object v4, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v12, [Ljava/lang/Object;

    aput-object p1, v8, v16

    aput-object v11, v8, v15

    aput-object v5, v8, v14

    aput-object v5, v8, v13

    invoke-virtual {v0, v4, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_105
    .catchall {:try_start_36 .. :try_end_105} :catchall_107

    .line 156
    return v15

    .line 160
    :cond_106
    goto :goto_12c

    .line 158
    :catchall_107
    move-exception v0

    goto :goto_10c

    :catchall_109
    move-exception v0

    const/16 v16, 0x0

    .line 159
    :goto_10c
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    const-string v8, "Failed invoking addPrimaryClipChangedListener("

    invoke-virtual {v4, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    array-length v7, v7

    invoke-virtual {v4, v7}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v4

    const-string v7, " args)"

    invoke-virtual {v4, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    invoke-static {v4, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    goto :goto_12c

    .line 139
    :cond_12a
    const/16 v16, 0x0

    .line 138
    :goto_12c
    add-int/lit8 v6, v6, 0x1

    const/4 v4, 0x0

    goto/16 :goto_13

    .line 164
    :cond_131
    const/16 v16, 0x0

    const-string v0, "No matching addPrimaryClipChangedListener method found"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 165
    return v16
.end method

.method public getText()Ljava/lang/CharSequence;
    .registers 3

    .line 124
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->getPrimaryClip()Landroid/content/ClipData;

    move-result-object v0

    .line 125
    if-eqz v0, :cond_16

    invoke-virtual {v0}, Landroid/content/ClipData;->getItemCount()I

    move-result v1

    if-lez v1, :cond_16

    .line 126
    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Landroid/content/ClipData;->getItemAt(I)Landroid/content/ClipData$Item;

    move-result-object v0

    invoke-virtual {v0}, Landroid/content/ClipData$Item;->getText()Ljava/lang/CharSequence;

    move-result-object v0

    return-object v0

    .line 128
    :cond_16
    const/4 v0, 0x0

    return-object v0
.end method

.method public removePrimaryClipChangedListener(Landroid/content/IOnPrimaryClipChangedListener;)Z
    .registers 19

    .line 169
    move-object/from16 v1, p0

    iget-object v0, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Class;->getMethods()[Ljava/lang/reflect/Method;

    move-result-object v2

    .line 171
    array-length v3, v2

    const/4 v4, 0x0

    .line 182
    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v5

    .line 171
    const/4 v6, 0x0

    :goto_13
    if-ge v6, v3, :cond_131

    aget-object v0, v2, v6

    .line 172
    const-string v7, "removePrimaryClipChangedListener"

    invoke-virtual {v0}, Ljava/lang/reflect/Method;->getName()Ljava/lang/String;

    move-result-object v8

    invoke-virtual {v7, v8}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v7

    if-eqz v7, :cond_12a

    .line 173
    invoke-virtual {v0}, Ljava/lang/reflect/Method;->getParameterTypes()[Ljava/lang/Class;

    move-result-object v7

    .line 175
    :try_start_27
    array-length v8, v7
    :try_end_28
    .catchall {:try_start_27 .. :try_end_28} :catchall_109

    const/4 v9, 0x0

    const/4 v10, 0x5

    const-string v11, "com.android.shell"

    const/4 v12, 0x4

    const/4 v13, 0x3

    const/4 v14, 0x2

    const/4 v15, 0x1

    if-ne v8, v10, :cond_68

    :try_start_32
    aget-object v8, v7, v4
    :try_end_34
    .catchall {:try_start_32 .. :try_end_34} :catchall_109

    const/16 v16, 0x0

    :try_start_36
    const-class v4, Landroid/content/IOnPrimaryClipChangedListener;

    if-ne v8, v4, :cond_6a

    aget-object v4, v7, v15

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_6a

    aget-object v4, v7, v14

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_6a

    aget-object v4, v7, v13

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_6a

    aget-object v4, v7, v12

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_6a

    .line 176
    iget-object v4, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v10, [Ljava/lang/Object;

    aput-object p1, v8, v16

    aput-object v11, v8, v15

    aput-object v9, v8, v14

    aput-object v5, v8, v13

    aput-object v5, v8, v12

    invoke-virtual {v0, v4, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 177
    return v15

    .line 175
    :cond_68
    const/16 v16, 0x0

    .line 178
    :cond_6a
    array-length v4, v7

    if-ne v4, v12, :cond_97

    aget-object v4, v7, v16

    const-class v8, Landroid/content/IOnPrimaryClipChangedListener;

    if-ne v4, v8, :cond_97

    aget-object v4, v7, v15

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_97

    aget-object v4, v7, v14

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_97

    aget-object v4, v7, v13

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_97

    .line 179
    iget-object v4, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v12, [Ljava/lang/Object;

    aput-object p1, v8, v16

    aput-object v11, v8, v15

    aput-object v9, v8, v14

    aput-object v5, v8, v13

    invoke-virtual {v0, v4, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 180
    return v15

    .line 181
    :cond_97
    array-length v4, v7

    if-ne v4, v13, :cond_bc

    aget-object v4, v7, v16

    const-class v8, Landroid/content/IOnPrimaryClipChangedListener;

    if-ne v4, v8, :cond_bc

    aget-object v4, v7, v15

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_bc

    aget-object v4, v7, v14

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_bc

    .line 182
    iget-object v4, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v13, [Ljava/lang/Object;

    aput-object p1, v8, v16

    aput-object v11, v8, v15

    aput-object v5, v8, v14

    invoke-virtual {v0, v4, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 183
    return v15

    .line 184
    :cond_bc
    array-length v4, v7

    if-ne v4, v14, :cond_d7

    aget-object v4, v7, v16

    const-class v8, Landroid/content/IOnPrimaryClipChangedListener;

    if-ne v4, v8, :cond_d7

    aget-object v4, v7, v15

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_d7

    .line 185
    iget-object v4, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v14, [Ljava/lang/Object;

    aput-object p1, v8, v16

    aput-object v11, v8, v15

    invoke-virtual {v0, v4, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 186
    return v15

    .line 187
    :cond_d7
    array-length v4, v7

    if-ne v4, v12, :cond_106

    aget-object v4, v7, v16

    const-class v8, Landroid/content/IOnPrimaryClipChangedListener;

    if-ne v4, v8, :cond_106

    aget-object v4, v7, v15

    const-class v8, Ljava/lang/String;

    if-ne v4, v8, :cond_106

    aget-object v4, v7, v14

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_106

    aget-object v4, v7, v13

    invoke-direct {v1, v4}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->isInt(Ljava/lang/Class;)Z

    move-result v4

    if-eqz v4, :cond_106

    .line 188
    iget-object v4, v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->manager:Landroid/os/IInterface;

    new-array v8, v12, [Ljava/lang/Object;

    aput-object p1, v8, v16

    aput-object v11, v8, v15

    aput-object v5, v8, v14

    aput-object v5, v8, v13

    invoke-virtual {v0, v4, v8}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_105
    .catchall {:try_start_36 .. :try_end_105} :catchall_107

    .line 189
    return v15

    .line 193
    :cond_106
    goto :goto_12c

    .line 191
    :catchall_107
    move-exception v0

    goto :goto_10c

    :catchall_109
    move-exception v0

    const/16 v16, 0x0

    .line 192
    :goto_10c
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    const-string v8, "Failed invoking removePrimaryClipChangedListener("

    invoke-virtual {v4, v8}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    array-length v7, v7

    invoke-virtual {v4, v7}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v4

    const-string v7, " args)"

    invoke-virtual {v4, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    invoke-static {v4, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    goto :goto_12c

    .line 172
    :cond_12a
    const/16 v16, 0x0

    .line 171
    :goto_12c
    add-int/lit8 v6, v6, 0x1

    const/4 v4, 0x0

    goto/16 :goto_13

    .line 197
    :cond_131
    const/16 v16, 0x0

    return v16
.end method

.method public setText(Ljava/lang/CharSequence;)Z
    .registers 3

    .line 132
    const/4 v0, 0x0

    invoke-static {v0, p1}, Landroid/content/ClipData;->newPlainText(Ljava/lang/CharSequence;Ljava/lang/CharSequence;)Landroid/content/ClipData;

    move-result-object p1

    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->setPrimaryClip(Landroid/content/ClipData;)Z

    move-result p1

    return p1
.end method
