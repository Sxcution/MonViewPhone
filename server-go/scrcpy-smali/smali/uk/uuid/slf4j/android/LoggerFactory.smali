.class public final Luk/uuid/slf4j/android/LoggerFactory;
.super Ljava/lang/Object;
.source "LoggerFactory.java"

# interfaces
.implements Lorg/slf4j/ILoggerFactory;


# static fields
.field private static final LOG:Lorg/slf4j/Logger;

.field static final MAX_TAG_LEN:I = 0x17

.field private static final TRACE:Z


# instance fields
.field private final loggerMap:Ljava/util/concurrent/ConcurrentMap;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/concurrent/ConcurrentMap<",
            "Ljava/lang/String;",
            "Lorg/slf4j/Logger;",
            ">;"
        }
    .end annotation
.end field

.field private final loggingConfig:Luk/uuid/slf4j/android/LoggingConfig;


# direct methods
.method static constructor <clinit>()V
    .locals 3

    .line 43
    new-instance v0, Luk/uuid/slf4j/android/LoggerConfig;

    const-string v1, "slf4j-android"

    invoke-direct {v0, v1}, Luk/uuid/slf4j/android/LoggerConfig;-><init>(Ljava/lang/String;)V

    const/4 v1, 0x1

    .line 44
    invoke-static {v1}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v1

    iput-object v1, v0, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    .line 45
    sget-object v1, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    invoke-virtual {v0, v1}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    .line 46
    new-instance v1, Luk/uuid/slf4j/android/LogAdapter;

    const-string v2, "uk.uuid.slf4j.android"

    invoke-direct {v1, v2, v0}, Luk/uuid/slf4j/android/LogAdapter;-><init>(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V

    sput-object v1, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    .line 47
    invoke-interface {v1}, Lorg/slf4j/Logger;->isTraceEnabled()Z

    move-result v0

    sput-boolean v0, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    return-void
.end method

.method public constructor <init>()V
    .locals 3

    .line 39
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 50
    new-instance v0, Ljava/util/concurrent/ConcurrentHashMap;

    invoke-direct {v0}, Ljava/util/concurrent/ConcurrentHashMap;-><init>()V

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggerFactory;->loggerMap:Ljava/util/concurrent/ConcurrentMap;

    .line 51
    new-instance v0, Luk/uuid/slf4j/android/LoggingConfig;

    sget-object v1, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    const-string v2, "config.properties"

    invoke-direct {v0, v2, v1}, Luk/uuid/slf4j/android/LoggingConfig;-><init>(Ljava/lang/String;Lorg/slf4j/Logger;)V

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggerFactory;->loggingConfig:Luk/uuid/slf4j/android/LoggingConfig;

    return-void
.end method

.method static final createTag(Ljava/lang/String;)Ljava/lang/String;
    .locals 9

    .line 89
    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v0

    const/16 v1, 0x17

    if-gt v0, v1, :cond_0

    return-object p0

    .line 93
    :cond_0
    invoke-virtual {p0}, Ljava/lang/String;->toCharArray()[C

    move-result-object p0

    .line 94
    array-length v0, p0

    const/4 v2, 0x0

    const/4 v3, 0x0

    const/4 v4, 0x0

    const/4 v5, 0x0

    :goto_0
    const/16 v6, 0x2e

    if-ge v3, v0, :cond_4

    .line 99
    aget-char v7, p0, v3

    if-ne v7, v6, :cond_3

    .line 102
    aget-char v4, p0, v5

    if-eq v4, v6, :cond_1

    add-int/lit8 v5, v5, 0x1

    :cond_1
    move v4, v5

    add-int/lit8 v5, v3, 0x1

    if-ge v5, v0, :cond_2

    .line 108
    aget-char v5, p0, v5

    if-eq v5, v6, :cond_2

    add-int/lit8 v5, v4, 0x1

    goto :goto_1

    :cond_2
    move v5, v4

    .line 113
    :cond_3
    :goto_1
    aget-char v6, p0, v3

    aput-char v6, p0, v4

    add-int/lit8 v3, v3, 0x1

    add-int/lit8 v4, v4, 0x1

    goto :goto_0

    :cond_4
    if-le v4, v1, :cond_9

    add-int/lit8 v5, v5, -0x1

    const/4 v0, 0x0

    const/4 v3, 0x0

    :goto_2
    if-ge v0, v4, :cond_7

    .line 122
    aget-char v7, p0, v0

    if-ne v7, v6, :cond_5

    if-ne v0, v5, :cond_6

    const/16 v7, 0x16

    if-lt v3, v7, :cond_5

    goto :goto_3

    :cond_5
    add-int/lit8 v7, v3, 0x1

    .line 126
    aget-char v8, p0, v0

    aput-char v8, p0, v3

    move v3, v7

    :cond_6
    :goto_3
    add-int/lit8 v0, v0, 0x1

    goto :goto_2

    :cond_7
    if-le v3, v1, :cond_8

    goto :goto_4

    :cond_8
    move v1, v3

    goto :goto_4

    :cond_9
    move v1, v4

    .line 136
    :goto_4
    new-instance v0, Ljava/lang/String;

    invoke-direct {v0, p0, v2, v1}, Ljava/lang/String;-><init>([CII)V

    return-object v0
.end method

.method private final getConfig(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;
    .locals 7

    .line 140
    sget-boolean v0, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v0, :cond_0

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v0

    goto :goto_0

    :cond_0
    const-wide/16 v0, 0x0

    .line 141
    :goto_0
    iget-object v2, p0, Luk/uuid/slf4j/android/LoggerFactory;->loggingConfig:Luk/uuid/slf4j/android/LoggingConfig;

    invoke-virtual {v2, p1}, Luk/uuid/slf4j/android/LoggingConfig;->get(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;

    move-result-object v2

    .line 143
    iget-object v3, v2, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v3

    if-nez v3, :cond_1

    .line 144
    invoke-static {p1}, Luk/uuid/slf4j/android/LoggerFactory;->createTag(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    iput-object v3, v2, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    .line 145
    sget-boolean v3, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v3, :cond_1

    .line 146
    sget-object v3, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    iget-object v4, v2, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    const-string v5, "Created tag {} for {}"

    invoke-interface {v3, v5, v4, p1}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 150
    :cond_1
    sget-boolean v3, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v3, :cond_2

    .line 151
    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v3

    .line 152
    sget-object v5, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    sget-object v6, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    sub-long/2addr v3, v0

    invoke-virtual {v6, v3, v4}, Ljava/util/concurrent/TimeUnit;->toMicros(J)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v0

    const-string v1, "Retrieved config for {} in {}\u00b5s"

    invoke-interface {v5, v1, p1, v0}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    :cond_2
    return-object v2
.end method


# virtual methods
.method public final getLogger(Ljava/lang/String;)Lorg/slf4j/Logger;
    .locals 8

    .line 55
    sget-boolean v0, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v0, :cond_0

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v0

    goto :goto_0

    :cond_0
    const-wide/16 v0, 0x0

    .line 56
    :goto_0
    iget-object v2, p0, Luk/uuid/slf4j/android/LoggerFactory;->loggerMap:Ljava/util/concurrent/ConcurrentMap;

    invoke-interface {v2, p1}, Ljava/util/concurrent/ConcurrentMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lorg/slf4j/Logger;

    if-eqz v2, :cond_2

    .line 58
    sget-boolean v3, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v3, :cond_1

    .line 59
    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v3

    .line 60
    sget-object v5, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    sget-object v6, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    sub-long/2addr v3, v0

    invoke-virtual {v6, v3, v4}, Ljava/util/concurrent/TimeUnit;->toMicros(J)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v0

    const-string v1, "Found logger {} in {}\u00b5s"

    invoke-interface {v5, v1, p1, v0}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    :cond_1
    return-object v2

    .line 64
    :cond_2
    new-instance v2, Luk/uuid/slf4j/android/LogAdapter;

    invoke-direct {p0, p1}, Luk/uuid/slf4j/android/LoggerFactory;->getConfig(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;

    move-result-object v3

    invoke-direct {v2, p1, v3}, Luk/uuid/slf4j/android/LogAdapter;-><init>(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V

    .line 65
    iget-object v3, p0, Luk/uuid/slf4j/android/LoggerFactory;->loggerMap:Ljava/util/concurrent/ConcurrentMap;

    invoke-interface {v3, p1, v2}, Ljava/util/concurrent/ConcurrentMap;->putIfAbsent(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Lorg/slf4j/Logger;

    .line 66
    sget-boolean v4, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v4, :cond_4

    .line 67
    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v4

    if-nez v3, :cond_3

    .line 69
    sget-object v6, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    sget-object v7, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    sub-long/2addr v4, v0

    invoke-virtual {v7, v4, v5}, Ljava/util/concurrent/TimeUnit;->toMicros(J)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v0

    const-string v1, "Created logger {} in {}\u00b5s"

    invoke-interface {v6, v1, p1, v0}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    goto :goto_1

    .line 71
    :cond_3
    sget-object v6, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    sget-object v7, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    sub-long/2addr v4, v0

    invoke-virtual {v7, v4, v5}, Ljava/util/concurrent/TimeUnit;->toMicros(J)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v0

    const-string v1, "Found existing logger {} in {}\u00b5s"

    invoke-interface {v6, v1, p1, v0}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    :cond_4
    :goto_1
    if-nez v3, :cond_5

    goto :goto_2

    :cond_5
    move-object v2, v3

    :goto_2
    return-object v2
.end method
