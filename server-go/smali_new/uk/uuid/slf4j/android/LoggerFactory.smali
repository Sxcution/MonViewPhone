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
    .registers 3

    .line 18
    new-instance v0, Luk/uuid/slf4j/android/LoggerConfig;

    const-string v1, "slf4j-android"

    invoke-direct {v0, v1}, Luk/uuid/slf4j/android/LoggerConfig;-><init>(Ljava/lang/String;)V

    .line 19
    const/4 v1, 0x1

    invoke-static {v1}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v1

    iput-object v1, v0, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    .line 20
    sget-object v1, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    invoke-virtual {v0, v1}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    .line 21
    new-instance v1, Luk/uuid/slf4j/android/LogAdapter;

    const-string v2, "uk.uuid.slf4j.android"

    invoke-direct {v1, v2, v0}, Luk/uuid/slf4j/android/LogAdapter;-><init>(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V

    .line 22
    sput-object v1, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    .line 23
    invoke-virtual {v1}, Luk/uuid/slf4j/android/LogAdapter;->isTraceEnabled()Z

    move-result v0

    sput-boolean v0, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    .line 24
    return-void
.end method

.method public constructor <init>()V
    .registers 4

    .line 10
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 14
    new-instance v0, Ljava/util/concurrent/ConcurrentHashMap;

    invoke-direct {v0}, Ljava/util/concurrent/ConcurrentHashMap;-><init>()V

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggerFactory;->loggerMap:Ljava/util/concurrent/ConcurrentMap;

    .line 15
    new-instance v0, Luk/uuid/slf4j/android/LoggingConfig;

    const-string v1, "config.properties"

    sget-object v2, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    invoke-direct {v0, v1, v2}, Luk/uuid/slf4j/android/LoggingConfig;-><init>(Ljava/lang/String;Lorg/slf4j/Logger;)V

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggerFactory;->loggingConfig:Luk/uuid/slf4j/android/LoggingConfig;

    return-void
.end method

.method static final createTag(Ljava/lang/String;)Ljava/lang/String;
    .registers 9

    .line 50
    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v0

    .line 51
    nop

    .line 52
    const/16 v1, 0x17

    if-gt v0, v1, :cond_a

    .line 53
    return-object p0

    .line 55
    :cond_a
    invoke-virtual {p0}, Ljava/lang/String;->toCharArray()[C

    move-result-object p0

    .line 56
    array-length v0, p0

    .line 57
    nop

    .line 58
    nop

    .line 59
    const/4 v2, 0x0

    const/4 v3, 0x0

    const/4 v4, 0x0

    const/4 v5, 0x0

    .line 60
    :goto_15
    const/16 v6, 0x2e

    if-ge v3, v0, :cond_3d

    .line 61
    aget-char v7, p0, v3

    if-ne v7, v6, :cond_34

    .line 62
    aget-char v4, p0, v5

    if-eq v4, v6, :cond_25

    .line 63
    add-int/lit8 v5, v5, 0x1

    move v4, v5

    goto :goto_26

    .line 62
    :cond_25
    move v4, v5

    .line 65
    :goto_26
    nop

    .line 66
    add-int/lit8 v5, v3, 0x1

    .line 67
    if-ge v5, v0, :cond_33

    aget-char v5, p0, v5

    if-ne v5, v6, :cond_30

    goto :goto_33

    :cond_30
    add-int/lit8 v5, v4, 0x1

    goto :goto_34

    :cond_33
    :goto_33
    move v5, v4

    .line 69
    :cond_34
    :goto_34
    aget-char v6, p0, v3

    aput-char v6, p0, v4

    .line 70
    add-int/lit8 v3, v3, 0x1

    .line 71
    add-int/lit8 v4, v4, 0x1

    goto :goto_15

    .line 73
    :cond_3d
    if-le v4, v1, :cond_5e

    .line 74
    add-int/lit8 v5, v5, -0x1

    .line 75
    nop

    .line 76
    const/4 v0, 0x0

    const/4 v3, 0x0

    :goto_44
    if-ge v0, v4, :cond_59

    .line 77
    aget-char v7, p0, v0

    if-ne v7, v6, :cond_50

    if-ne v0, v5, :cond_56

    const/16 v7, 0x16

    if-ge v3, v7, :cond_56

    .line 78
    :cond_50
    aget-char v7, p0, v0

    aput-char v7, p0, v3

    .line 79
    add-int/lit8 v3, v3, 0x1

    .line 76
    :cond_56
    add-int/lit8 v0, v0, 0x1

    goto :goto_44

    .line 82
    :cond_59
    if-gt v3, v1, :cond_5c

    .line 83
    move v1, v3

    .line 85
    :cond_5c
    move v4, v1

    goto :goto_5f

    .line 86
    :cond_5e
    nop

    .line 88
    :goto_5f
    new-instance v0, Ljava/lang/String;

    invoke-direct {v0, p0, v2, v4}, Ljava/lang/String;-><init>([CII)V

    return-object v0
.end method

.method private final getConfig(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;
    .registers 9

    .line 92
    sget-boolean v0, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v0, :cond_9

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v0

    goto :goto_b

    :cond_9
    const-wide/16 v0, 0x0

    .line 93
    :goto_b
    iget-object v2, p0, Luk/uuid/slf4j/android/LoggerFactory;->loggingConfig:Luk/uuid/slf4j/android/LoggingConfig;

    invoke-virtual {v2, p1}, Luk/uuid/slf4j/android/LoggingConfig;->get(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;

    move-result-object v2

    .line 94
    iget-object v3, v2, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v3

    if-nez v3, :cond_2c

    .line 95
    invoke-static {p1}, Luk/uuid/slf4j/android/LoggerFactory;->createTag(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    iput-object v3, v2, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    .line 96
    sget-boolean v3, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v3, :cond_2c

    .line 97
    sget-object v3, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    const-string v4, "Created tag {} for {}"

    iget-object v5, v2, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    invoke-interface {v3, v4, v5, p1}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 100
    :cond_2c
    sget-boolean v3, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v3, :cond_46

    .line 101
    sget-object v3, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    sget-object v4, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v5

    sub-long/2addr v5, v0

    invoke-virtual {v4, v5, v6}, Ljava/util/concurrent/TimeUnit;->toMicros(J)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v0

    const-string v1, "Retrieved config for {} in {}\u00b5s"

    invoke-interface {v3, v1, p1, v0}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 103
    :cond_46
    return-object v2
.end method


# virtual methods
.method public final getLogger(Ljava/lang/String;)Lorg/slf4j/Logger;
    .registers 10

    .line 28
    sget-boolean v0, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v0, :cond_9

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v0

    goto :goto_b

    :cond_9
    const-wide/16 v0, 0x0

    .line 29
    :goto_b
    iget-object v2, p0, Luk/uuid/slf4j/android/LoggerFactory;->loggerMap:Ljava/util/concurrent/ConcurrentMap;

    invoke-interface {v2, p1}, Ljava/util/concurrent/ConcurrentMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lorg/slf4j/Logger;

    .line 30
    if-eqz v2, :cond_30

    .line 31
    sget-boolean v3, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v3, :cond_2f

    .line 32
    sget-object v3, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    sget-object v4, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v5

    sub-long/2addr v5, v0

    invoke-virtual {v4, v5, v6}, Ljava/util/concurrent/TimeUnit;->toMicros(J)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v0

    const-string v1, "Found logger {} in {}\u00b5s"

    invoke-interface {v3, v1, p1, v0}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 34
    :cond_2f
    return-object v2

    .line 36
    :cond_30
    new-instance v2, Luk/uuid/slf4j/android/LogAdapter;

    invoke-direct {p0, p1}, Luk/uuid/slf4j/android/LoggerFactory;->getConfig(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;

    move-result-object v3

    invoke-direct {v2, p1, v3}, Luk/uuid/slf4j/android/LogAdapter;-><init>(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V

    .line 37
    iget-object v3, p0, Luk/uuid/slf4j/android/LoggerFactory;->loggerMap:Ljava/util/concurrent/ConcurrentMap;

    invoke-interface {v3, p1, v2}, Ljava/util/concurrent/ConcurrentMap;->putIfAbsent(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Lorg/slf4j/Logger;

    .line 38
    sget-boolean v4, Luk/uuid/slf4j/android/LoggerFactory;->TRACE:Z

    if-eqz v4, :cond_70

    .line 39
    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v4

    .line 40
    if-nez v3, :cond_5e

    .line 41
    sget-object v6, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    sget-object v7, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    sub-long/2addr v4, v0

    invoke-virtual {v7, v4, v5}, Ljava/util/concurrent/TimeUnit;->toMicros(J)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v0

    const-string v1, "Created logger {} in {}\u00b5s"

    invoke-interface {v6, v1, p1, v0}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    goto :goto_70

    .line 43
    :cond_5e
    sget-object v6, Luk/uuid/slf4j/android/LoggerFactory;->LOG:Lorg/slf4j/Logger;

    sget-object v7, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    sub-long/2addr v4, v0

    invoke-virtual {v7, v4, v5}, Ljava/util/concurrent/TimeUnit;->toMicros(J)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v0

    const-string v1, "Found existing logger {} in {}\u00b5s"

    invoke-interface {v6, v1, p1, v0}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 46
    :cond_70
    :goto_70
    if-nez v3, :cond_73

    goto :goto_74

    :cond_73
    move-object v2, v3

    :goto_74
    return-object v2
.end method
