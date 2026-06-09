.class public Lcom/genymobile/scrcpy/CodecOption;
.super Ljava/lang/Object;
.source "CodecOption.java"


# instance fields
.field private key:Ljava/lang/String;

.field private value:Ljava/lang/Object;


# direct methods
.method public constructor <init>(Ljava/lang/String;Ljava/lang/Object;)V
    .registers 3

    .line 10
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 11
    iput-object p1, p0, Lcom/genymobile/scrcpy/CodecOption;->key:Ljava/lang/String;

    .line 12
    iput-object p2, p0, Lcom/genymobile/scrcpy/CodecOption;->value:Ljava/lang/Object;

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

    const-string v0, "-"

    .line 24
    invoke-virtual {v0, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_a

    const/4 p0, 0x0

    return-object p0

    .line 28
    :cond_a
    new-instance v0, Ljava/util/ArrayList;

    invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V

    .line 31
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    .line 33
    invoke-virtual {p0}, Ljava/lang/String;->toCharArray()[C

    move-result-object p0

    array-length v2, p0

    const/4 v3, 0x0

    const/4 v4, 0x0

    const/4 v5, 0x0

    :goto_1c
    if-ge v4, v2, :cond_4c

    aget-char v6, p0, v4

    const/16 v7, 0x2c

    if-eq v6, v7, :cond_34

    const/16 v7, 0x5c

    if-eq v6, v7, :cond_2c

    .line 56
    invoke-virtual {v1, v6}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    goto :goto_49

    :cond_2c
    if-eqz v5, :cond_32

    .line 37
    invoke-virtual {v1, v7}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    goto :goto_39

    :cond_32
    const/4 v5, 0x1

    goto :goto_49

    :cond_34
    if-eqz v5, :cond_3b

    .line 45
    invoke-virtual {v1, v7}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    :goto_39
    const/4 v5, 0x0

    goto :goto_49

    .line 49
    :cond_3b
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v6

    .line 50
    invoke-static {v6}, Lcom/genymobile/scrcpy/CodecOption;->parseOption(Ljava/lang/String;)Lcom/genymobile/scrcpy/CodecOption;

    move-result-object v6

    invoke-interface {v0, v6}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    .line 52
    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->setLength(I)V

    :goto_49
    add-int/lit8 v4, v4, 0x1

    goto :goto_1c

    .line 61
    :cond_4c
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->length()I

    move-result p0

    if-lez p0, :cond_5d

    .line 62
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    .line 63
    invoke-static {p0}, Lcom/genymobile/scrcpy/CodecOption;->parseOption(Ljava/lang/String;)Lcom/genymobile/scrcpy/CodecOption;

    move-result-object p0

    invoke-interface {v0, p0}, Ljava/util/List;->add(Ljava/lang/Object;)Z

    :cond_5d
    return-object v0
.end method

.method private static parseOption(Ljava/lang/String;)Lcom/genymobile/scrcpy/CodecOption;
    .registers 10

    const/16 v0, 0x3d

    .line 70
    invoke-virtual {p0, v0}, Ljava/lang/String;->indexOf(I)I

    move-result v0

    const/4 v1, -0x1

    if-eq v0, v1, :cond_a7

    const/4 v2, 0x0

    .line 74
    invoke-virtual {p0, v2, v0}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v3

    .line 75
    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    if-eqz v4, :cond_9f

    const/16 v4, 0x3a

    .line 82
    invoke-virtual {v3, v4}, Ljava/lang/String;->indexOf(I)I

    move-result v4

    const-string v5, "int"

    const/4 v6, 0x1

    if-eq v4, v1, :cond_29

    .line 84
    invoke-virtual {v3, v2, v4}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v7

    add-int/2addr v4, v6

    .line 85
    invoke-virtual {v3, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v3

    goto :goto_2b

    :cond_29
    move-object v7, v3

    move-object v3, v5

    :goto_2b
    add-int/2addr v0, v6

    .line 92
    invoke-virtual {p0, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p0

    .line 93
    invoke-virtual {v3}, Ljava/lang/String;->hashCode()I

    move-result v0

    const/4 v4, 0x3

    const/4 v8, 0x2

    sparse-switch v0, :sswitch_data_b0

    goto :goto_5f

    :sswitch_3a
    const-string v0, "float"

    invoke-virtual {v3, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_5f

    const/4 v1, 0x2

    goto :goto_5f

    :sswitch_44
    const-string v0, "long"

    invoke-virtual {v3, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_5f

    const/4 v1, 0x1

    goto :goto_5f

    :sswitch_4e
    invoke-virtual {v3, v5}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_5f

    const/4 v1, 0x0

    goto :goto_5f

    :sswitch_56
    const-string v0, "string"

    invoke-virtual {v3, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_5f

    const/4 v1, 0x3

    :cond_5f
    :goto_5f
    if-eqz v1, :cond_91

    if-eq v1, v6, :cond_88

    if-eq v1, v8, :cond_7f

    if-ne v1, v4, :cond_68

    goto :goto_99

    .line 107
    :cond_68
    new-instance p0, Ljava/lang/IllegalArgumentException;

    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Invalid codec option type (int, long, float, str): "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-direct {p0, v0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 101
    :cond_7f
    invoke-static {p0}, Ljava/lang/Float;->parseFloat(Ljava/lang/String;)F

    move-result p0

    invoke-static {p0}, Ljava/lang/Float;->valueOf(F)Ljava/lang/Float;

    move-result-object p0

    goto :goto_99

    .line 98
    :cond_88
    invoke-static {p0}, Ljava/lang/Long;->parseLong(Ljava/lang/String;)J

    move-result-wide v0

    invoke-static {v0, v1}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object p0

    goto :goto_99

    .line 95
    :cond_91
    invoke-static {p0}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p0

    invoke-static {p0}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object p0

    .line 110
    :goto_99
    new-instance v0, Lcom/genymobile/scrcpy/CodecOption;

    invoke-direct {v0, v7, p0}, Lcom/genymobile/scrcpy/CodecOption;-><init>(Ljava/lang/String;Ljava/lang/Object;)V

    return-object v0

    .line 76
    :cond_9f
    new-instance p0, Ljava/lang/IllegalArgumentException;

    const-string v0, "Key may not be null"

    invoke-direct {p0, v0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 72
    :cond_a7
    new-instance p0, Ljava/lang/IllegalArgumentException;

    const-string v0, "\'=\' expected"

    invoke-direct {p0, v0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/String;)V

    throw p0

    nop

    :sswitch_data_b0
    .sparse-switch
        -0x352a9fef -> :sswitch_56
        0x197ef -> :sswitch_4e
        0x32c67c -> :sswitch_44
        0x5d0225c -> :sswitch_3a
    .end sparse-switch
.end method


# virtual methods
.method public getKey()Ljava/lang/String;
    .registers 2

    .line 16
    iget-object v0, p0, Lcom/genymobile/scrcpy/CodecOption;->key:Ljava/lang/String;

    return-object v0
.end method

.method public getValue()Ljava/lang/Object;
    .registers 2

    .line 20
    iget-object v0, p0, Lcom/genymobile/scrcpy/CodecOption;->value:Ljava/lang/Object;

    return-object v0
.end method
