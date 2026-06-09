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
    .registers 2

    .line 10
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 8
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    iput-object v0, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    .line 11
    return-void
.end method


# virtual methods
.method final get(Ljava/lang/String;)Luk/uuid/slf4j/android/LoggerConfig;
    .registers 6

    .line 14
    new-instance v0, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-direct {v0}, Luk/uuid/slf4j/android/LoggerConfig;-><init>()V

    .line 15
    iget-object v1, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    invoke-interface {v1}, Ljava/util/Map;->isEmpty()Z

    move-result v1

    if-eqz v1, :cond_13

    .line 16
    sget-object p1, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    invoke-virtual {v0, p1}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    .line 17
    return-object v0

    .line 19
    :cond_13
    const-string v1, ""

    if-nez p1, :cond_18

    .line 20
    move-object p1, v1

    .line 23
    :cond_18
    :goto_18
    const/16 v2, 0x2e

    invoke-virtual {p1, v2}, Ljava/lang/String;->lastIndexOf(I)I

    move-result v2

    .line 24
    iget-object v3, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    invoke-interface {v3, p1}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-virtual {v0, v3}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    move-result v3

    if-eqz v3, :cond_2d

    .line 25
    return-object v0

    .line 27
    :cond_2d
    const/4 v3, -0x1

    if-eq v2, v3, :cond_36

    .line 28
    const/4 v3, 0x0

    invoke-virtual {p1, v3, v2}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object p1

    .line 35
    goto :goto_18

    .line 30
    :cond_36
    iget-object p1, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    invoke-interface {p1, v1}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-virtual {v0, p1}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    move-result p1

    if-nez p1, :cond_49

    .line 31
    sget-object p1, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    invoke-virtual {v0, p1}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    .line 33
    :cond_49
    return-object v0
.end method

.method final put(Ljava/lang/String;Luk/uuid/slf4j/android/LoggerConfig;)V
    .registers 4

    .line 39
    iget-object v0, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    invoke-interface {v0, p1}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Luk/uuid/slf4j/android/LoggerConfig;

    .line 40
    if-eqz v0, :cond_e

    .line 41
    invoke-virtual {v0, p2}, Luk/uuid/slf4j/android/LoggerConfig;->merge(Luk/uuid/slf4j/android/LoggerConfig;)Z

    goto :goto_13

    .line 43
    :cond_e
    iget-object v0, p0, Luk/uuid/slf4j/android/CategoryMap;->categories:Ljava/util/Map;

    invoke-interface {v0, p1, p2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 45
    :goto_13
    return-void
.end method
