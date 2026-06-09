.class public Lcom/genymobile/scrcpy/CodecOption;
.super Ljava/lang/Object;
.source "CodecOption.java"


# instance fields
.field private key:Ljava/lang/String;

.field private value:Ljava/lang/Object;


# direct methods
.method public constructor <init>(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 3

    .line 11
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 12
    iput-object p1, p0, Lcom/genymobile/scrcpy/CodecOption;->key:Ljava/lang/String;

    .line 13
    iput-object p2, p0, Lcom/genymobile/scrcpy/CodecOption;->value:Ljava/lang/Object;

    .line 14
    return-void
.end method

.method public static parse(Ljava/lang/String;)Ljava/util/List;
    .registers 9
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Ljava/lang/String;",
            ")",
            "Ljava/util/List<",
            "Lcom/genymobile/scrcpy/CodecOption;",
            ">;"
        }
    .end annotation

    .line 25
    const-string v0, "-"

    invoke-virtual {v0, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_a

    .line 26
    const/4 p0, 0x0

    return-object p0

    .line 28
    :cond_a
    new-instance v0, Ljava/util/ArrayList;

    invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V

    .line 29
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    .line 30
    nop

    .line 31
    invoke-virtual {p0}, Ljava/lang/String;->toCharArray()[C

    move-result-object p0

    array-length v2, p0

    const/4 v3, 0x0

    const/4 v4, 0x0

    const/4 v5, 0x0

    :goto_1d
    if-ge v4, v2, :cond_4e

    aget-char v6, p0, v4

    .line 32
    const/16 v7, 0x2c

    if-eq v6, v7, :cond_36

    .line 33
    const/16 v7, 0x5c

    if-eq v6, v7, :cond_2d

    .line 34
    invoke-virtual {v1, v6}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    goto :goto_4b

    .line 35
    :cond_2d
    if-eqz v5, :cond_34

    .line 36
    invoke-virtual {v1, v7}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    .line 37
    const/4 v5, 0x0

    goto :goto_4b

    .line 39
    :cond_34
    const/4 v5, 0x1

    goto :goto_4b

    .line 41
    :cond_36
    if-eqz v5, :cond_3d

    .line 42
    invoke-virtual {v1, v7}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    .line 43
    const/4 v5, 0x0

    goto :goto_4b

    .line 45
    :cond_3d
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v6

    invoke-static {v6}, Lcom/genymobile/scrcpy/CodecOption;->parseOption(Ljava/lang/String;)Lcom/genymobile/scrcpy/CodecOption;

    move-result-object v6

    invoke-virtual {v0, v6}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    .line 46
    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->setLength(I)V

    .line 31
    :goto_4b
    add-int/lit8 v4, v4, 0x1

    goto :goto_1d

    .line 49
    :cond_4e
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->length()I

    move-result p0

    if-lez p0, :cond_5f

    .line 50
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/CodecOption;->parseOption(Ljava/lang/String;)Lcom/genymobile/scrcpy/CodecOption;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    .line 52
    :cond_5f
    return-object v0
.end method

.method private static parseOption(Ljava/lang/String;)Lcom/genymobile/scrcpy/CodecOption;
    .registers 10

    .line 64
    const/16 v0, 0x3d

    invoke-virtual {p0, v0}, Ljava/lang/String;->indexOf(I)I

    move-result v0

    .line 65
    nop

    .line 66
    const/4 v1, -0x1

    if-eq v0, v1, :cond_ac

    .line 69
    const/4 v2, 0x0

    invoke-virtual {p0, v2, v0}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v3

    .line 70
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    if-eqz v4, :cond_a4

    .line 73
    const/16 v4, 0x3a

    invoke-virtual {v3, v4}, Ljava/lang/String;->indexOf(I)I

    move-result v4

    .line 74
    const-string v5, "int"

    const/4 v6, 0x1

    if-eq v4, v1, :cond_2a

    .line 75
    invoke-virtual {v3, v2, v4}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v7

    .line 76
    add-int/2addr v4, v6

    invoke-virtual {v3, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v3

    goto :goto_2d

    .line 78
    :cond_2a
    nop

    .line 79
    move-object v7, v3

    move-object v3, v5

    .line 81
    :goto_2d
    add-int/2addr v0, v6

    invoke-virtual {p0, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p0

    .line 83
    invoke-virtual {v3}, Ljava/lang/String;->hashCode()I

    move-result v0

    const/4 v4, 0x2

    const/4 v8, 0x3

    sparse-switch v0, :sswitch_data_b4

    goto :goto_61

    .line 100
    :sswitch_3c
    const-string v0, "float"

    invoke-virtual {v3, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_61

    .line 101
    const/4 v1, 0x2

    goto :goto_61

    .line 95
    :sswitch_46
    const-string v0, "long"

    invoke-virtual {v3, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_61

    .line 96
    const/4 v1, 0x1

    goto :goto_61

    .line 90
    :sswitch_50
    invoke-virtual {v3, v5}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_61

    .line 91
    const/4 v1, 0x0

    goto :goto_61

    .line 85
    :sswitch_58
    const-string v0, "string"

    invoke-virtual {v3, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_61

    .line 86
    const/4 v1, 0x3

    .line 105
    :cond_61
    :goto_61
    if-nez v1, :cond_6c

    .line 106
    invoke-static {p0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p0

    invoke-static {p0}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p0

    goto :goto_85

    .line 107
    :cond_6c
    if-ne v1, v6, :cond_77

    .line 108
    invoke-static {p0}, Ljava/lang/Long;->parseLong(Ljava/lang/String;)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object p0

    goto :goto_85

    .line 109
    :cond_77
    if-ne v1, v4, :cond_82

    .line 110
    invoke-static {p0}, Ljava/lang/Float;->parseFloat(Ljava/lang/String;)F

    move-result p0

    invoke-static {p0}, Ljava/lang/Float;->valueOf(F)Ljava/lang/Float;

    move-result-object p0

    goto :goto_85

    .line 111
    :cond_82
    if-ne v1, v8, :cond_8b

    .line 112
    nop

    .line 116
    :goto_85
    new-instance v0, Lcom/genymobile/scrcpy/CodecOption;

    invoke-direct {v0, v7, p0}, Lcom/genymobile/scrcpy/CodecOption;-><init>(Ljava/lang/String;Ljava/lang/Object;)V

    return-object v0

    .line 114
    :cond_8b
    new-instance p0, Ljava/lang/IllegalArgumentException;

    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Invalid codec option type (int, long, float, str): "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-direct {p0, v0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 71
    :cond_a4
    new-instance p0, Ljava/lang/IllegalArgumentException;

    const-string v0, "Key may not be null"

    invoke-direct {p0, v0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 67
    :cond_ac
    new-instance p0, Ljava/lang/IllegalArgumentException;

    const-string v0, "\'=\' expected"

    invoke-direct {p0, v0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    :sswitch_data_b4
    .sparse-switch
        -0x352a9fef -> :sswitch_58
        0x197ef -> :sswitch_50
        0x32c67c -> :sswitch_46
        0x5d0225c -> :sswitch_3c
    .end sparse-switch
.end method


# virtual methods
.method public getKey()Ljava/lang/String;
    .registers 2

    .line 17
    iget-object v0, p0, Lcom/genymobile/scrcpy/CodecOption;->key:Ljava/lang/String;

    return-object v0
.end method

.method public getValue()Ljava/lang/Object;
    .registers 2

    .line 21
    iget-object v0, p0, Lcom/genymobile/scrcpy/CodecOption;->value:Ljava/lang/Object;

    return-object v0
.end method
