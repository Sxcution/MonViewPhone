.class final Luk/uuid/slf4j/android/CategoryMap;
.super Ljava/lang/Object;
.source "CategoryMap.java"


# instance fields
.field private final categories:Ljava/util/Map;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/Map<",
            "Ljava/lang/String;",
            "Luk/uuid/slf4j/android/LoggerConfig;",
            ">;"
        }
    .end annotation
.end field


# direct methods
.method constructor <init>()V
    .locals 1

    .line 36
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 34
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    iput-object v0, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    return-void
.end method


# virtual methods
.method final get(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;
    .locals 4

    .line 43
    new-instance v0, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-direct {v0}, Luk/uuid/slf4j/android/LoggerConfig;-><init>()V

    .line 45
    iget-object v1, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    invoke-interface {v1}, Ljava/util/Map;->isEmpty()Z

    move-result v1

    if-eqz v1, :cond_0

    .line 46
    sget-object p1, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    invoke-virtual {v0, p1}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    return-object v0

    :cond_0
    const-string v1, ""

    if-nez p1, :cond_1

    move-object p1, v1

    :cond_1
    :goto_0
    const/16 v2, 0x2e

    .line 55
    invoke-virtual {p1, v2}, Ljava/lang/String;->lastIndexOf(I)I

    move-result v2

    .line 57
    iget-object v3, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    invoke-interface {v3, p1}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-virtual {v0, v3}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    move-result v3

    if-eqz v3, :cond_2

    return-object v0

    :cond_2
    const/4 v3, -0x1

    if-eq v2, v3, :cond_3

    const/4 v3, 0x0

    .line 61
    invoke-virtual {p1, v3, v2}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object p1

    goto :goto_0

    .line 63
    :cond_3
    iget-object p1, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    invoke-interface {p1, v1}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-virtual {v0, p1}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    move-result p1

    if-nez p1, :cond_4

    .line 64
    sget-object p1, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    invoke-virtual {v0, p1}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    :cond_4
    return-object v0
.end method

.method final put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V
    .locals 1

    .line 75
    iget-object v0, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    invoke-interface {v0, p1}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Luk/uuid/slf4j/android/LoggerConfig;

    if-eqz v0, :cond_0

    .line 77
    invoke-virtual {v0, p2}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    goto :goto_0

    .line 79
    :cond_0
    iget-object v0, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    invoke-interface {v0, p1, p2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    :goto_0
    return-void
.end method
