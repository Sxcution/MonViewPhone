.class public Lorg/slf4j/helpers/NOPLogger;
.super Lorg/slf4j/helpers/MarkerIgnoringBase;
.source "NOPLogger.java"


# static fields
.field public static final NOP_LOGGER:Lorg/slf4j/helpers/NOPLogger;

.field private static final serialVersionUID:J = -0x72d8937e719b999L


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .line 5
    new-instance v0, Lorg/slf4j/helpers/NOPLogger;

    invoke-direct {v0}, Lorg/slf4j/helpers/NOPLogger;-><init>()V

    sput-object v0, Lorg/slf4j/helpers/NOPLogger;->NOP_LOGGER:Lorg/slf4j/helpers/NOPLogger;

    return-void
.end method

.method protected constructor <init>()V
    .registers 1

    .line 138
    invoke-direct {p0}, Lorg/slf4j/helpers/MarkerIgnoringBase;-><init>()V

    .line 139
    return-void
.end method


# virtual methods
.method public final debug(Ljava/lang/String;)V
    .registers 2

    .line 10
    return-void
.end method

.method public final debug(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 3

    .line 14
    return-void
.end method

.method public final debug(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 4

    .line 18
    return-void
.end method

.method public final debug(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 3

    .line 22
    return-void
.end method

.method public final varargs debug(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 3

    .line 26
    return-void
.end method

.method public final error(Ljava/lang/String;)V
    .registers 2

    .line 30
    return-void
.end method

.method public final error(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 3

    .line 34
    return-void
.end method

.method public final error(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 4

    .line 38
    return-void
.end method

.method public final error(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 3

    .line 42
    return-void
.end method

.method public final varargs error(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 3

    .line 46
    return-void
.end method

.method public getName()Ljava/lang/String;
    .registers 2

    .line 50
    const-string v0, "NOP"

    return-object v0
.end method

.method public final info(Ljava/lang/String;)V
    .registers 2

    .line 55
    return-void
.end method

.method public final info(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 3

    .line 59
    return-void
.end method

.method public final info(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 4

    .line 63
    return-void
.end method

.method public final info(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 3

    .line 67
    return-void
.end method

.method public final varargs info(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 3

    .line 71
    return-void
.end method

.method public final isDebugEnabled()Z
    .registers 2

    .line 75
    const/4 v0, 0x0

    return v0
.end method

.method public final isErrorEnabled()Z
    .registers 2

    .line 80
    const/4 v0, 0x0

    return v0
.end method

.method public final isInfoEnabled()Z
    .registers 2

    .line 85
    const/4 v0, 0x0

    return v0
.end method

.method public final isTraceEnabled()Z
    .registers 2

    .line 90
    const/4 v0, 0x0

    return v0
.end method

.method public final isWarnEnabled()Z
    .registers 2

    .line 95
    const/4 v0, 0x0

    return v0
.end method

.method public final trace(Ljava/lang/String;)V
    .registers 2

    .line 100
    return-void
.end method

.method public final trace(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 3

    .line 104
    return-void
.end method

.method public final trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 4

    .line 108
    return-void
.end method

.method public final trace(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 3

    .line 112
    return-void
.end method

.method public final varargs trace(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 3

    .line 116
    return-void
.end method

.method public final warn(Ljava/lang/String;)V
    .registers 2

    .line 120
    return-void
.end method

.method public final warn(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 3

    .line 124
    return-void
.end method

.method public final warn(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 4

    .line 128
    return-void
.end method

.method public final warn(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 3

    .line 132
    return-void
.end method

.method public final varargs warn(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 3

    .line 136
    return-void
.end method
