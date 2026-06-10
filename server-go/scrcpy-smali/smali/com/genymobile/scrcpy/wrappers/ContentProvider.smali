.class public Lcom/genymobile/scrcpy/wrappers/ContentProvider;
.super Ljava/lang/Object;
.source "ContentProvider.java"

# interfaces
.implements Ljava/io/Closeable;


# static fields
.field private static final CALL_METHOD_GET_GLOBAL:Ljava/lang/String; = "GET_global"

.field private static final CALL_METHOD_GET_SECURE:Ljava/lang/String; = "GET_secure"

.field private static final CALL_METHOD_GET_SYSTEM:Ljava/lang/String; = "GET_system"

.field private static final CALL_METHOD_PUT_GLOBAL:Ljava/lang/String; = "PUT_global"

.field private static final CALL_METHOD_PUT_SECURE:Ljava/lang/String; = "PUT_secure"

.field private static final CALL_METHOD_PUT_SYSTEM:Ljava/lang/String; = "PUT_system"

.field private static final CALL_METHOD_USER_KEY:Ljava/lang/String; = "_user"

.field private static final NAME_VALUE_TABLE_VALUE:Ljava/lang/String; = "value"

.field public static final TABLE_GLOBAL:Ljava/lang/String; = "global"

.field public static final TABLE_SECURE:Ljava/lang/String; = "secure"

.field public static final TABLE_SYSTEM:Ljava/lang/String; = "system"


# instance fields
.field private attributionSource:Ljava/lang/Object;

.field private callMethod:Ljava/lang/reflect/Method;

.field private callMethodVersion:I

.field private final manager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;

.field private final name:Ljava/lang/String;

.field private final provider:Ljava/lang/Object;

.field private final token:Landroid/os/IBinder;


# direct methods
.method constructor <init>(Lcom/genymobile/scrcpy/wrappers/ActivityManager;Ljava/lang/Object;Ljava/lang/String;Landroid/os/IBinder;)V
    .locals 0

    .line 43
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 44
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->manager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    .line 45
    iput-object p2, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    .line 46
    iput-object p3, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->name:Ljava/lang/String;

    .line 47
    iput-object p4, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->token:Landroid/os/IBinder;

    return-void
.end method

.method private call(Ljava/lang/String;Ljava/lang/String;Landroid/os/Bundle;)Landroid/os/Bundle;
    .locals 11

    const/4 v0, 0x0

    .line 92
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getCallMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    .line 94
    iget v2, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethodVersion:I
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_4
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_3
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/ClassNotFoundException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/InstantiationException; {:try_start_0 .. :try_end_0} :catch_0

    const-string v3, "settings"

    const/4 v4, 0x5

    const/4 v5, 0x3

    const/4 v6, 0x0

    const/4 v7, 0x4

    const/4 v8, 0x2

    const/4 v9, 0x1

    if-eqz v2, :cond_2

    const-string v10, "com.android.shell"

    if-eq v2, v9, :cond_1

    if-eq v2, v8, :cond_0

    :try_start_1
    new-array v2, v7, [Ljava/lang/Object;

    aput-object v10, v2, v6

    aput-object p1, v2, v9

    aput-object p2, v2, v8

    aput-object p3, v2, v5

    goto :goto_0

    :cond_0
    new-array v2, v4, [Ljava/lang/Object;

    aput-object v10, v2, v6

    aput-object v3, v2, v9

    aput-object p1, v2, v8

    aput-object p2, v2, v5

    aput-object p3, v2, v7

    goto :goto_0

    :cond_1
    const/4 v2, 0x6

    new-array v2, v2, [Ljava/lang/Object;

    aput-object v10, v2, v6

    aput-object v0, v2, v9

    aput-object v3, v2, v8

    aput-object p1, v2, v5

    aput-object p2, v2, v7

    aput-object p3, v2, v4

    goto :goto_0

    :cond_2
    new-array v2, v4, [Ljava/lang/Object;

    .line 96
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getAttributionSource()Ljava/lang/Object;

    move-result-object v4

    aput-object v4, v2, v6

    aput-object v3, v2, v9

    aput-object p1, v2, v8

    aput-object p2, v2, v5

    aput-object p3, v2, v7

    .line 108
    :goto_0
    iget-object p1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    invoke-virtual {v1, p1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Landroid/os/Bundle;
    :try_end_1
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_1} :catch_4
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1} :catch_2
    .catch Ljava/lang/ClassNotFoundException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Ljava/lang/InstantiationException; {:try_start_1 .. :try_end_1} :catch_0

    return-object p1

    :catch_0
    move-exception p1

    goto :goto_1

    :catch_1
    move-exception p1

    goto :goto_1

    :catch_2
    move-exception p1

    goto :goto_1

    :catch_3
    move-exception p1

    goto :goto_1

    :catch_4
    move-exception p1

    :goto_1
    const-string p2, "Could not invoke method"

    .line 110
    invoke-static {p2, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    return-object v0
.end method

.method private getAttributionSource()Ljava/lang/Object;
    .locals 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/ClassNotFoundException;,
            Ljava/lang/NoSuchMethodException;,
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/reflect/InvocationTargetException;,
            Ljava/lang/InstantiationException;
        }
    .end annotation

    .line 80
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->attributionSource:Ljava/lang/Object;

    if-nez v0, :cond_0

    const-string v0, "android.content.AttributionSource$Builder"

    .line 81
    invoke-static {v0}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x1

    new-array v2, v1, [Ljava/lang/Class;

    .line 82
    sget-object v3, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    const/4 v4, 0x0

    aput-object v3, v2, v4

    invoke-virtual {v0, v2}, Ljava/lang/Class;->getConstructor([Ljava/lang/Class;)Ljava/lang/reflect/Constructor;

    move-result-object v2

    new-array v3, v1, [Ljava/lang/Object;

    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v5

    aput-object v5, v3, v4

    invoke-virtual {v2, v3}, Ljava/lang/reflect/Constructor;->newInstance([Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v2

    new-array v3, v1, [Ljava/lang/Class;

    .line 83
    const-class v5, Ljava/lang/String;

    aput-object v5, v3, v4

    const-string v5, "setPackageName"

    invoke-virtual {v0, v5, v3}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v3

    new-array v1, v1, [Ljava/lang/Object;

    const-string v5, "com.android.shell"

    aput-object v5, v1, v4

    invoke-virtual {v3, v2, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    new-array v1, v4, [Ljava/lang/Class;

    const-string v3, "build"

    .line 84
    invoke-virtual {v0, v3, v1}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    new-array v1, v4, [Ljava/lang/Object;

    invoke-virtual {v0, v2, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->attributionSource:Ljava/lang/Object;

    .line 87
    :cond_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->attributionSource:Ljava/lang/Object;

    return-object v0
.end method

.method private getCallMethod()Ljava/lang/reflect/Method;
    .locals 10
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    const-string v0, "call"

    .line 52
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    if-nez v1, :cond_0

    const/4 v1, 0x5

    const/4 v2, 0x4

    const/4 v3, 0x3

    const/4 v4, 0x2

    const/4 v5, 0x1

    const/4 v6, 0x0

    :try_start_0
    const-string v7, "android.content.AttributionSource"

    .line 54
    invoke-static {v7}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object v7

    .line 55
    iget-object v8, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    invoke-virtual {v8}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v8

    new-array v9, v1, [Ljava/lang/Class;

    aput-object v7, v9, v6

    const-class v7, Ljava/lang/String;

    aput-object v7, v9, v5

    const-class v7, Ljava/lang/String;

    aput-object v7, v9, v4

    const-class v7, Ljava/lang/String;

    aput-object v7, v9, v3

    const-class v7, Landroid/os/Bundle;

    aput-object v7, v9, v2

    invoke-virtual {v8, v0, v9}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v7

    iput-object v7, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    .line 56
    iput v6, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethodVersion:I
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0
    .catch Ljava/lang/ClassNotFoundException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    .line 60
    :catch_0
    :try_start_1
    iget-object v7, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    invoke-virtual {v7}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v7

    const/4 v8, 0x6

    new-array v8, v8, [Ljava/lang/Class;

    const-class v9, Ljava/lang/String;

    aput-object v9, v8, v6

    const-class v9, Ljava/lang/String;

    aput-object v9, v8, v5

    const-class v9, Ljava/lang/String;

    aput-object v9, v8, v4

    const-class v9, Ljava/lang/String;

    aput-object v9, v8, v3

    const-class v9, Ljava/lang/String;

    aput-object v9, v8, v2

    const-class v9, Landroid/os/Bundle;

    aput-object v9, v8, v1

    .line 61
    invoke-virtual {v7, v0, v8}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v7

    iput-object v7, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    .line 62
    iput v5, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethodVersion:I
    :try_end_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_1} :catch_1

    goto :goto_0

    .line 65
    :catch_1
    :try_start_2
    iget-object v7, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    invoke-virtual {v7}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v7

    new-array v1, v1, [Ljava/lang/Class;

    const-class v8, Ljava/lang/String;

    aput-object v8, v1, v6

    const-class v8, Ljava/lang/String;

    aput-object v8, v1, v5

    const-class v8, Ljava/lang/String;

    aput-object v8, v1, v4

    const-class v8, Ljava/lang/String;

    aput-object v8, v1, v3

    const-class v8, Landroid/os/Bundle;

    aput-object v8, v1, v2

    invoke-virtual {v7, v0, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v1

    iput-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    .line 66
    iput v4, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethodVersion:I
    :try_end_2
    .catch Ljava/lang/NoSuchMethodException; {:try_start_2 .. :try_end_2} :catch_2

    goto :goto_0

    .line 68
    :catch_2
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    invoke-virtual {v1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    new-array v2, v2, [Ljava/lang/Class;

    const-class v7, Ljava/lang/String;

    aput-object v7, v2, v6

    const-class v6, Ljava/lang/String;

    aput-object v6, v2, v5

    const-class v5, Ljava/lang/String;

    aput-object v5, v2, v4

    const-class v4, Landroid/os/Bundle;

    aput-object v4, v2, v3

    invoke-virtual {v1, v0, v2}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    .line 69
    iput v3, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethodVersion:I

    .line 74
    :cond_0
    :goto_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private static getGetMethod(Ljava/lang/String;)Ljava/lang/String;
    .locals 4

    .line 120
    invoke-virtual {p0}, Ljava/lang/String;->hashCode()I

    move-result v0

    const v1, -0x4a16fc5d

    const/4 v2, 0x2

    const/4 v3, 0x1

    if-eq v0, v1, :cond_2

    const v1, -0x3604a489

    if-eq v0, v1, :cond_1

    const v1, -0x34e38dd1    # -1.0252847E7f

    if-eq v0, v1, :cond_0

    goto :goto_0

    :cond_0
    const-string v0, "system"

    invoke-virtual {p0, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_3

    const/4 v0, 0x1

    goto :goto_1

    :cond_1
    const-string v0, "secure"

    invoke-virtual {p0, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_3

    const/4 v0, 0x0

    goto :goto_1

    :cond_2
    const-string v0, "global"

    invoke-virtual {p0, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_3

    const/4 v0, 0x2

    goto :goto_1

    :cond_3
    :goto_0
    const/4 v0, -0x1

    :goto_1
    if-eqz v0, :cond_6

    if-eq v0, v3, :cond_5

    if-ne v0, v2, :cond_4

    const-string p0, "GET_global"

    return-object p0

    .line 128
    :cond_4
    new-instance v0, Ljava/lang/IllegalArgumentException;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Invalid table: "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-direct {v0, p0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw v0

    :cond_5
    const-string p0, "GET_system"

    return-object p0

    :cond_6
    const-string p0, "GET_secure"

    return-object p0
.end method

.method private static getPutMethod(Ljava/lang/String;)Ljava/lang/String;
    .locals 4

    .line 133
    invoke-virtual {p0}, Ljava/lang/String;->hashCode()I

    move-result v0

    const v1, -0x4a16fc5d

    const/4 v2, 0x2

    const/4 v3, 0x1

    if-eq v0, v1, :cond_2

    const v1, -0x3604a489

    if-eq v0, v1, :cond_1

    const v1, -0x34e38dd1    # -1.0252847E7f

    if-eq v0, v1, :cond_0

    goto :goto_0

    :cond_0
    const-string v0, "system"

    invoke-virtual {p0, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_3

    const/4 v0, 0x1

    goto :goto_1

    :cond_1
    const-string v0, "secure"

    invoke-virtual {p0, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_3

    const/4 v0, 0x0

    goto :goto_1

    :cond_2
    const-string v0, "global"

    invoke-virtual {p0, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_3

    const/4 v0, 0x2

    goto :goto_1

    :cond_3
    :goto_0
    const/4 v0, -0x1

    :goto_1
    if-eqz v0, :cond_6

    if-eq v0, v3, :cond_5

    if-ne v0, v2, :cond_4

    const-string p0, "PUT_global"

    return-object p0

    .line 141
    :cond_4
    new-instance v0, Ljava/lang/IllegalArgumentException;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Invalid table: "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-direct {v0, p0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw v0

    :cond_5
    const-string p0, "PUT_system"

    return-object p0

    :cond_6
    const-string p0, "PUT_secure"

    return-object p0
.end method


# virtual methods
.method public close()V
    .locals 3

    .line 116
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->manager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->name:Ljava/lang/String;

    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->token:Landroid/os/IBinder;

    invoke-virtual {v0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->removeContentProviderExternal(Ljava/lang/String;Landroid/os/IBinder;)V

    return-void
.end method

.method public getAndPutValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .locals 2

    .line 165
    invoke-virtual {p0, p1, p2}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getValue(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    .line 166
    invoke-virtual {p3, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-nez v1, :cond_0

    .line 167
    invoke-virtual {p0, p1, p2, p3}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->putValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V

    :cond_0
    return-object v0
.end method

.method public getValue(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .locals 3

    .line 146
    invoke-static {p1}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getGetMethod(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    .line 147
    new-instance v0, Landroid/os/Bundle;

    invoke-direct {v0}, Landroid/os/Bundle;-><init>()V

    const-string v1, "_user"

    const/4 v2, 0x0

    .line 148
    invoke-virtual {v0, v1, v2}, Landroid/os/Bundle;->putInt(Ljava/lang/String;I)V

    .line 149
    invoke-direct {p0, p1, p2, v0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->call(Ljava/lang/String;Ljava/lang/String;Landroid/os/Bundle;)Landroid/os/Bundle;

    move-result-object p1

    if-nez p1, :cond_0

    const/4 p1, 0x0

    return-object p1

    :cond_0
    const-string p2, "value"

    .line 153
    invoke-virtual {p1, p2}, Landroid/os/Bundle;->getString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    return-object p1
.end method

.method public putValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 3

    .line 157
    invoke-static {p1}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getPutMethod(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    .line 158
    new-instance v0, Landroid/os/Bundle;

    invoke-direct {v0}, Landroid/os/Bundle;-><init>()V

    const-string v1, "_user"

    const/4 v2, 0x0

    .line 159
    invoke-virtual {v0, v1, v2}, Landroid/os/Bundle;->putInt(Ljava/lang/String;I)V

    const-string v1, "value"

    .line 160
    invoke-virtual {v0, v1, p3}, Landroid/os/Bundle;->putString(Ljava/lang/String;Ljava/lang/String;)V

    .line 161
    invoke-direct {p0, p1, p2, v0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->call(Ljava/lang/String;Ljava/lang/String;Landroid/os/Bundle;)Landroid/os/Bundle;

    return-void
.end method
