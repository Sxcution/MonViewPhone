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
    .locals 2

    .line 26
    new-instance v0, Luk/uuid/slf4j/android/LoggerConfig;

    invoke-direct {v0}, Luk/uuid/slf4j/android/LoggerConfig;-><init>()V

    sput-object v0, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    const-string v1, ""

    .line 28
    iput-object v1, v0, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    .line 29
    sget-object v1, Luk/uuid/slf4j/android/LogLevel;->NATIVE:Luk/uuid/slf4j/android/LogLevel;

    iput-object v1, v0, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    .line 30
    sget-object v0, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    sget-object v1, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->FALSE:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    iput-object v1, v0, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    .line 31
    sget-object v0, Luk/uuid/slf4j/android/LoggerConfig;->DEFAULT:Luk/uuid/slf4j/android/LoggerConfig;

    const/4 v1, 0x0

    invoke-static {v1}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v1

    iput-object v1, v0, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    return-void
.end method

.method constructor <init>()V
    .locals 0

    .line 39
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method constructor <init>(Ljava/lang/String;)V
    .locals 0

    .line 42
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 43
    iput-object p1, p0, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    return-void
.end method

.method constructor <init>(Luk/uuid/slf4j/android/LogLevel;)V
    .locals 0

    .line 46
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 47
    iput-object p1, p0, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    return-void
.end method

.method constructor <init>(Luk/uuid/slf4j/android/LoggerConfig$ShowName;)V
    .locals 0

    .line 50
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 51
    iput-object p1, p0, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    return-void
.end method


# virtual methods
.method final isComplete()Z
    .locals 1

    .line 59
    iget-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    if-eqz v0, :cond_0

    iget-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    if-eqz v0, :cond_0

    iget-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    if-eqz v0, :cond_0

    iget-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    if-eqz v0, :cond_0

    const/4 v0, 0x1

    goto :goto_0

    :cond_0
    const/4 v0, 0x0

    :goto_0
    return v0
.end method

.method final merge(Luk/uuid/slf4j/android/LoggerConfig;)Z
    .locals 3

    if-nez p1, :cond_0

    .line 64
    invoke-virtual {p0}, Luk/uuid/slf4j/android/LoggerConfig;->isComplete()Z

    move-result p1

    return p1

    :cond_0
    const/4 v0, 0x1

    .line 68
    iget-object v1, p0, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    const/4 v2, 0x0

    if-nez v1, :cond_1

    .line 69
    iget-object v0, p1, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->tag:Ljava/lang/String;

    const/4 v0, 0x0

    .line 73
    :cond_1
    iget-object v1, p0, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    if-nez v1, :cond_2

    .line 74
    iget-object v0, p1, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->level:Luk/uuid/slf4j/android/LogLevel;

    const/4 v0, 0x0

    .line 78
    :cond_2
    iget-object v1, p0, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    if-nez v1, :cond_3

    .line 79
    iget-object v0, p1, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    iput-object v0, p0, Luk/uuid/slf4j/android/LoggerConfig;->showName:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    const/4 v0, 0x0

    .line 83
    :cond_3
    iget-object v1, p0, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    if-nez v1, :cond_4

    .line 84
    iget-object p1, p1, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    iput-object p1, p0, Luk/uuid/slf4j/android/LoggerConfig;->showThread:Ljava/lang/Boolean;

    goto :goto_0

    :cond_4
    move v2, v0

    :goto_0
    return v2
.end method
