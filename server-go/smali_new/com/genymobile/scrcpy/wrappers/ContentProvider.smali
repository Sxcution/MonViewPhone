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
    .registers 5

    .line 31
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 32
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->manager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    .line 33
    iput-object p2, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    .line 34
    iput-object p3, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->name:Ljava/lang/String;

    .line 35
    iput-object p4, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->token:Landroid/os/IBinder;

    .line 36
    return-void
.end method

.method private call(Ljava/lang/String;Ljava/lang/String;Landroid/os/Bundle;)Landroid/os/Bundle;
    .registers 16

    .line 73
    const/4 v0, 0x0

    :try_start_1
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getCallMethod()Ljava/lang/reflect/Method;

    move-result-object v1

    .line 74
    iget v2, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethodVersion:I

    .line 75
    iget-object v3, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;
    :try_end_9
    .catch Ljava/lang/ClassNotFoundException; {:try_start_1 .. :try_end_9} :catch_61
    .catch Ljava/lang/IllegalAccessException; {:try_start_1 .. :try_end_9} :catch_5f
    .catch Ljava/lang/InstantiationException; {:try_start_1 .. :try_end_9} :catch_5d
    .catch Ljava/lang/NoSuchMethodException; {:try_start_1 .. :try_end_9} :catch_5b
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_1 .. :try_end_9} :catch_59

    const-string v4, "settings"

    const/4 v5, 0x5

    const/4 v6, 0x4

    const/4 v7, 0x3

    const/4 v8, 0x0

    const/4 v9, 0x2

    const/4 v10, 0x1

    if-eqz v2, :cond_41

    const-string v11, "com.android.shell"

    if-eq v2, v10, :cond_31

    if-eq v2, v9, :cond_24

    :try_start_19
    new-array v2, v6, [Ljava/lang/Object;

    aput-object v11, v2, v8

    aput-object p1, v2, v10

    aput-object p2, v2, v9

    aput-object p3, v2, v7

    goto :goto_52

    :cond_24
    new-array v2, v5, [Ljava/lang/Object;

    aput-object v11, v2, v8

    aput-object v4, v2, v10

    aput-object p1, v2, v9

    aput-object p2, v2, v7

    aput-object p3, v2, v6

    goto :goto_52

    :cond_31
    const/4 v2, 0x6

    new-array v2, v2, [Ljava/lang/Object;

    aput-object v11, v2, v8

    aput-object v0, v2, v10

    aput-object v4, v2, v9

    aput-object p1, v2, v7

    aput-object p2, v2, v6

    aput-object p3, v2, v5

    goto :goto_52

    :cond_41
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getAttributionSource()Ljava/lang/Object;

    move-result-object v2

    new-array v5, v5, [Ljava/lang/Object;

    aput-object v2, v5, v8

    aput-object v4, v5, v10

    aput-object p1, v5, v9

    aput-object p2, v5, v7

    aput-object p3, v5, v6

    move-object v2, v5

    :goto_52
    invoke-virtual {v1, v3, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Landroid/os/Bundle;
    :try_end_58
    .catch Ljava/lang/ClassNotFoundException; {:try_start_19 .. :try_end_58} :catch_61
    .catch Ljava/lang/IllegalAccessException; {:try_start_19 .. :try_end_58} :catch_5f
    .catch Ljava/lang/InstantiationException; {:try_start_19 .. :try_end_58} :catch_5d
    .catch Ljava/lang/NoSuchMethodException; {:try_start_19 .. :try_end_58} :catch_5b
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_19 .. :try_end_58} :catch_59

    return-object p1

    .line 76
    :catch_59
    move-exception p1

    goto :goto_62

    :catch_5b
    move-exception p1

    goto :goto_62

    :catch_5d
    move-exception p1

    goto :goto_62

    :catch_5f
    move-exception p1

    goto :goto_62

    :catch_61
    move-exception p1

    .line 77
    :goto_62
    const-string p2, "Could not invoke method"

    invoke-static {p2, p1}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 78
    return-object v0
.end method

.method private getAttributionSource()Ljava/lang/Object;
    .registers 7
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/IllegalAccessException;,
            Ljava/lang/NoSuchMethodException;,
            Ljava/lang/InstantiationException;,
            Ljava/lang/ClassNotFoundException;,
            Ljava/lang/reflect/InvocationTargetException;
        }
    .end annotation

    .line 62
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->attributionSource:Ljava/lang/Object;

    if-nez v0, :cond_47

    .line 63
    const-string v0, "android.content.AttributionSource$Builder"

    invoke-static {v0}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object v0

    .line 64
    const/4 v1, 0x1

    new-array v2, v1, [Ljava/lang/Class;

    sget-object v3, Ljava/lang/Integer;->TYPE:Ljava/lang/Class;

    const/4 v4, 0x0

    aput-object v3, v2, v4

    invoke-virtual {v0, v2}, Ljava/lang/Class;->getConstructor([Ljava/lang/Class;)Ljava/lang/reflect/Constructor;

    move-result-object v2

    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v3

    new-array v5, v1, [Ljava/lang/Object;

    aput-object v3, v5, v4

    invoke-virtual {v2, v5}, Ljava/lang/reflect/Constructor;->newInstance([Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v2

    .line 65
    new-array v3, v1, [Ljava/lang/Class;

    const-class v5, Ljava/lang/String;

    aput-object v5, v3, v4

    const-string v5, "setPackageName"

    invoke-virtual {v0, v5, v3}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v3

    new-array v1, v1, [Ljava/lang/Object;

    const-string v5, "com.android.shell"

    aput-object v5, v1, v4

    invoke-virtual {v3, v2, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    .line 66
    const-string v1, "build"

    new-array v3, v4, [Ljava/lang/Class;

    invoke-virtual {v0, v1, v3}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    new-array v1, v4, [Ljava/lang/Object;

    invoke-virtual {v0, v2, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->attributionSource:Ljava/lang/Object;

    .line 68
    :cond_47
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->attributionSource:Ljava/lang/Object;

    return-object v0
.end method

.method private getCallMethod()Ljava/lang/reflect/Method;
    .registers 11
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 39
    const-string v0, "call"

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    if-nez v1, :cond_93

    .line 43
    const/4 v1, 0x5

    const/4 v2, 0x4

    const/4 v3, 0x3

    const/4 v4, 0x2

    const/4 v5, 0x1

    const/4 v6, 0x0

    :try_start_c
    iget-object v7, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    invoke-virtual {v7}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v7

    const-string v8, "android.content.AttributionSource"

    invoke-static {v8}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object v8

    new-array v9, v1, [Ljava/lang/Class;

    aput-object v8, v9, v6

    const-class v8, Ljava/lang/String;

    aput-object v8, v9, v5

    aput-object v8, v9, v4

    aput-object v8, v9, v3

    const-class v8, Landroid/os/Bundle;

    aput-object v8, v9, v2

    invoke-virtual {v7, v0, v9}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v7

    iput-object v7, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    .line 44
    iput v6, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethodVersion:I
    :try_end_30
    .catch Ljava/lang/NoSuchMethodException; {:try_start_c .. :try_end_30} :catch_33
    .catch Ljava/lang/ClassNotFoundException; {:try_start_c .. :try_end_30} :catch_31

    .line 48
    goto :goto_52

    .line 49
    :catch_31
    move-exception v7

    goto :goto_54

    .line 45
    :catch_33
    move-exception v7

    .line 46
    :try_start_34
    iget-object v7, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    invoke-virtual {v7}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v7

    new-array v8, v1, [Ljava/lang/Class;

    const-class v9, Ljava/lang/String;

    aput-object v9, v8, v6

    aput-object v9, v8, v5

    aput-object v9, v8, v4

    aput-object v9, v8, v3

    const-class v9, Landroid/os/Bundle;

    aput-object v9, v8, v2

    invoke-virtual {v7, v0, v8}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v7

    iput-object v7, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    .line 47
    iput v4, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethodVersion:I
    :try_end_52
    .catch Ljava/lang/ClassNotFoundException; {:try_start_34 .. :try_end_52} :catch_31
    .catch Ljava/lang/NoSuchMethodException; {:try_start_34 .. :try_end_52} :catch_53

    .line 52
    :goto_52
    goto :goto_75

    .line 49
    :catch_53
    move-exception v7

    .line 50
    :goto_54
    :try_start_54
    iget-object v7, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    invoke-virtual {v7}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v7

    const/4 v8, 0x6

    new-array v8, v8, [Ljava/lang/Class;

    const-class v9, Ljava/lang/String;

    aput-object v9, v8, v6

    aput-object v9, v8, v5

    aput-object v9, v8, v4

    aput-object v9, v8, v3

    aput-object v9, v8, v2

    const-class v9, Landroid/os/Bundle;

    aput-object v9, v8, v1

    invoke-virtual {v7, v0, v8}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v1

    iput-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    .line 51
    iput v5, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethodVersion:I
    :try_end_75
    .catch Ljava/lang/NoSuchMethodException; {:try_start_54 .. :try_end_75} :catch_76

    .line 56
    :goto_75
    goto :goto_93

    .line 53
    :catch_76
    move-exception v1

    .line 54
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->provider:Ljava/lang/Object;

    invoke-virtual {v1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    new-array v2, v2, [Ljava/lang/Class;

    const-class v7, Ljava/lang/String;

    aput-object v7, v2, v6

    aput-object v7, v2, v5

    aput-object v7, v2, v4

    const-class v4, Landroid/os/Bundle;

    aput-object v4, v2, v3

    invoke-virtual {v1, v0, v2}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    .line 55
    iput v3, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethodVersion:I

    .line 58
    :cond_93
    :goto_93
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->callMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private static getGetMethod(Ljava/lang/String;)Ljava/lang/String;
    .registers 2

    .line 147
    new-instance p0, Ljava/lang/UnsupportedOperationException;

    const-string v0, "Method not decompiled: com.genymobile.scrcpy.wrappers.ContentProvider.getGetMethod(java.lang.String):java.lang.String"

    invoke-direct {p0, v0}, Ljava/lang/UnsupportedOperationException;-><init>(Ljava/lang/String;)V

    throw p0
.end method

.method private static getPutMethod(Ljava/lang/String;)Ljava/lang/String;
    .registers 2

    .line 210
    new-instance p0, Ljava/lang/UnsupportedOperationException;

    const-string v0, "Method not decompiled: com.genymobile.scrcpy.wrappers.ContentProvider.getPutMethod(java.lang.String):java.lang.String"

    invoke-direct {p0, v0}, Ljava/lang/UnsupportedOperationException;-><init>(Ljava/lang/String;)V

    throw p0
.end method


# virtual methods
.method public close()V
    .registers 4

    .line 84
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->manager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->name:Ljava/lang/String;

    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->token:Landroid/os/IBinder;

    invoke-virtual {v0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->removeContentProviderExternal(Ljava/lang/String;Landroid/os/IBinder;)V

    .line 85
    return-void
.end method

.method public getAndPutValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .registers 6

    .line 233
    invoke-virtual {p0, p1, p2}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getValue(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    .line 234
    invoke-virtual {p3, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-nez v1, :cond_d

    .line 235
    invoke-virtual {p0, p1, p2, p3}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->putValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V

    .line 237
    :cond_d
    return-object v0
.end method

.method public getValue(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .registers 6

    .line 214
    invoke-static {p1}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getGetMethod(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    .line 215
    new-instance v0, Landroid/os/Bundle;

    invoke-direct {v0}, Landroid/os/Bundle;-><init>()V

    .line 216
    const-string v1, "_user"

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/os/Bundle;->putInt(Ljava/lang/String;I)V

    .line 217
    invoke-direct {p0, p1, p2, v0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->call(Ljava/lang/String;Ljava/lang/String;Landroid/os/Bundle;)Landroid/os/Bundle;

    move-result-object p1

    .line 218
    if-nez p1, :cond_17

    .line 219
    const/4 p1, 0x0

    return-object p1

    .line 221
    :cond_17
    const-string p2, "value"

    invoke-virtual {p1, p2}, Landroid/os/Bundle;->getString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    return-object p1
.end method

.method public putValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .registers 7

    .line 225
    invoke-static {p1}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->getPutMethod(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    .line 226
    new-instance v0, Landroid/os/Bundle;

    invoke-direct {v0}, Landroid/os/Bundle;-><init>()V

    .line 227
    const-string v1, "_user"

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/os/Bundle;->putInt(Ljava/lang/String;I)V

    .line 228
    const-string v1, "value"

    invoke-virtual {v0, v1, p3}, Landroid/os/Bundle;->putString(Ljava/lang/String;Ljava/lang/String;)V

    .line 229
    invoke-direct {p0, p1, p2, v0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->call(Ljava/lang/String;Ljava/lang/String;Landroid/os/Bundle;)Landroid/os/Bundle;

    .line 230
    return-void
.end method
