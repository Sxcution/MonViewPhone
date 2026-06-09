.class public final Lorg/slf4j/helpers/Util;
.super Ljava/lang/Object;
.source "Util.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lorg/slf4j/helpers/Util$ClassContextSecurityManager;
    }
.end annotation


# static fields
.field private static SECURITY_MANAGER:Lorg/slf4j/helpers/Util$ClassContextSecurityManager;

.field private static SECURITY_MANAGER_CREATION_ALREADY_ATTEMPTED:Z


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .line 5
    const/4 v0, 0x0

    sput-object v0, Lorg/slf4j/helpers/Util;->SECURITY_MANAGER:Lorg/slf4j/helpers/Util$ClassContextSecurityManager;

    .line 6
    const/4 v0, 0x0

    sput-boolean v0, Lorg/slf4j/helpers/Util;->SECURITY_MANAGER_CREATION_ALREADY_ATTEMPTED:Z

    return-void
.end method

.method private constructor <init>()V
    .registers 1

    .line 8
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 9
    return-void
.end method

.method public static getCallingClass()Ljava/lang/Class;
    .registers 4
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()",
            "Ljava/lang/Class<",
            "*>;"
        }
    .end annotation

    .line 64
    invoke-static {}, Lorg/slf4j/helpers/Util;->getSecurityManager()Lorg/slf4j/helpers/Util$ClassContextSecurityManager;

    move-result-object v0

    .line 65
    if-nez v0, :cond_8

    .line 66
    const/4 v0, 0x0

    return-object v0

    .line 68
    :cond_8
    invoke-virtual {v0}, Lorg/slf4j/helpers/Util$ClassContextSecurityManager;->getClassContext()[Ljava/lang/Class;

    move-result-object v0

    .line 69
    const-class v1, Lorg/slf4j/helpers/Util;

    invoke-virtual {v1}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v1

    .line 70
    const/4 v2, 0x0

    .line 71
    :goto_13
    array-length v3, v0

    if-ge v2, v3, :cond_25

    aget-object v3, v0, v2

    invoke-virtual {v3}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v1, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-nez v3, :cond_25

    .line 72
    add-int/lit8 v2, v2, 0x1

    goto :goto_13

    .line 74
    :cond_25
    array-length v1, v0

    if-ge v2, v1, :cond_30

    add-int/lit8 v2, v2, 0x2

    array-length v1, v0

    if-ge v2, v1, :cond_30

    .line 77
    aget-object v0, v0, v2

    return-object v0

    .line 75
    :cond_30
    new-instance v0, Ljava/lang/IllegalStateException;

    const-string v1, "Failed to find org.slf4j.helpers.Util or its caller in the stack; this should not happen"

    invoke-direct {v0, v1}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/String;)V

    throw v0
.end method

.method private static getSecurityManager()Lorg/slf4j/helpers/Util$ClassContextSecurityManager;
    .registers 2

    .line 41
    sget-object v0, Lorg/slf4j/helpers/Util;->SECURITY_MANAGER:Lorg/slf4j/helpers/Util$ClassContextSecurityManager;

    .line 42
    if-eqz v0, :cond_5

    .line 43
    return-object v0

    .line 45
    :cond_5
    sget-boolean v0, Lorg/slf4j/helpers/Util;->SECURITY_MANAGER_CREATION_ALREADY_ATTEMPTED:Z

    if-eqz v0, :cond_b

    .line 46
    const/4 v0, 0x0

    return-object v0

    .line 48
    :cond_b
    invoke-static {}, Lorg/slf4j/helpers/Util;->safeCreateSecurityManager()Lorg/slf4j/helpers/Util$ClassContextSecurityManager;

    move-result-object v0

    .line 49
    sput-object v0, Lorg/slf4j/helpers/Util;->SECURITY_MANAGER:Lorg/slf4j/helpers/Util$ClassContextSecurityManager;

    .line 50
    const/4 v1, 0x1

    sput-boolean v1, Lorg/slf4j/helpers/Util;->SECURITY_MANAGER_CREATION_ALREADY_ATTEMPTED:Z

    .line 51
    return-object v0
.end method

.method public static final report(Ljava/lang/String;)V
    .registers 4

    .line 87
    sget-object v0, Ljava/lang/System;->err:Ljava/io/PrintStream;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "SLF4J: "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/io/PrintStream;->println(Ljava/lang/String;)V

    .line 88
    return-void
.end method

.method public static final report(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 3

    .line 81
    sget-object v0, Ljava/lang/System;->err:Ljava/io/PrintStream;

    invoke-virtual {v0, p0}, Ljava/io/PrintStream;->println(Ljava/lang/String;)V

    .line 82
    sget-object p0, Ljava/lang/System;->err:Ljava/io/PrintStream;

    const-string v0, "Reported exception:"

    invoke-virtual {p0, v0}, Ljava/io/PrintStream;->println(Ljava/lang/String;)V

    .line 83
    invoke-virtual {p1}, Ljava/lang/Throwable;->printStackTrace()V

    .line 84
    return-void
.end method

.method private static safeCreateSecurityManager()Lorg/slf4j/helpers/Util$ClassContextSecurityManager;
    .registers 2

    .line 56
    const/4 v0, 0x0

    :try_start_1
    new-instance v1, Lorg/slf4j/helpers/Util$ClassContextSecurityManager;

    invoke-direct {v1, v0}, Lorg/slf4j/helpers/Util$ClassContextSecurityManager;-><init>(Lorg/slf4j/helpers/Util$1;)V
    :try_end_6
    .catch Ljava/lang/SecurityException; {:try_start_1 .. :try_end_6} :catch_7

    return-object v1

    .line 57
    :catch_7
    move-exception v1

    .line 58
    return-object v0
.end method

.method public static safeGetBooleanSystemProperty(Ljava/lang/String;)Z
    .registers 2

    .line 23
    invoke-static {p0}, Lorg/slf4j/helpers/Util;->safeGetSystemProperty(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p0

    .line 24
    if-nez p0, :cond_8

    .line 25
    const/4 p0, 0x0

    return p0

    .line 27
    :cond_8
    const-string v0, "true"

    invoke-virtual {p0, v0}, Ljava/lang/String;->equalsIgnoreCase(Ljava/lang/String;)Z

    move-result p0

    return p0
.end method

.method public static safeGetSystemProperty(Ljava/lang/String;)Ljava/lang/String;
    .registers 2

    .line 12
    if-eqz p0, :cond_a

    .line 16
    :try_start_2
    invoke-static {p0}, Ljava/lang/System;->getProperty(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p0
    :try_end_6
    .catch Ljava/lang/SecurityException; {:try_start_2 .. :try_end_6} :catch_7

    return-object p0

    .line 17
    :catch_7
    move-exception p0

    .line 18
    const/4 p0, 0x0

    return-object p0

    .line 13
    :cond_a
    new-instance p0, Ljava/lang/IllegalArgumentException;

    const-string v0, "null input"

    invoke-direct {p0, v0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0
.end method
