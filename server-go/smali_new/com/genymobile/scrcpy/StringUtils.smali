.class public final Lcom/genymobile/scrcpy/StringUtils;
.super Ljava/lang/Object;
.source "StringUtils.java"


# direct methods
.method private constructor <init>()V
    .registers 1

    .line 5
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 6
    return-void
.end method

.method public static getUtf8TruncationIndex([BI)I
    .registers 4

    .line 9
    array-length v0, p0

    .line 10
    if-gt v0, p1, :cond_4

    .line 11
    return v0

    .line 13
    :cond_4
    :goto_4
    aget-byte v0, p0, p1

    and-int/lit16 v0, v0, 0x80

    if-eqz v0, :cond_14

    aget-byte v0, p0, p1

    const/16 v1, 0xc0

    and-int/2addr v0, v1

    if-eq v0, v1, :cond_14

    .line 14
    add-int/lit8 p1, p1, -0x1

    goto :goto_4

    .line 16
    :cond_14
    return p1
.end method
