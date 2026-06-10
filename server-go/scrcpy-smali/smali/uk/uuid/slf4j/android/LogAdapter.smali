.class final Luk/uuid/slf4j/android/LogAdapter;
.super Ljava/lang/Object;
.source "LogAdapter.java"

# interfaces
.implements Lorg/slf4j/Logger;


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
    .locals 1

    .line 45
    new-instance v0, Ljava/util/concurrent/ConcurrentHashMap;

    invoke-direct {v0}, Ljava/util/concurrent/ConcurrentHashMap;-><init>()V

    sput-object v0, Luk/uuid/slf4j/android/LogAdapter;->nativeLevelMap:Ljava/util/concurrent/ConcurrentMap;

    return-void
.end method

.method constructor <init>(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V
    .locals 6

    .line 60
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 61
    iput-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->name:Ljava/lang/String;

    .line 62
    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    iput-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    .line 64
    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->NATIVE:Luk/uuid/slf4j/android/LogLevel;

    if-ne v0, v1, :cond_0

    .line 65
    invoke-direct {p0}, Luk/uuid/slf4j/android/LogAdapter;->getNativeLogLevel()Luk/uuid/slf4j/android/LogLevel;

    move-result-object v0

    iput-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    .line 68
    :cond_0
    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->VERBOSE:Luk/uuid/slf4j/android/LogLevel;

    const/4 v2, 0x1

    const/4 v3, 0x0

    if-ne v0, v1, :cond_1

    const/4 v0, 0x1

    goto :goto_0

    :cond_1
    const/4 v0, 0x0

    :goto_0
    iput-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-nez v0, :cond_3

    .line 69
    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->DEBUG:Luk/uuid/slf4j/android/LogLevel;

    if-ne v0, v1, :cond_2

    goto :goto_1

    :cond_2
    const/4 v0, 0x0

    goto :goto_2

    :cond_3
    :goto_1
    const/4 v0, 0x1

    :goto_2
    iput-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-nez v0, :cond_5

    .line 70
    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->INFO:Luk/uuid/slf4j/android/LogLevel;

    if-ne v0, v1, :cond_4

    goto :goto_3

    :cond_4
    const/4 v0, 0x0

    goto :goto_4

    :cond_5
    :goto_3
    const/4 v0, 0x1

    :goto_4
    iput-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-nez v0, :cond_7

    .line 71
    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->WARN:Luk/uuid/slf4j/android/LogLevel;

    if-ne v0, v1, :cond_6

    goto :goto_5

    :cond_6
    const/4 v0, 0x0

    goto :goto_6

    :cond_7
    :goto_5
    const/4 v0, 0x1

    :goto_6
    iput-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-nez v0, :cond_9

    .line 72
    iget-object v0, p2, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->ERROR:Luk/uuid/slf4j/android/LogLevel;

    if-ne v0, v1, :cond_8

    goto :goto_7

    :cond_8
    const/4 v0, 0x0

    goto :goto_8

    :cond_9
    :goto_7
    const/4 v0, 0x1

    :goto_8
    iput-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    .line 74
    sget-object v0, Luk/uuid/slf4j/android/LogAdapter$1;->$SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName:[I

    iget-object v1, p2, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    invoke-virtual {v1}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->ordinal()I

    move-result v1

    aget v0, v0, v1

    const/4 v1, 0x0

    if-eq v0, v2, :cond_d

    const/4 v4, 0x2

    const-string v5, ": "

    if-eq v0, v4, :cond_c

    const/4 v4, 0x3

    if-eq v0, v4, :cond_b

    const/4 v4, 0x4

    if-eq v0, v4, :cond_a

    .line 97
    iput-boolean v3, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    .line 98
    iput-object v1, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    goto :goto_9

    :cond_a
    const/16 v0, 0x2e

    .line 91
    invoke-virtual {p1, v0}, Ljava/lang/String;->lastIndexOf(I)I

    move-result v0

    add-int/2addr v0, v2

    invoke-virtual {p1, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p1, v5}, Ljava/lang/String;->concat(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 92
    iput-boolean v3, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    goto :goto_9

    .line 86
    :cond_b
    invoke-direct {p0}, Luk/uuid/slf4j/android/LogAdapter;->getCompactName()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p1, v5}, Ljava/lang/String;->concat(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 87
    iput-boolean v3, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    goto :goto_9

    .line 81
    :cond_c
    invoke-virtual {p1, v5}, Ljava/lang/String;->concat(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 82
    iput-boolean v3, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    goto :goto_9

    .line 76
    :cond_d
    iput-object v1, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    .line 77
    iput-boolean v2, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    .line 102
    :goto_9
    iget-object p1, p2, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    invoke-virtual {p1}, Ljava/lang/Boolean;->booleanValue()Z

    move-result p1

    iput-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->showThread:Z

    if-nez p1, :cond_f

    .line 103
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    if-eqz p1, :cond_e

    goto :goto_a

    :cond_e
    const/4 v2, 0x0

    :cond_f
    :goto_a
    iput-boolean v2, p0, Luk/uuid/slf4j/android/LogAdapter;->complexRewriteMsg:Z

    return-void
.end method

.method private final __debug(Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 1

    if-nez p2, :cond_0

    .line 300
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {p2, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_0

    .line 302
    :cond_0
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {v0, p1, p2}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :goto_0
    return-void
.end method

.method private final varargs __debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 1

    .line 307
    invoke-static {p1, p2}, Lorg/slf4j/helpers/MessageFormatter;->arrayFormat(Ljava/lang/String;[Ljava/lang/Object;)Lorg/slf4j/helpers/FormattingTuple;

    move-result-object p1

    .line 308
    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getMessage()Ljava/lang/String;

    move-result-object p2

    const/4 v0, 0x3

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getThrowable()Ljava/lang/Throwable;

    move-result-object p1

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__debug(Ljava/lang/String;Ljava/lang/Throwable;)V

    return-void
.end method

.method private final __error(Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 1

    if-nez p2, :cond_0

    .line 585
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {p2, p1}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_0

    .line 587
    :cond_0
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {v0, p1, p2}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :goto_0
    return-void
.end method

.method private final varargs __errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 1

    .line 592
    invoke-static {p1, p2}, Lorg/slf4j/helpers/MessageFormatter;->arrayFormat(Ljava/lang/String;[Ljava/lang/Object;)Lorg/slf4j/helpers/FormattingTuple;

    move-result-object p1

    .line 593
    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getMessage()Ljava/lang/String;

    move-result-object p2

    const/4 v0, 0x3

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getThrowable()Ljava/lang/Throwable;

    move-result-object p1

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__error(Ljava/lang/String;Ljava/lang/Throwable;)V

    return-void
.end method

.method private final __info(Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 1

    if-nez p2, :cond_0

    .line 395
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {p2, p1}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_0

    .line 397
    :cond_0
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {v0, p1, p2}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :goto_0
    return-void
.end method

.method private final varargs __infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 1

    .line 402
    invoke-static {p1, p2}, Lorg/slf4j/helpers/MessageFormatter;->arrayFormat(Ljava/lang/String;[Ljava/lang/Object;)Lorg/slf4j/helpers/FormattingTuple;

    move-result-object p1

    .line 403
    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getMessage()Ljava/lang/String;

    move-result-object p2

    const/4 v0, 0x3

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getThrowable()Ljava/lang/Throwable;

    move-result-object p1

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__info(Ljava/lang/String;Ljava/lang/Throwable;)V

    return-void
.end method

.method private final __trace(Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 1

    if-nez p2, :cond_0

    .line 205
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {p2, p1}, Landroid/util/Log;->v(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_0

    .line 207
    :cond_0
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {v0, p1, p2}, Landroid/util/Log;->v(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :goto_0
    return-void
.end method

.method private final varargs __traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 1

    .line 212
    invoke-static {p1, p2}, Lorg/slf4j/helpers/MessageFormatter;->arrayFormat(Ljava/lang/String;[Ljava/lang/Object;)Lorg/slf4j/helpers/FormattingTuple;

    move-result-object p1

    .line 213
    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getMessage()Ljava/lang/String;

    move-result-object p2

    const/4 v0, 0x3

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getThrowable()Ljava/lang/Throwable;

    move-result-object p1

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__trace(Ljava/lang/String;Ljava/lang/Throwable;)V

    return-void
.end method

.method private final __warn(Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 1

    if-nez p2, :cond_0

    .line 490
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {p2, p1}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;)I

    goto :goto_0

    .line 492
    :cond_0
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-static {v0, p1, p2}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    :goto_0
    return-void
.end method

.method private final varargs __warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 1

    .line 497
    invoke-static {p1, p2}, Lorg/slf4j/helpers/MessageFormatter;->arrayFormat(Ljava/lang/String;[Ljava/lang/Object;)Lorg/slf4j/helpers/FormattingTuple;

    move-result-object p1

    .line 498
    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getMessage()Ljava/lang/String;

    move-result-object p2

    const/4 v0, 0x3

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1}, Lorg/slf4j/helpers/FormattingTuple;->getThrowable()Ljava/lang/Throwable;

    move-result-object p1

    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__warn(Ljava/lang/String;Ljava/lang/Throwable;)V

    return-void
.end method

.method private final getCompactName()Ljava/lang/String;
    .locals 8

    .line 137
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->name:Ljava/lang/String;

    invoke-virtual {v0}, Ljava/lang/String;->toCharArray()[C

    move-result-object v0

    .line 138
    array-length v1, v0

    const/4 v2, 0x0

    const/4 v3, 0x0

    const/4 v4, 0x0

    const/4 v5, 0x0

    :goto_0
    if-ge v3, v1, :cond_3

    .line 143
    aget-char v6, v0, v3

    const/16 v7, 0x2e

    if-ne v6, v7, :cond_2

    .line 146
    aget-char v4, v0, v5

    if-eq v4, v7, :cond_0

    add-int/lit8 v5, v5, 0x1

    :cond_0
    move v4, v5

    add-int/lit8 v5, v3, 0x1

    if-ge v5, v1, :cond_1

    .line 152
    aget-char v5, v0, v5

    if-eq v5, v7, :cond_1

    add-int/lit8 v5, v4, 0x1

    goto :goto_1

    :cond_1
    move v5, v4

    .line 157
    :cond_2
    :goto_1
    aget-char v6, v0, v3

    aput-char v6, v0, v4

    add-int/lit8 v3, v3, 0x1

    add-int/lit8 v4, v4, 0x1

    goto :goto_0

    .line 160
    :cond_3
    new-instance v1, Ljava/lang/String;

    invoke-direct {v1, v0, v2, v4}, Ljava/lang/String;-><init>([CII)V

    return-object v1
.end method

.method private final getNativeLogLevel()Luk/uuid/slf4j/android/LogLevel;
    .locals 3

    .line 107
    sget-object v0, Luk/uuid/slf4j/android/LogAdapter;->nativeLevelMap:Ljava/util/concurrent/ConcurrentMap;

    iget-object v1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-interface {v0, v1}, Ljava/util/concurrent/ConcurrentMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Luk/uuid/slf4j/android/LogLevel;

    if-eqz v0, :cond_0

    return-object v0

    .line 113
    :cond_0
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x4

    invoke-static {v0, v1}, Landroid/util/Log;->isLoggable(Ljava/lang/String;I)Z

    move-result v0

    if-eqz v0, :cond_3

    .line 114
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x3

    invoke-static {v0, v1}, Landroid/util/Log;->isLoggable(Ljava/lang/String;I)Z

    move-result v0

    if-eqz v0, :cond_2

    .line 115
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-static {v0, v1}, Landroid/util/Log;->isLoggable(Ljava/lang/String;I)Z

    move-result v0

    if-eqz v0, :cond_1

    .line 116
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->VERBOSE:Luk/uuid/slf4j/android/LogLevel;

    goto :goto_0

    .line 118
    :cond_1
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->DEBUG:Luk/uuid/slf4j/android/LogLevel;

    goto :goto_0

    .line 122
    :cond_2
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->INFO:Luk/uuid/slf4j/android/LogLevel;

    goto :goto_0

    .line 124
    :cond_3
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x5

    invoke-static {v0, v1}, Landroid/util/Log;->isLoggable(Ljava/lang/String;I)Z

    move-result v0

    if-eqz v0, :cond_4

    .line 125
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->WARN:Luk/uuid/slf4j/android/LogLevel;

    goto :goto_0

    .line 126
    :cond_4
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x6

    invoke-static {v0, v1}, Landroid/util/Log;->isLoggable(Ljava/lang/String;I)Z

    move-result v0

    if-eqz v0, :cond_5

    .line 127
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->ERROR:Luk/uuid/slf4j/android/LogLevel;

    goto :goto_0

    .line 129
    :cond_5
    sget-object v0, Luk/uuid/slf4j/android/LogLevel;->SUPPRESS:Luk/uuid/slf4j/android/LogLevel;

    .line 132
    :goto_0
    sget-object v1, Luk/uuid/slf4j/android/LogAdapter;->nativeLevelMap:Ljava/util/concurrent/ConcurrentMap;

    iget-object v2, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    invoke-interface {v1, v2, v0}, Ljava/util/concurrent/ConcurrentMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    return-object v0
.end method

.method private final rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;
    .locals 2

    if-nez p1, :cond_0

    const-string p1, "null"

    .line 173
    :cond_0
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->complexRewriteMsg:Z

    if-eqz v0, :cond_4

    .line 174
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/lang/String;->length()I

    move-result v1

    add-int/lit8 v1, v1, 0x40

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(I)V

    .line 176
    iget-boolean v1, p0, Luk/uuid/slf4j/android/LogAdapter;->showThread:Z

    if-eqz v1, :cond_1

    const/16 v1, 0x5b

    .line 177
    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    invoke-static {}, Ljava/lang/Thread;->currentThread()Ljava/lang/Thread;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/Thread;->getName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v1, "] "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 180
    :cond_1
    iget-boolean v1, p0, Luk/uuid/slf4j/android/LogAdapter;->showCaller:Z

    if-eqz v1, :cond_2

    .line 181
    new-instance v1, Luk/uuid/slf4j/android/CallerStackTrace;

    invoke-direct {v1, p2}, Luk/uuid/slf4j/android/CallerStackTrace;-><init>(I)V

    invoke-virtual {v1}, Luk/uuid/slf4j/android/CallerStackTrace;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p2, ": "

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    goto :goto_0

    .line 182
    :cond_2
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    if-eqz p2, :cond_3

    .line 183
    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 186
    :cond_3
    :goto_0
    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 188
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    return-object p1

    .line 189
    :cond_4
    iget-object p2, p0, Luk/uuid/slf4j/android/LogAdapter;->prefixName:Ljava/lang/String;

    if-eqz p2, :cond_5

    .line 190
    invoke-virtual {p2, p1}, Ljava/lang/String;->concat(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    :cond_5
    return-object p1
.end method


# virtual methods
.method public final debug(Ljava/lang/String;)V
    .locals 2

    .line 313
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz v0, :cond_0

    .line 314
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-direct {p0, p1, v1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-static {v0, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return-void
.end method

.method public final debug(Ljava/lang/String;Ljava/lang/Object;)V
    .locals 2

    .line 320
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x1

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    .line 321
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final debug(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .locals 2

    .line 327
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    const/4 p2, 0x1

    aput-object p3, v0, p2

    .line 328
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final debug(Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 1

    .line 341
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x2

    .line 342
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__debug(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    return-void
.end method

.method public final varargs debug(Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 1

    .line 334
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz v0, :cond_0

    .line 335
    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final debug(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .locals 1

    .line 353
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz p1, :cond_0

    .line 354
    iget-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v0, 0x2

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return-void
.end method

.method public final debug(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .locals 1

    .line 360
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x1

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    .line 361
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final debug(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .locals 1

    .line 367
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x2

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    const/4 p3, 0x1

    aput-object p4, p1, p3

    .line 368
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final debug(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 0

    .line 381
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x2

    .line 382
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p3}, Luk/uuid/slf4j/android/LogAdapter;->__debug(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    return-void
.end method

.method public final varargs debug(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 0

    .line 374
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    if-eqz p1, :cond_0

    .line 375
    invoke-direct {p0, p2, p3}, Luk/uuid/slf4j/android/LogAdapter;->__debugFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final error(Ljava/lang/String;)V
    .locals 2

    .line 598
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz v0, :cond_0

    .line 599
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-direct {p0, p1, v1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-static {v0, p1}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return-void
.end method

.method public final error(Ljava/lang/String;Ljava/lang/Object;)V
    .locals 2

    .line 605
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x1

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    .line 606
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final error(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .locals 2

    .line 612
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    const/4 p2, 0x1

    aput-object p3, v0, p2

    .line 613
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final error(Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 1

    .line 626
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x2

    .line 627
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__error(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    return-void
.end method

.method public final varargs error(Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 1

    .line 619
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz v0, :cond_0

    .line 620
    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final error(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .locals 1

    .line 638
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz p1, :cond_0

    .line 639
    iget-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v0, 0x2

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return-void
.end method

.method public final error(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .locals 1

    .line 645
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x1

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    .line 646
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final error(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .locals 1

    .line 652
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x2

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    const/4 p3, 0x1

    aput-object p4, p1, p3

    .line 653
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final error(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 0

    .line 666
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x2

    .line 667
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p3}, Luk/uuid/slf4j/android/LogAdapter;->__error(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    return-void
.end method

.method public final varargs error(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 0

    .line 659
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    if-eqz p1, :cond_0

    .line 660
    invoke-direct {p0, p2, p3}, Luk/uuid/slf4j/android/LogAdapter;->__errorFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final getName()Ljava/lang/String;
    .locals 1

    .line 165
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->name:Ljava/lang/String;

    return-object v0
.end method

.method public final info(Ljava/lang/String;)V
    .locals 2

    .line 408
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz v0, :cond_0

    .line 409
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-direct {p0, p1, v1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-static {v0, p1}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return-void
.end method

.method public final info(Ljava/lang/String;Ljava/lang/Object;)V
    .locals 2

    .line 415
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x1

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    .line 416
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final info(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .locals 2

    .line 422
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    const/4 p2, 0x1

    aput-object p3, v0, p2

    .line 423
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final info(Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 1

    .line 436
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x2

    .line 437
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__info(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    return-void
.end method

.method public final varargs info(Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 1

    .line 429
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz v0, :cond_0

    .line 430
    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final info(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .locals 1

    .line 448
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz p1, :cond_0

    .line 449
    iget-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v0, 0x2

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return-void
.end method

.method public final info(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .locals 1

    .line 455
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x1

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    .line 456
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final info(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .locals 1

    .line 462
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x2

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    const/4 p3, 0x1

    aput-object p4, p1, p3

    .line 463
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final info(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 0

    .line 476
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x2

    .line 477
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p3}, Luk/uuid/slf4j/android/LogAdapter;->__info(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    return-void
.end method

.method public final varargs info(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 0

    .line 469
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    if-eqz p1, :cond_0

    .line 470
    invoke-direct {p0, p2, p3}, Luk/uuid/slf4j/android/LogAdapter;->__infoFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final isDebugEnabled()Z
    .locals 1

    .line 295
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    return v0
.end method

.method public final isDebugEnabled(Lorg/slf4j/Marker;)Z
    .locals 0

    .line 348
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->DEBUG:Z

    return p1
.end method

.method public final isErrorEnabled()Z
    .locals 1

    .line 580
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    return v0
.end method

.method public final isErrorEnabled(Lorg/slf4j/Marker;)Z
    .locals 0

    .line 633
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->ERROR:Z

    return p1
.end method

.method public final isInfoEnabled()Z
    .locals 1

    .line 390
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    return v0
.end method

.method public final isInfoEnabled(Lorg/slf4j/Marker;)Z
    .locals 0

    .line 443
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->INFO:Z

    return p1
.end method

.method public final isTraceEnabled()Z
    .locals 1

    .line 200
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    return v0
.end method

.method public final isTraceEnabled(Lorg/slf4j/Marker;)Z
    .locals 0

    .line 253
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    return p1
.end method

.method public final isWarnEnabled()Z
    .locals 1

    .line 485
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    return v0
.end method

.method public final isWarnEnabled(Lorg/slf4j/Marker;)Z
    .locals 0

    .line 538
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    return p1
.end method

.method public final trace(Ljava/lang/String;)V
    .locals 2

    .line 218
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz v0, :cond_0

    .line 219
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-direct {p0, p1, v1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-static {v0, p1}, Landroid/util/Log;->v(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return-void
.end method

.method public final trace(Ljava/lang/String;Ljava/lang/Object;)V
    .locals 2

    .line 225
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x1

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    .line 226
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .locals 2

    .line 232
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    const/4 p2, 0x1

    aput-object p3, v0, p2

    .line 233
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final trace(Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 1

    .line 246
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x2

    .line 247
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__trace(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    return-void
.end method

.method public final varargs trace(Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 1

    .line 239
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz v0, :cond_0

    .line 240
    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final trace(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .locals 1

    .line 258
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz p1, :cond_0

    .line 259
    iget-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v0, 0x2

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->v(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return-void
.end method

.method public final trace(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .locals 1

    .line 265
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x1

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    .line 266
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final trace(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .locals 1

    .line 272
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x2

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    const/4 p3, 0x1

    aput-object p4, p1, p3

    .line 273
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final trace(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 0

    .line 286
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x2

    .line 287
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p3}, Luk/uuid/slf4j/android/LogAdapter;->__trace(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    return-void
.end method

.method public final varargs trace(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 0

    .line 279
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->TRACE:Z

    if-eqz p1, :cond_0

    .line 280
    invoke-direct {p0, p2, p3}, Luk/uuid/slf4j/android/LogAdapter;->__traceFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final warn(Ljava/lang/String;)V
    .locals 2

    .line 503
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz v0, :cond_0

    .line 504
    iget-object v0, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v1, 0x2

    invoke-direct {p0, p1, v1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-static {v0, p1}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return-void
.end method

.method public final warn(Ljava/lang/String;Ljava/lang/Object;)V
    .locals 2

    .line 510
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x1

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    .line 511
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final warn(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .locals 2

    .line 517
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x2

    new-array v0, v0, [Ljava/lang/Object;

    const/4 v1, 0x0

    aput-object p2, v0, v1

    const/4 p2, 0x1

    aput-object p3, v0, p2

    .line 518
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final warn(Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 1

    .line 531
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz v0, :cond_0

    const/4 v0, 0x2

    .line 532
    invoke-direct {p0, p1, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__warn(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    return-void
.end method

.method public final varargs warn(Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 1

    .line 524
    iget-boolean v0, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz v0, :cond_0

    .line 525
    invoke-direct {p0, p1, p2}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final warn(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .locals 1

    .line 543
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz p1, :cond_0

    .line 544
    iget-object p1, p0, Luk/uuid/slf4j/android/LogAdapter;->tag:Ljava/lang/String;

    const/4 v0, 0x2

    invoke-direct {p0, p2, v0}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p2

    invoke-static {p1, p2}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;)I

    :cond_0
    return-void
.end method

.method public final warn(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .locals 1

    .line 550
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x1

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    .line 551
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final warn(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .locals 1

    .line 557
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x2

    new-array p1, p1, [Ljava/lang/Object;

    const/4 v0, 0x0

    aput-object p3, p1, v0

    const/4 p3, 0x1

    aput-object p4, p1, p3

    .line 558
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method

.method public final warn(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .locals 0

    .line 571
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz p1, :cond_0

    const/4 p1, 0x2

    .line 572
    invoke-direct {p0, p2, p1}, Luk/uuid/slf4j/android/LogAdapter;->rewriteMsg(Ljava/lang/String;I)Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1, p3}, Luk/uuid/slf4j/android/LogAdapter;->__warn(Ljava/lang/String;Ljava/lang/Throwable;)V

    :cond_0
    return-void
.end method

.method public final varargs warn(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .locals 0

    .line 564
    iget-boolean p1, p0, Luk/uuid/slf4j/android/LogAdapter;->WARN:Z

    if-eqz p1, :cond_0

    .line 565
    invoke-direct {p0, p2, p3}, Luk/uuid/slf4j/android/LogAdapter;->__warnFormat(Ljava/lang/String;[Ljava/lang/Object;)V

    :cond_0
    return-void
.end method
