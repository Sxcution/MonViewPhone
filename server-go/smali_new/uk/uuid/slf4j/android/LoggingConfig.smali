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

    .line 17
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 15
    new-instance v0, Luk/uuid/slf4j/android/CategoryMap;

    invoke-direct {v0}, Luk/uuid/slf4j/android/CategoryMap;-><init>()V

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    .line 18
    invoke-interface {p2}, Lorg/slf4j/Logger;->isTraceEnabled()Z

    move-result v0

    if-eqz v0, :cond_15

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v0

    goto :goto_17

    :cond_15
    const-wide/16 v0, 0x0

    .line 19
    :goto_17
    new-instance v2, Ljava/util/Properties;

    invoke-direct {v2}, Ljava/util/Properties;-><init>()V

    .line 20
    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v3

    invoke-virtual {v3, p1}, Ljava/lang/Class;->getResource(Ljava/lang/String;)Ljava/net/URL;

    move-result-object v3

    .line 21
    if-nez v3, :cond_41

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v3

    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    const-string v5, "/eu/lp0/slf4j/android/"

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    invoke-virtual {v4, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v3, p1}, Ljava/lang/Class;->getResource(Ljava/lang/String;)Ljava/net/URL;

    move-result-object v3

    .line 22
    :cond_41
    if-eqz v3, :cond_5a

    .line 23
    const-string p1, "Loading properties file from {}"

    invoke-interface {p2, p1, v3}, Lorg/slf4j/Logger;->debug(Ljava/lang/String;Ljava/lang/Object;)V

    .line 25
    :try_start_48
    invoke-virtual {v3}, Ljava/net/URL;->openStream()Ljava/io/InputStream;

    move-result-object p1

    invoke-virtual {v2, p1}, Ljava/util/Properties;->load(Ljava/io/InputStream;)V
    :try_end_4f
    .catch Ljava/io/IOException; {:try_start_48 .. :try_end_4f} :catch_50

    goto :goto_59

    .line 26
    :catch_50
    move-exception p1

    .line 27
    const-string v4, "Error loading properties file from {}"

    invoke-interface {p2, v4, v3, p1}, Lorg/slf4j/Logger;->error(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 28
    invoke-virtual {v2}, Ljava/util/Properties;->clear()V

    .line 29
    :goto_59
    goto :goto_5f

    .line 31
    :cond_5a
    const-string p1, "No config file"

    invoke-interface {p2, p1}, Lorg/slf4j/Logger;->debug(Ljava/lang/String;)V

    .line 33
    :goto_5f
    invoke-virtual {v2}, Ljava/util/Properties;->entrySet()Ljava/util/Set;

    move-result-object p1

    invoke-interface {p1}, Ljava/util/Set;->iterator()Ljava/util/Iterator;

    move-result-object p1

    :goto_67
    invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z

    move-result v2

    if-eqz v2, :cond_1a6

    invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Ljava/util/Map$Entry;

    .line 34
    invoke-interface {v2}, Ljava/util/Map$Entry;->getKey()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/lang/String;

    .line 35
    invoke-interface {v2}, Ljava/util/Map$Entry;->getValue()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Ljava/lang/String;

    .line 36
    nop

    .line 37
    const-string v4, "tag"

    invoke-virtual {v3, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    const/16 v5, 0x2e

    const-string v6, ""

    if-eqz v4, :cond_c6

    .line 38
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    const/4 v7, 0x3

    if-eq v4, v7, :cond_9e

    .line 39
    invoke-virtual {v3, v7}, Ljava/lang/String;->charAt(I)C

    move-result v4

    if-ne v4, v5, :cond_9e

    .line 40
    const/4 v4, 0x4

    invoke-virtual {v3, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v6

    .line 43
    :cond_9e
    invoke-virtual {v2}, Ljava/lang/String;->length()I

    move-result v3

    const/16 v4, 0x17

    if-le v3, v4, :cond_ba

    .line 44
    invoke-virtual {v6}, Ljava/lang/String;->length()I

    move-result v3

    if-nez v3, :cond_b3

    .line 45
    const-string v3, "Ignoring invalid default tag {}"

    invoke-interface {p2, v3, v2}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;)V

    goto/16 :goto_1a4

    .line 47
    :cond_b3
    const-string v3, "Ignoring invalid tag {} for {}"

    invoke-interface {p2, v3, v2, v6}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    goto/16 :goto_1a4

    .line 50
    :cond_ba
    iget-object v3, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    new-instance v4, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-direct {v4, v2}, Luk/uuid/slf4j/android/LoggerConfig;-><init>(Ljava/lang/String;)V

    invoke-virtual {v3, v6, v4}, Luk/uuid/slf4j/android/CategoryMap;->put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V

    goto/16 :goto_1a4

    .line 52
    :cond_c6
    const-string v4, "level"

    invoke-virtual {v3, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :cond_11f

    .line 53
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    const/4 v7, 0x5

    if-eq v4, v7, :cond_109

    .line 54
    invoke-virtual {v3, v7}, Ljava/lang/String;->charAt(I)C

    move-result v4

    if-ne v4, v5, :cond_1a4

    .line 55
    const/4 v4, 0x6

    invoke-virtual {v3, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v3

    .line 57
    :try_start_e0
    iget-object v4, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    new-instance v5, Luk/uuid/slf4j/android/LoggerConfig;

    sget-object v6, Ljava/util/Locale;->ENGLISH:Ljava/util/Locale;

    invoke-virtual {v2, v6}, Ljava/lang/String;->toUpperCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object v6

    invoke-static {v6}, Luk/uuid/slf4j/android/LogLevel;->valueOf(Ljava/lang/String;)Luk/uuid/slf4j/android/LogLevel;

    move-result-object v6

    invoke-direct {v5, v6}, Luk/uuid/slf4j/android/LoggerConfig;-><init>(Luk/uuid/slf4j/android/LogLevel;)V

    invoke-virtual {v4, v3, v5}, Luk/uuid/slf4j/android/CategoryMap;->put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V
    :try_end_f4
    .catch Ljava/lang/IllegalArgumentException; {:try_start_e0 .. :try_end_f4} :catch_f5

    goto :goto_107

    .line 58
    :catch_f5
    move-exception v4

    .line 59
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    if-nez v4, :cond_102

    .line 60
    const-string v3, "Ignoring invalid default log level {}"

    invoke-interface {p2, v3, v2}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;)V

    goto :goto_107

    .line 62
    :cond_102
    const-string v4, "Ignoring invalid log level {} for {}"

    invoke-interface {p2, v4, v2, v3}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 64
    :goto_107
    goto/16 :goto_1a4

    .line 67
    :cond_109
    iget-object v3, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    new-instance v4, Luk/uuid/slf4j/android/LoggerConfig;

    sget-object v5, Ljava/util/Locale;->ENGLISH:Ljava/util/Locale;

    invoke-virtual {v2, v5}, Ljava/lang/String;->toUpperCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Luk/uuid/slf4j/android/LogLevel;->valueOf(Ljava/lang/String;)Luk/uuid/slf4j/android/LogLevel;

    move-result-object v2

    invoke-direct {v4, v2}, Luk/uuid/slf4j/android/LoggerConfig;-><init>(Luk/uuid/slf4j/android/LogLevel;)V

    invoke-virtual {v3, v6, v4}, Luk/uuid/slf4j/android/CategoryMap;->put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V

    goto/16 :goto_1a4

    .line 69
    :cond_11f
    const-string v4, "showName"

    invoke-virtual {v3, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :cond_178

    .line 70
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    const/16 v7, 0x8

    if-eq v4, v7, :cond_163

    .line 71
    invoke-virtual {v3, v7}, Ljava/lang/String;->charAt(I)C

    move-result v4

    if-ne v4, v5, :cond_1a4

    .line 72
    const/16 v4, 0x9

    invoke-virtual {v3, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v3

    .line 74
    :try_start_13b
    iget-object v4, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    new-instance v5, Luk/uuid/slf4j/android/LoggerConfig;

    sget-object v6, Ljava/util/Locale;->ENGLISH:Ljava/util/Locale;

    invoke-virtual {v2, v6}, Ljava/lang/String;->toUpperCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object v6

    invoke-static {v6}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->valueOf(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    move-result-object v6

    invoke-direct {v5, v6}, Luk/uuid/slf4j/android/LoggerConfig;-><init>(Luk/uuid/slf4j/android/LoggerConfig$ShowName;)V

    invoke-virtual {v4, v3, v5}, Luk/uuid/slf4j/android/CategoryMap;->put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V
    :try_end_14f
    .catch Ljava/lang/IllegalArgumentException; {:try_start_13b .. :try_end_14f} :catch_150

    goto :goto_162

    .line 75
    :catch_150
    move-exception v4

    .line 76
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    if-nez v4, :cond_15d

    .line 77
    const-string v3, "Ignoring invalid default show name setting {}"

    invoke-interface {p2, v3, v2}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;)V

    goto :goto_162

    .line 79
    :cond_15d
    const-string v4, "Ignoring invalid show name setting {} for {}"

    invoke-interface {p2, v4, v2, v3}, Lorg/slf4j/Logger;->warn(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 81
    :goto_162
    goto :goto_1a4

    .line 84
    :cond_163
    iget-object v3, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    new-instance v4, Luk/uuid/slf4j/android/LoggerConfig;

    sget-object v5, Ljava/util/Locale;->ENGLISH:Ljava/util/Locale;

    invoke-virtual {v2, v5}, Ljava/lang/String;->toUpperCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object v2

    invoke-static {v2}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->valueOf(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    move-result-object v2

    invoke-direct {v4, v2}, Luk/uuid/slf4j/android/LoggerConfig;-><init>(Luk/uuid/slf4j/android/LoggerConfig$ShowName;)V

    invoke-virtual {v3, v6, v4}, Luk/uuid/slf4j/android/CategoryMap;->put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V

    goto :goto_1a4

    .line 86
    :cond_178
    const-string v4, "showThread"

    invoke-virtual {v3, v4}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v4

    if-eqz v4, :cond_1a4

    .line 87
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    const/16 v7, 0xa

    if-eq v4, v7, :cond_194

    .line 88
    invoke-virtual {v3, v7}, Ljava/lang/String;->charAt(I)C

    move-result v4

    if-ne v4, v5, :cond_194

    .line 89
    const/16 v4, 0xb

    invoke-virtual {v3, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v6

    .line 92
    :cond_194
    new-instance v3, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-direct {v3}, Luk/uuid/slf4j/android/LoggerConfig;-><init>()V

    .line 93
    invoke-static {v2}, Ljava/lang/Boolean;->valueOf(Ljava/lang/String;)Ljava/lang/Boolean;

    move-result-object v2

    iput-object v2, v3, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    .line 94
    iget-object v2, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    invoke-virtual {v2, v6, v3}, Luk/uuid/slf4j/android/CategoryMap;->put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V

    .line 96
    :cond_1a4
    :goto_1a4
    goto/16 :goto_67

    .line 97
    :cond_1a6
    invoke-interface {p2}, Lorg/slf4j/Logger;->isTraceEnabled()Z

    move-result p1

    if-eqz p1, :cond_1c0

    .line 98
    sget-object p1, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v2

    sub-long/2addr v2, v0

    invoke-virtual {p1, v2, v3}, Ljava/util/concurrent/TimeUnit;->toMicros(J)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object p1

    const-string v0, "Config processing completed in {}\u00b5s"

    invoke-interface {p2, v0, p1}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;)V

    .line 100
    :cond_1c0
    return-void
.end method


# virtual methods
.method final get(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;
    .registers 3

    .line 103
    iget-object v0, p0, Luk/uuid/slf4j/android/LoggingConfig;->map:Luk/uuid/slf4j/android/CategoryMap;

    invoke-virtual {v0, p1}, Luk/uuid/slf4j/android/CategoryMap;->get(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;

    move-result-object p1

    return-object p1
.end method
