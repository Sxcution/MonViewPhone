.class final Luk/uuid/slf4j/android/LoggingConfig;
.super Ljava/lang/Object;
.source "LoggingConfig.java"


# static fields
.field public static final DEFAULT_FILENAME:Ljava/lang/String; = "config.properties"


# instance fields
.field private final map:Luk/uuid/slf4j/android/CategoryMap;


# direct methods
.method constructor <init>(Ljava/lang/String;Lorg/slf4j/Logger;)V
    .registers 11

    .line 44
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 42
    new-instance v0, Luk/uuid/slf4j/android/CategoryMap;

    invoke-direct {v0}, Luk/uuid/slf4j/android/CategoryMap;-><init>()V

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    .line 45
    invoke-interface {p2}, Lorg/slf4j/Logger;->isTraceEnabled()Z

    move-result v0

    if-eqz v0, :cond_15

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v0

    goto :goto_17

    :cond_15
    const-wide/16 v0, 0x0

    .line 46
    :goto_17
    new-instance v2, Ljava/util/Properties;

    invoke-direct {v2}, Ljava/util/Properties;-><init>()V

    .line 47
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v3

    invoke-virtual {v3, p1}, Ljava/lang/Class;->getResource(Ljava/lang/String;)Ljava/net/URL;

    move-result-object v3

    if-nez v3, :cond_3f

    .line 51
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v3

    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    const-string v5, "/eu/lp0/slf4j/android/"

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v3, p1}, Ljava/lang/Class;->getResource(Ljava/lang/String;)Ljava/net/URL;

    move-result-object v3

    :cond_3f
    if-eqz v3, :cond_58

    const-string p1, "Loading properties file from {}"

    .line 55
    invoke-interface {p2, p1, v3}, Lorg/slf4j/Logger;->debug(Ljava/lang/String;Ljava/lang/Object;)V

    .line 58
    :try_start_46
    invoke-virtual {v3}, Ljava/net/URL;->openStream()Ljava/io/InputStream;

    move-result-object p1

    invoke-virtual {v2, p1}, Ljava/util/Properties;->load(Ljava/io/InputStream;)V
    :try_end_4d
    .catch Ljava/io/IOException; {:try_start_46 .. :try_end_4d} :catch_4e

    goto :goto_5d

    :catch_4e
    move-exception p1

    const-string v4, "Error loading properties file from {}"

    .line 60
    invoke-interface {p2, v4, v3, p1}, Lorg/slf4j/Logger;->error(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 61
    invoke-virtual {v2}, Ljava/util/Properties;->clear()V

    goto :goto_5d

    :cond_58
    const-string p1, "No config file"

    .line 64
    invoke-interface {p2, p1}, Lorg/slf4j/Logger;->debug(Ljava/lang/String;)V

    .line 67
    :goto_5d
    invoke-virtual {v2}, Ljava/util/Properties;->entrySet()Ljava/util/Set;

    move-result-object p1

    invoke-interface {p1}, Ljava/util/Set;->iterator()Ljava/util/Iterator;

    move-result-object p1

    :cond_65
    :goto_65
    invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z

    move-result v2

    if-eqz v2, :cond_17e

    invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Ljava/util/Map$Entry;

    .line 68
    invoke-interface {v2}, Ljava/util/Map$Entry;->getKey()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/lang/String;

    .line 69
    invoke-interface {v2}, Ljava/util/Map$Entry;->getValue()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Ljava/lang/String;

    const-string v4, "tag"

    .line 71
    invoke-virtual {v3, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    const-string v5, ""

    const/16 v6, 0x2e

    if-eqz v4, :cond_c1

    .line 72
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    const/4 v7, 0x3

    if-ne v4, v7, :cond_91

    goto :goto_9c

    .line 74
    :cond_91
    invoke-virtual {v3, v7}, Ljava/lang/String;->charAt(I)C

    move-result v4

    if-ne v4, v6, :cond_65

    const/4 v4, 0x4

    .line 75
    invoke-virtual {v3, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v5

    .line 80
    :goto_9c
    invoke-virtual {v2}, Ljava/lang/String;->length()I

    move-result v3

    const/16 v4, 0x17

    if-le v3, v4, :cond_b6

    .line 81
    invoke-virtual {v5}, Ljava/lang/String;->length()I

    move-result v3

    if-nez v3, :cond_b0

    const-string v3, "Ignoring invalid default tag {}"

    .line 82
    invoke-interface {p2, v3, v2}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;)V

    goto :goto_65

    :cond_b0
    const-string v3, "Ignoring invalid tag {} for {}"

    .line 84
    invoke-interface {p2, v3, v2, v5}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    goto :goto_65

    .line 87
    :cond_b6
    iget-object v3, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    new-instance v4, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-direct {v4, v2}, Luk/uuid/slf4j/android/LoggerConfig;-><init>(Ljava/lang/String;)V

    invoke-virtual {v3, v5, v4}, Luk/uuid/slf4j/android/CategoryMap;->put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V

    goto :goto_65

    :cond_c1
    const-string v4, "level"

    .line 89
    invoke-virtual {v3, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :cond_107

    .line 90
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    const/4 v7, 0x5

    if-ne v4, v7, :cond_d1

    goto :goto_dc

    .line 92
    :cond_d1
    invoke-virtual {v3, v7}, Ljava/lang/String;->charAt(I)C

    move-result v4

    if-ne v4, v6, :cond_65

    const/4 v4, 0x6

    .line 93
    invoke-virtual {v3, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v5

    .line 99
    :goto_dc
    :try_start_dc
    iget-object v3, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    new-instance v4, Luk/uuid/slf4j/android/LoggerConfig;

    sget-object v6, Ljava/util/Locale;->ENGLISH:Ljava/util/Locale;

    invoke-virtual {v2, v6}, Ljava/lang/String;->toUpperCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object v6

    invoke-static {v6}, Luk/uuid/slf4j/android/LogLevel;->valueOf(Ljava/lang/String;)Luk/uuid/slf4j/android/LogLevel;

    move-result-object v6

    invoke-direct {v4, v6}, Luk/uuid/slf4j/android/LoggerConfig;-><init>(Luk/uuid/slf4j/android/LogLevel;)V

    invoke-virtual {v3, v5, v4}, Luk/uuid/slf4j/android/CategoryMap;->put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V
    :try_end_f0
    .catch Ljava/lang/IllegalArgumentException; {:try_start_dc .. :try_end_f0} :catch_f2

    goto/16 :goto_65

    :catch_f2
    nop

    .line 101
    invoke-virtual {v5}, Ljava/lang/String;->length()I

    move-result v3

    if-nez v3, :cond_100

    const-string v3, "Ignoring invalid default log level {}"

    .line 102
    invoke-interface {p2, v3, v2}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;)V

    goto/16 :goto_65

    :cond_100
    const-string v3, "Ignoring invalid log level {} for {}"

    .line 104
    invoke-interface {p2, v3, v2, v5}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    goto/16 :goto_65

    :cond_107
    const-string v4, "showName"

    .line 107
    invoke-virtual {v3, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :cond_14f

    .line 108
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    const/16 v7, 0x8

    if-ne v4, v7, :cond_118

    goto :goto_124

    .line 110
    :cond_118
    invoke-virtual {v3, v7}, Ljava/lang/String;->charAt(I)C

    move-result v4

    if-ne v4, v6, :cond_65

    const/16 v4, 0x9

    .line 111
    invoke-virtual {v3, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v5

    .line 117
    :goto_124
    :try_start_124
    iget-object v3, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    new-instance v4, Luk/uuid/slf4j/android/LoggerConfig;

    sget-object v6, Ljava/util/Locale;->ENGLISH:Ljava/util/Locale;

    invoke-virtual {v2, v6}, Ljava/lang/String;->toUpperCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object v6

    invoke-static {v6}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->valueOf(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    move-result-object v6

    invoke-direct {v4, v6}, Luk/uuid/slf4j/android/LoggerConfig;-><init>(Luk/uuid/slf4j/android/LoggerConfig$ShowName;)V

    invoke-virtual {v3, v5, v4}, Luk/uuid/slf4j/android/CategoryMap;->put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V
    :try_end_138
    .catch Ljava/lang/IllegalArgumentException; {:try_start_124 .. :try_end_138} :catch_13a

    goto/16 :goto_65

    :catch_13a
    nop

    .line 119
    invoke-virtual {v5}, Ljava/lang/String;->length()I

    move-result v3

    if-nez v3, :cond_148

    const-string v3, "Ignoring invalid default show name setting {}"

    .line 120
    invoke-interface {p2, v3, v2}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;)V

    goto/16 :goto_65

    :cond_148
    const-string v3, "Ignoring invalid show name setting {} for {}"

    .line 122
    invoke-interface {p2, v3, v2, v5}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    goto/16 :goto_65

    :cond_14f
    const-string v4, "showThread"

    .line 125
    invoke-virtual {v3, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :cond_65

    .line 126
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    const/16 v7, 0xa

    if-ne v4, v7, :cond_160

    goto :goto_16c

    .line 128
    :cond_160
    invoke-virtual {v3, v7}, Ljava/lang/String;->charAt(I)C

    move-result v4

    if-ne v4, v6, :cond_65

    const/16 v4, 0xb

    .line 129
    invoke-virtual {v3, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v5

    .line 134
    :goto_16c
    new-instance v3, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-direct {v3}, Luk/uuid/slf4j/android/LoggerConfig;-><init>()V

    .line 135
    invoke-static {v2}, Ljava/lang/Boolean;->valueOf(Ljava/lang/String;)Ljava/lang/Boolean;

    move-result-object v2

    iput-object v2, v3, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    .line 136
    iget-object v2, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    invoke-virtual {v2, v5, v3}, Luk/uuid/slf4j/android/CategoryMap;->put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V

    goto/16 :goto_65

    .line 140
    :cond_17e
    invoke-interface {p2}, Lorg/slf4j/Logger;->isTraceEnabled()Z

    move-result p1

    if-eqz p1, :cond_198

    .line 141
    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v2

    .line 142
    sget-object p1, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    sub-long/2addr v2, v0

    invoke-virtual {p1, v2, v3}, Ljava/util/concurrent/TimeUnit;->toMicros(J)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object p1

    const-string v0, "Config processing completed in {}\u00b5s"

    invoke-interface {p2, v0, p1}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;)V

    :cond_198
    return-void
.end method


# virtual methods
.method final get(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;
    .registers 3

    .line 147
    iget-object v0, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    invoke-virtual {v0, p1}, Luk/uuid/slf4j/android/CategoryMap;->get(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;

    move-result-object p1

    return-object p1
.end method
