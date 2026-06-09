.class Luk/uuid/slf4j/android/LogAdapter$AnonymousClass1;
.super Ljava/lang/Object;
.source "LogAdapter.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Luk/uuid/slf4j/android/LogAdapter;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x8
    name = "AnonymousClass1"
.end annotation


# static fields
.field static final $SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName:[I


# direct methods
.method static constructor <clinit>()V
    .registers 3

    .line 75
    invoke-static {}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->values()[Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    move-result-object v0

    array-length v0, v0

    new-array v0, v0, [I

    .line 76
    sput-object v0, Luk/uuid/slf4j/android/LogAdapter$AnonymousClass1;->$SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName:[I

    .line 78
    :try_start_9
    sget-object v1, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->CALLER:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    invoke-virtual {v1}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->ordinal()I

    move-result v1

    const/4 v2, 0x1

    aput v2, v0, v1
    :try_end_12
    .catch Ljava/lang/NoSuchFieldError; {:try_start_9 .. :try_end_12} :catch_13

    .line 80
    goto :goto_14

    .line 79
    :catch_13
    move-exception v0

    .line 82
    :goto_14
    :try_start_14
    sget-object v0, Luk/uuid/slf4j/android/LogAdapter$AnonymousClass1;->$SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName:[I

    sget-object v1, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->LONG:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    invoke-virtual {v1}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->ordinal()I

    move-result v1

    const/4 v2, 0x2

    aput v2, v0, v1
    :try_end_1f
    .catch Ljava/lang/NoSuchFieldError; {:try_start_14 .. :try_end_1f} :catch_20

    .line 84
    goto :goto_21

    .line 83
    :catch_20
    move-exception v0

    .line 86
    :goto_21
    :try_start_21
    sget-object v0, Luk/uuid/slf4j/android/LogAdapter$AnonymousClass1;->$SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName:[I

    sget-object v1, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->COMPACT:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    invoke-virtual {v1}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->ordinal()I

    move-result v1

    const/4 v2, 0x3

    aput v2, v0, v1
    :try_end_2c
    .catch Ljava/lang/NoSuchFieldError; {:try_start_21 .. :try_end_2c} :catch_2d

    .line 88
    goto :goto_2e

    .line 87
    :catch_2d
    move-exception v0

    .line 90
    :goto_2e
    :try_start_2e
    sget-object v0, Luk/uuid/slf4j/android/LogAdapter$AnonymousClass1;->$SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName:[I

    sget-object v1, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->SHORT:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    invoke-virtual {v1}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->ordinal()I

    move-result v1

    const/4 v2, 0x4

    aput v2, v0, v1
    :try_end_39
    .catch Ljava/lang/NoSuchFieldError; {:try_start_2e .. :try_end_39} :catch_3a

    .line 92
    goto :goto_3b

    .line 91
    :catch_3a
    move-exception v0

    .line 94
    :goto_3b
    :try_start_3b
    sget-object v0, Luk/uuid/slf4j/android/LogAdapter$AnonymousClass1;->$SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName:[I

    sget-object v1, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->FALSE:Luk/uuid/slf4j/android/LoggerConfig$ShowName;

    invoke-virtual {v1}, Luk/uuid/slf4j/android/LoggerConfig$ShowName;->ordinal()I

    move-result v1

    const/4 v2, 0x5

    aput v2, v0, v1
    :try_end_46
    .catch Ljava/lang/NoSuchFieldError; {:try_start_3b .. :try_end_46} :catch_47

    .line 96
    goto :goto_48

    .line 95
    :catch_47
    move-exception v0

    .line 97
    :goto_48
    return-void
.end method

.method constructor <init>()V
    .registers 1

    .line 71
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method
