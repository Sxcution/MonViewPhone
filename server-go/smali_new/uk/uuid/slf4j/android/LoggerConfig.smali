.class final Luk/uuid/slf4j/android/LoggerConfig;
.super Ljava/lang/Object;
.source "LoggerConfig.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Luk/uuid/slf4j/android/LoggerConfig$ShowName;
    }
.end annotation


# static fields
.field static final DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;


# instance fields
.field level:Luk/uuid/slf4j/android/LogLevel;

.field showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

.field showThread:Ljava/lang/Boolean;

.field tag:Ljava/lang/String;


# direct methods
.method static constructor <clinit>()V
    .registers 2

    .line 20
    new-instance v0, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-direct {v0}, Luk/uuid/slf4j/android/LoggerConfig;-><init>()V

    .line 21
    sput-object v0, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    .line 22
    const-string v1, ""

    iput-object v1, v0, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    .line 23
    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->NATIVE:Luk/uuid/slf4j/android/LogLevel;

    iput-object v1, v0, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    .line 24
    sget-object v0, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    sget-object v1, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->FALSE:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    iput-object v1, v0, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    .line 25
    sget-object v0, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    const/4 v1, 0x0

    invoke-static {v1}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v1

    iput-object v1, v0, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    .line 26
    return-void
.end method

.method constructor <init>()V
    .registers 1

    .line 28
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 29
    return-void
.end method

.method constructor <init>(Ljava/lang/String;)V
    .registers 2

    .line 31
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 32
    iput-object p1, p0, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    .line 33
    return-void
.end method

.method constructor <init>(Luk/uuid/slf4j/android/LogLevel;)V
    .registers 2

    .line 35
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 36
    iput-object p1, p0, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    .line 37
    return-void
.end method

.method constructor <init>(Luk/uuid/slf4j/android/LoggerConfig$ShowName;)V
    .registers 2

    .line 39
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 40
    iput-object p1, p0, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    .line 41
    return-void
.end method


# virtual methods
.method final isComplete()Z
    .registers 2

    .line 44
    iget-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    if-eqz v0, :cond_13

    iget-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    if-eqz v0, :cond_13

    iget-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    if-eqz v0, :cond_13

    iget-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    if-nez v0, :cond_11

    goto :goto_13

    :cond_11
    const/4 v0, 0x1

    goto :goto_14

    :cond_13
    :goto_13
    const/4 v0, 0x0

    :goto_14
    return v0
.end method

.method final merge(Luk/uuid/slf4j/android/LoggerConfig;)Z
    .registers 5

    .line 48
    if-nez p1, :cond_7

    .line 49
    invoke-virtual {p0}, Luk/uuid/slf4j/android/LoggerConfig;->isComplete()Z

    move-result p1

    return p1

    .line 51
    :cond_7
    nop

    .line 52
    iget-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    const/4 v1, 0x0

    if-nez v0, :cond_13

    .line 53
    iget-object v0, p1, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    .line 54
    const/4 v0, 0x0

    goto :goto_14

    .line 52
    :cond_13
    const/4 v0, 0x1

    .line 56
    :goto_14
    iget-object v2, p0, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    if-nez v2, :cond_1d

    .line 57
    iget-object v0, p1, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    .line 58
    const/4 v0, 0x0

    .line 60
    :cond_1d
    iget-object v2, p0, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    if-nez v2, :cond_26

    .line 61
    iget-object v0, p1, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    .line 62
    const/4 v0, 0x0

    .line 64
    :cond_26
    iget-object v2, p0, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    if-eqz v2, :cond_2b

    .line 65
    return v0

    .line 67
    :cond_2b
    iget-object p1, p1, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    iput-object p1, p0, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    .line 68
    return v1
.end method
