.class final Luk/uuid/slf4j/android/LogAdapter;
.super Ljava/lang/Object;
.source "LogAdapter.java"

# interfaces
.implements Lorg/slf4j/Logger;


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Luk/uuid/slf4j/android/LogAdapter$AnonymousClass1;
    }
.end annotation


# static fields
.field private static final DIRECT_FRAMES:I = 0x2

.field private static final FORMAT_FRAMES:I = 0x3

.field private static final nativeLevelMap:Ljava/util/concurrent/ConcurrentMap;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/concurrent/ConcurrentMap<",
            "Ljava/lang/String;",
            "Luk/uuid/slf4j/android/LogLevel;",
            ">;"
        }
    .end annotation
.end field


# instance fields
.field private final DEBUG:Z

.field private final ERROR:Z

.field private final INFO:Z

.field private final TRACE:Z

.field private final WARN:Z

.field private final complexRewriteMsg:Z

.field private final name:Ljava/lang/String;

.field private final prefixName:Ljava/lang/String;

.field private final showCaller:Z

.field private final showThread:Z

.field private final tag:Ljava/lang/String;


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .line 16
    new-instance v0, Ljava/util/concurrent/ConcurrentHashMap;

    invoke-direct {v0}, Ljava/util/concurrent/ConcurrentHashMap;-><init>()V

    sput-object v0, Luk/uuid/slf4j/android/LogAdapter;->nativeLevelMap:Ljava/util/concurrent/ConcurrentMap;

    return-void
.end method

.method constructor <init>(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V
    .registers 9

    .line 29
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 30
    iput-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->name:Ljava/lang/String;

    .line 31
    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    iput-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    .line 32
    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->NATIVE:Luk/uuid/slf4j/android/LogLevel;

    if-ne v0, v1, :cond_15

    .line 33
    invoke-direct {p0}, Luk/uuid/slf4j/android/LogAdapter;->getNativeLogLevel()Luk/uuid/slf4j/android/LogLevel;

    move-result-object v0

    iput-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    .line 35
    :cond_15
    nop

    .line 36
    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->VERBOSE:Luk/uuid/slf4j/android/LogLevel;

    const/4 v2, 0x1

    const/4 v3, 0x0

    if-ne v0, v1, :cond_20

    const/4 v0, 0x1

    goto :goto_21

    :cond_20
    const/4 v0, 0x0

    .line 37
    :goto_21
    iput-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    .line 38
    if-nez v0, :cond_2e

    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->DEBUG:Luk/uuid/slf4j/android/LogLevel;

    if-ne v0, v1, :cond_2c

    goto :goto_2e

    :cond_2c
    const/4 v0, 0x0

    goto :goto_2f

    :cond_2e
    :goto_2e
    const/4 v0, 0x1

    .line 39
    :goto_2f
    iput-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    .line 40
    if-nez v0, :cond_3c

    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->INFO:Luk/uuid/slf4j/android/LogLevel;

    if-ne v0, v1, :cond_3a

    goto :goto_3c

    :cond_3a
    const/4 v0, 0x0

    goto :goto_3d

    :cond_3c
    :goto_3c
    const/4 v0, 0x1

    .line 41
    :goto_3d
    iput-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    .line 42
    if-nez v0, :cond_4a

    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->WARN:Luk/uuid/slf4j/android/LogLevel;

    if-ne v0, v1, :cond_48

    goto :goto_4a

    :cond_48
    const/4 v0, 0x0

    goto :goto_4b

    :cond_4a
    :goto_4a
    const/4 v0, 0x1

    .line 43
    :goto_4b
    iput-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    .line 44
    if-nez v0, :cond_58

    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->ERROR:Luk/uuid/slf4j/android/LogLevel;

    if-ne v0, v1, :cond_56

    goto :goto_58

    :cond_56
    const/4 v0, 0x0

    goto :goto_59

    :cond_58
    :goto_58
    const/4 v0, 0x1

    :goto_59
    iput-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    .line 45
    sget-object v0, Luk/uuid/slf4j/android/LogAdapter$AnonymousClass1;->$SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName:[I

    iget-object v1, p2, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    invoke-virtual {v1}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->ordinal()I

    move-result v1

    aget v0, v0, v1

    .line 46
    const/4 v1, 0x0

    if-ne v0, v2, :cond_6d

    .line 47
    iput-object v1, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 48
    iput-boolean v2, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    goto :goto_a6

    .line 49
    :cond_6d
    const/4 v4, 0x2

    const-string v5, ": "

    if-ne v0, v4, :cond_7b

    .line 50
    invoke-virtual {p1, v5}, Ljava/lang/String;->concat(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 51
    iput-boolean v3, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    goto :goto_a6

    .line 52
    :cond_7b
    const/4 v4, 0x3

    if-ne v0, v4, :cond_8b

    .line 53
    invoke-direct {p0}, Luk/uuid/slf4j/android/LogAdapter;->getCompactName()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p1, v5}, Ljava/lang/String;->concat(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 54
    iput-boolean v3, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    goto :goto_a6

    .line 55
    :cond_8b
    const/4 v4, 0x4

    if-ne v0, v4, :cond_a2

    .line 56
    const/16 v0, 0x2e

    invoke-virtual {p1, v0}, Ljava/lang/String;->lastIndexOf(I)I

    move-result v0

    add-int/2addr v0, v2

    invoke-virtual {p1, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p1, v5}, Ljava/lang/String;->concat(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 57
    iput-boolean v3, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    goto :goto_a6

    .line 59
    :cond_a2
    iput-boolean v3, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    .line 60
    iput-object v1, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 62
    :goto_a6
    iget-object p1, p2, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    invoke-virtual {p1}, Ljava/lang/Boolean;->booleanValue()Z

    move-result p1

    .line 63
    iput-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->showThread:Z

    .line 64
    if-nez p1, :cond_b5

    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    if-nez p1, :cond_b5

    .line 65
    const/4 v2, 0x0

    .line 67
    :cond_b5
    iput-boolean v2, p0, Luk/uuid/slf4j/android/LogAdapter;->complexRewriteMsg:Z

    .line 68
    return-void
.end method

.method private final __debug(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 280
    if-nez p2, :cond_8

    .line 281
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {p2, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_d

    .line 283
    :cond_8
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {v0, p1, p2}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    .line 285
    :goto_d
    return-void
.end method

.method private final varargs __debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 288
    invoke-static {p1, p2}, Lorg/slf4j/helpers/MessageFormatter;->arrayFormat(Ljava/lang/String;[Ljava/lang/Object;)Lorg/slf4j/helpers/FormattingTuple;

    move-result-object p1

    .line 289
    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getMessage()Ljava/lang/String;

    move-result-object p2

    const/4 v0, 0x3

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getThrowable()Ljava/lang/Throwable;

    move-result-object p1

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__debug(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 290
    return-void
.end method

.method private final __error(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 559
    if-nez p2, :cond_8

    .line 560
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {p2, p1}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_d

    .line 562
    :cond_8
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {v0, p1, p2}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    .line 564
    :goto_d
    return-void
.end method

.method private final varargs __errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 567
    invoke-static {p1, p2}, Lorg/slf4j/helpers/MessageFormatter;->arrayFormat(Ljava/lang/String;[Ljava/lang/Object;)Lorg/slf4j/helpers/FormattingTuple;

    move-result-object p1

    .line 568
    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getMessage()Ljava/lang/String;

    move-result-object p2

    const/4 v0, 0x3

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getThrowable()Ljava/lang/Throwable;

    move-result-object p1

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__error(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 569
    return-void
.end method

.method private final __info(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 373
    if-nez p2, :cond_8

    .line 374
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {p2, p1}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_d

    .line 376
    :cond_8
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {v0, p1, p2}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    .line 378
    :goto_d
    return-void
.end method

.method private final varargs __infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 381
    invoke-static {p1, p2}, Lorg/slf4j/helpers/MessageFormatter;->arrayFormat(Ljava/lang/String;[Ljava/lang/Object;)Lorg/slf4j/helpers/FormattingTuple;

    move-result-object p1

    .line 382
    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getMessage()Ljava/lang/String;

    move-result-object p2

    const/4 v0, 0x3

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getThrowable()Ljava/lang/Throwable;

    move-result-object p1

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__info(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 383
    return-void
.end method

.method private final __trace(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 187
    if-nez p2, :cond_8

    .line 188
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {p2, p1}, Landroid/util/Log;->v(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_d

    .line 190
    :cond_8
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {v0, p1, p2}, Landroid/util/Log;->v(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    .line 192
    :goto_d
    return-void
.end method

.method private final varargs __traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 195
    invoke-static {p1, p2}, Lorg/slf4j/helpers/MessageFormatter;->arrayFormat(Ljava/lang/String;[Ljava/lang/Object;)Lorg/slf4j/helpers/FormattingTuple;

    move-result-object p1

    .line 196
    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getMessage()Ljava/lang/String;

    move-result-object p2

    const/4 v0, 0x3

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getThrowable()Ljava/lang/Throwable;

    move-result-object p1

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__trace(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 197
    return-void
.end method

.method private final __warn(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 466
    if-nez p2, :cond_8

    .line 467
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {p2, p1}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_d

    .line 469
    :cond_8
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {v0, p1, p2}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    .line 471
    :goto_d
    return-void
.end method

.method private final varargs __warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 474
    invoke-static {p1, p2}, Lorg/slf4j/helpers/MessageFormatter;->arrayFormat(Ljava/lang/String;[Ljava/lang/Object;)Lorg/slf4j/helpers/FormattingTuple;

    move-result-object p1

    .line 475
    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getMessage()Ljava/lang/String;

    move-result-object p2

    const/4 v0, 0x3

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getThrowable()Ljava/lang/Throwable;

    move-result-object p1

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__warn(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 476
    return-void
.end method

.method private final getCompactName()Ljava/lang/String;
    .registers 9

    .line 128
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->name:Ljava/lang/String;

    invoke-virtual {v0}, Ljava/lang/String;->toCharArray()[C

    move-result-object v0

    .line 129
    array-length v1, v0

    .line 130
    nop

    .line 131
    nop

    .line 132
    const/4 v2, 0x0

    const/4 v3, 0x0

    const/4 v4, 0x0

    const/4 v5, 0x0

    .line 133
    :goto_d
    if-ge v3, v1, :cond_35

    .line 134
    aget-char v6, v0, v3

    const/16 v7, 0x2e

    if-ne v6, v7, :cond_2c

    .line 135
    aget-char v4, v0, v5

    if-eq v4, v7, :cond_1d

    .line 136
    add-int/lit8 v5, v5, 0x1

    move v4, v5

    goto :goto_1e

    .line 135
    :cond_1d
    move v4, v5

    .line 138
    :goto_1e
    nop

    .line 139
    add-int/lit8 v5, v3, 0x1

    .line 140
    if-ge v5, v1, :cond_2b

    aget-char v5, v0, v5

    if-ne v5, v7, :cond_28

    goto :goto_2b

    :cond_28
    add-int/lit8 v5, v4, 0x1

    goto :goto_2c

    :cond_2b
    :goto_2b
    move v5, v4

    .line 142
    :cond_2c
    :goto_2c
    aget-char v6, v0, v3

    aput-char v6, v0, v4

    .line 143
    add-int/lit8 v3, v3, 0x1

    .line 144
    add-int/lit8 v4, v4, 0x1

    goto :goto_d

    .line 146
    :cond_35
    new-instance v1, Ljava/lang/String;

    invoke-direct {v1, v0, v2, v4}, Ljava/lang/String;-><init>([CII)V

    return-object v1
.end method

.method private final getNativeLogLevel()Luk/uuid/slf4j/android/LogLevel;
    .registers 4

    .line 102
    sget-object v0, Luk/uuid/slf4j/android/LogAdapter;->nativeLevelMap:Ljava/util/concurrent/ConcurrentMap;

    iget-object v1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-interface {v0, v1}, Ljava/util/concurrent/ConcurrentMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Luk/uuid/slf4j/android/LogLevel;

    .line 103
    if-eqz v0, :cond_d

    .line 104
    return-object v0

    .line 106
    :cond_d
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x4

    invoke-static {v0, v1}, Landroid/util/Log;->isLoggable(Ljava/lang/String;I)Z

    move-result v0

    if-eqz v0, :cond_31

    .line 107
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x3

    invoke-static {v0, v1}, Landroid/util/Log;->isLoggable(Ljava/lang/String;I)Z

    move-result v0

    if-eqz v0, :cond_2e

    .line 108
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-static {v0, v1}, Landroid/util/Log;->isLoggable(Ljava/lang/String;I)Z

    move-result v0

    if-eqz v0, :cond_2b

    .line 109
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->VERBOSE:Luk/uuid/slf4j/android/LogLevel;

    goto :goto_4b

    .line 111
    :cond_2b
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->DEBUG:Luk/uuid/slf4j/android/LogLevel;

    goto :goto_4b

    .line 114
    :cond_2e
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->INFO:Luk/uuid/slf4j/android/LogLevel;

    goto :goto_4b

    .line 116
    :cond_31
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x5

    invoke-static {v0, v1}, Landroid/util/Log;->isLoggable(Ljava/lang/String;I)Z

    move-result v0

    if-eqz v0, :cond_3d

    .line 117
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->WARN:Luk/uuid/slf4j/android/LogLevel;

    goto :goto_4b

    .line 118
    :cond_3d
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x6

    invoke-static {v0, v1}, Landroid/util/Log;->isLoggable(Ljava/lang/String;I)Z

    move-result v0

    if-eqz v0, :cond_49

    .line 119
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->ERROR:Luk/uuid/slf4j/android/LogLevel;

    goto :goto_4b

    .line 121
    :cond_49
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->SUPPRESS:Luk/uuid/slf4j/android/LogLevel;

    .line 123
    :goto_4b
    sget-object v1, Luk/uuid/slf4j/android/LogAdapter;->nativeLevelMap:Ljava/util/concurrent/ConcurrentMap;

    iget-object v2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-interface {v1, v2, v0}, Ljava/util/concurrent/ConcurrentMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 124
    return-object v0
.end method

.method private final rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;
    .registers 5

    .line 155
    if-nez p1, :cond_4

    .line 156
    const-string p1, "null"

    .line 158
    :cond_4
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->complexRewriteMsg:Z

    if-eqz v0, :cond_51

    .line 159
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/lang/String;->length()I

    move-result v1

    add-int/lit8 v1, v1, 0x40

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(I)V

    .line 160
    iget-boolean v1, p0, Luk/uuid/slf4j/android/LogAdapter;->showThread:Z

    if-eqz v1, :cond_2c

    .line 161
    const/16 v1, 0x5b

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    .line 162
    invoke-static {}, Ljava/lang/Thread;->currentThread()Ljava/lang/Thread;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/Thread;->getName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 163
    const-string v1, "] "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 165
    :cond_2c
    iget-boolean v1, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    if-eqz v1, :cond_42

    .line 166
    new-instance v1, Luk/uuid/slf4j/android/CallerStackTrace;

    invoke-direct {v1, p2}, Luk/uuid/slf4j/android/CallerStackTrace;-><init>(I)V

    invoke-virtual {v1}, Luk/uuid/slf4j/android/CallerStackTrace;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 167
    const-string p2, ": "

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_49

    .line 169
    :cond_42
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 170
    if-eqz p2, :cond_49

    .line 171
    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 174
    :cond_49
    :goto_49
    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 175
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    return-object p1

    .line 177
    :cond_51
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 178
    if-eqz p2, :cond_59

    invoke-virtual {p2, p1}, Ljava/lang/String;->concat(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    :cond_59
    return-object p1
.end method


# virtual methods
.method public final debug(Ljava/lang/String;)V
    .registers 4

    .line 294
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz v0, :cond_e

    .line 295
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-direct {p0, p1, v1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-static {v0, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 297
    :cond_e
    return-void
.end method

.method public final debug(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 5

    .line 301
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz v0, :cond_d

    .line 302
    const/4 v0, 0x1

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 304
    :cond_d
    return-void
.end method

.method public final debug(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 308
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz v0, :cond_10

    .line 309
    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    const/4 p2, 0x1

    aput-object p3, v0, p2

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 311
    :cond_10
    return-void
.end method

.method public final debug(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 322
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz v0, :cond_c

    .line 323
    const/4 v0, 0x2

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__debug(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 325
    :cond_c
    return-void
.end method

.method public final varargs debug(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 315
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz v0, :cond_7

    .line 316
    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 318
    :cond_7
    return-void
.end method

.method public final debug(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .registers 4

    .line 334
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz p1, :cond_e

    .line 335
    iget-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v0, 0x2

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 337
    :cond_e
    return-void
.end method

.method public final debug(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .registers 5

    .line 341
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz p1, :cond_d

    .line 342
    const/4 p1, 0x1

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 344
    :cond_d
    return-void
.end method

.method public final debug(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 348
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz p1, :cond_10

    .line 349
    const/4 p1, 0x2

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    const/4 p3, 0x1

    aput-object p4, p1, p3

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 351
    :cond_10
    return-void
.end method

.method public final debug(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 362
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz p1, :cond_c

    .line 363
    const/4 p1, 0x2

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p3}, Luk/uuid/slf4j/android/LogAdapter;->__debug(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 365
    :cond_c
    return-void
.end method

.method public final varargs debug(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 355
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz p1, :cond_7

    .line 356
    invoke-direct {p0, p2, p3}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 358
    :cond_7
    return-void
.end method

.method public final error(Ljava/lang/String;)V
    .registers 4

    .line 573
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz v0, :cond_e

    .line 574
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-direct {p0, p1, v1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-static {v0, p1}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;)I

    .line 576
    :cond_e
    return-void
.end method

.method public final error(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 5

    .line 580
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz v0, :cond_d

    .line 581
    const/4 v0, 0x1

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 583
    :cond_d
    return-void
.end method

.method public final error(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 587
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz v0, :cond_10

    .line 588
    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    const/4 p2, 0x1

    aput-object p3, v0, p2

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 590
    :cond_10
    return-void
.end method

.method public final error(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 601
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz v0, :cond_c

    .line 602
    const/4 v0, 0x2

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__error(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 604
    :cond_c
    return-void
.end method

.method public final varargs error(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 594
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz v0, :cond_7

    .line 595
    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 597
    :cond_7
    return-void
.end method

.method public final error(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .registers 4

    .line 613
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz p1, :cond_e

    .line 614
    iget-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v0, 0x2

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;)I

    .line 616
    :cond_e
    return-void
.end method

.method public final error(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .registers 5

    .line 620
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz p1, :cond_d

    .line 621
    const/4 p1, 0x1

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 623
    :cond_d
    return-void
.end method

.method public final error(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 627
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz p1, :cond_10

    .line 628
    const/4 p1, 0x2

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    const/4 p3, 0x1

    aput-object p4, p1, p3

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 630
    :cond_10
    return-void
.end method

.method public final error(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 641
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz p1, :cond_c

    .line 642
    const/4 p1, 0x2

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p3}, Luk/uuid/slf4j/android/LogAdapter;->__error(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 644
    :cond_c
    return-void
.end method

.method public final varargs error(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 634
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz p1, :cond_7

    .line 635
    invoke-direct {p0, p2, p3}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 637
    :cond_7
    return-void
.end method

.method public final getName()Ljava/lang/String;
    .registers 2

    .line 151
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->name:Ljava/lang/String;

    return-object v0
.end method

.method public final info(Ljava/lang/String;)V
    .registers 4

    .line 387
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz v0, :cond_e

    .line 388
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-direct {p0, p1, v1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-static {v0, p1}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I

    .line 390
    :cond_e
    return-void
.end method

.method public final info(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 5

    .line 394
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz v0, :cond_d

    .line 395
    const/4 v0, 0x1

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 397
    :cond_d
    return-void
.end method

.method public final info(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 401
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz v0, :cond_10

    .line 402
    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    const/4 p2, 0x1

    aput-object p3, v0, p2

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 404
    :cond_10
    return-void
.end method

.method public final info(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 415
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz v0, :cond_c

    .line 416
    const/4 v0, 0x2

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__info(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 418
    :cond_c
    return-void
.end method

.method public final varargs info(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 408
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz v0, :cond_7

    .line 409
    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 411
    :cond_7
    return-void
.end method

.method public final info(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .registers 4

    .line 427
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz p1, :cond_e

    .line 428
    iget-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v0, 0x2

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I

    .line 430
    :cond_e
    return-void
.end method

.method public final info(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .registers 5

    .line 434
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz p1, :cond_d

    .line 435
    const/4 p1, 0x1

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 437
    :cond_d
    return-void
.end method

.method public final info(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 441
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz p1, :cond_10

    .line 442
    const/4 p1, 0x2

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    const/4 p3, 0x1

    aput-object p4, p1, p3

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 444
    :cond_10
    return-void
.end method

.method public final info(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 455
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz p1, :cond_c

    .line 456
    const/4 p1, 0x2

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p3}, Luk/uuid/slf4j/android/LogAdapter;->__info(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 458
    :cond_c
    return-void
.end method

.method public final varargs info(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 448
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz p1, :cond_7

    .line 449
    invoke-direct {p0, p2, p3}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 451
    :cond_7
    return-void
.end method

.method public final isDebugEnabled()Z
    .registers 2

    .line 276
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    return v0
.end method

.method public final isDebugEnabled(Lorg/slf4j/Marker;)Z
    .registers 2

    .line 329
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    return p1
.end method

.method public final isErrorEnabled()Z
    .registers 2

    .line 555
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    return v0
.end method

.method public final isErrorEnabled(Lorg/slf4j/Marker;)Z
    .registers 2

    .line 608
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    return p1
.end method

.method public final isInfoEnabled()Z
    .registers 2

    .line 369
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    return v0
.end method

.method public final isInfoEnabled(Lorg/slf4j/Marker;)Z
    .registers 2

    .line 422
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    return p1
.end method

.method public final isTraceEnabled()Z
    .registers 2

    .line 183
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    return v0
.end method

.method public final isTraceEnabled(Lorg/slf4j/Marker;)Z
    .registers 2

    .line 236
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    return p1
.end method

.method public final isWarnEnabled()Z
    .registers 2

    .line 462
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    return v0
.end method

.method public final isWarnEnabled(Lorg/slf4j/Marker;)Z
    .registers 2

    .line 515
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    return p1
.end method

.method public final trace(Ljava/lang/String;)V
    .registers 4

    .line 201
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz v0, :cond_e

    .line 202
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-direct {p0, p1, v1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-static {v0, p1}, Landroid/util/Log;->v(Ljava/lang/String;Ljava/lang/String;)I

    .line 204
    :cond_e
    return-void
.end method

.method public final trace(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 5

    .line 208
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz v0, :cond_d

    .line 209
    const/4 v0, 0x1

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 211
    :cond_d
    return-void
.end method

.method public final trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 215
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz v0, :cond_10

    .line 216
    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    const/4 p2, 0x1

    aput-object p3, v0, p2

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 218
    :cond_10
    return-void
.end method

.method public final trace(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 229
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz v0, :cond_c

    .line 230
    const/4 v0, 0x2

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__trace(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 232
    :cond_c
    return-void
.end method

.method public final varargs trace(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 222
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz v0, :cond_7

    .line 223
    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 225
    :cond_7
    return-void
.end method

.method public final trace(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .registers 4

    .line 241
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz p1, :cond_e

    .line 242
    iget-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v0, 0x2

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->v(Ljava/lang/String;Ljava/lang/String;)I

    .line 244
    :cond_e
    return-void
.end method

.method public final trace(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .registers 5

    .line 248
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz p1, :cond_d

    .line 249
    const/4 p1, 0x1

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 251
    :cond_d
    return-void
.end method

.method public final trace(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 255
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz p1, :cond_10

    .line 256
    const/4 p1, 0x2

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    const/4 p3, 0x1

    aput-object p4, p1, p3

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 258
    :cond_10
    return-void
.end method

.method public final trace(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 269
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz p1, :cond_c

    .line 270
    const/4 p1, 0x2

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p3}, Luk/uuid/slf4j/android/LogAdapter;->__trace(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 272
    :cond_c
    return-void
.end method

.method public final varargs trace(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 262
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz p1, :cond_7

    .line 263
    invoke-direct {p0, p2, p3}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 265
    :cond_7
    return-void
.end method

.method public final warn(Ljava/lang/String;)V
    .registers 4

    .line 480
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz v0, :cond_e

    .line 481
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-direct {p0, p1, v1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-static {v0, p1}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;)I

    .line 483
    :cond_e
    return-void
.end method

.method public final warn(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 5

    .line 487
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz v0, :cond_d

    .line 488
    const/4 v0, 0x1

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 490
    :cond_d
    return-void
.end method

.method public final warn(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 494
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz v0, :cond_10

    .line 495
    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    const/4 p2, 0x1

    aput-object p3, v0, p2

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 497
    :cond_10
    return-void
.end method

.method public final warn(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 508
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz v0, :cond_c

    .line 509
    const/4 v0, 0x2

    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__warn(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 511
    :cond_c
    return-void
.end method

.method public final varargs warn(Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 501
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz v0, :cond_7

    .line 502
    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 504
    :cond_7
    return-void
.end method

.method public final warn(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .registers 4

    .line 520
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz p1, :cond_e

    .line 521
    iget-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v0, 0x2

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;)I

    .line 523
    :cond_e
    return-void
.end method

.method public final warn(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .registers 5

    .line 527
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz p1, :cond_d

    .line 528
    const/4 p1, 0x1

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 530
    :cond_d
    return-void
.end method

.method public final warn(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 6

    .line 534
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz p1, :cond_10

    .line 535
    const/4 p1, 0x2

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    const/4 p3, 0x1

    aput-object p4, p1, p3

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 537
    :cond_10
    return-void
.end method

.method public final warn(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 548
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz p1, :cond_c

    .line 549
    const/4 p1, 0x2

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p3}, Luk/uuid/slf4j/android/LogAdapter;->__warn(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 551
    :cond_c
    return-void
.end method

.method public final varargs warn(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 541
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz p1, :cond_7

    .line 542
    invoke-direct {p0, p2, p3}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 544
    :cond_7
    return-void
.end method
