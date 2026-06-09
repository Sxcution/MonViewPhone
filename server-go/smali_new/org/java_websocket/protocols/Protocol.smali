.class public Lorg/java_websocket/protocols/Protocol;
.super Ljava/lang/Object;
.source "Protocol.java"

# interfaces
.implements Lorg/java_websocket/protocols/IProtocol;


# static fields
.field private static final patternComma:Ljava/util/regex/Pattern;

.field private static final patternSpace:Ljava/util/regex/Pattern;


# instance fields
.field private final providedProtocol:Ljava/lang/String;


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .line 8
    const-string v0, " "

    invoke-static {v0}, Ljava/util/regex/Pattern;->compile(Ljava/lang/String;)Ljava/util/regex/Pattern;

    move-result-object v0

    sput-object v0, Lorg/java_websocket/protocols/Protocol;->patternSpace:Ljava/util/regex/Pattern;

    .line 9
    const-string v0, ","

    invoke-static {v0}, Ljava/util/regex/Pattern;->compile(Ljava/lang/String;)Ljava/util/regex/Pattern;

    move-result-object v0

    sput-object v0, Lorg/java_websocket/protocols/Protocol;->patternComma:Ljava/util/regex/Pattern;

    return-void
.end method

.method public constructor <init>(Ljava/lang/String;)V
    .registers 2

    .line 11
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 12
    if-eqz p1, :cond_8

    .line 15
    iput-object p1, p0, Lorg/java_websocket/protocols/Protocol;->providedProtocol:Ljava/lang/String;

    .line 16
    return-void

    .line 13
    :cond_8
    new-instance p1, Ljava/lang/IllegalArgumentException;

    invoke-direct {p1}, Ljava/lang/IllegalArgumentException;-><init>()V

    throw p1
.end method


# virtual methods
.method public acceptProvidedProtocol(Ljava/lang/String;)Z
    .registers 7

    .line 20
    sget-object v0, Lorg/java_websocket/protocols/Protocol;->patternComma:Ljava/util/regex/Pattern;

    sget-object v1, Lorg/java_websocket/protocols/Protocol;->patternSpace:Ljava/util/regex/Pattern;

    invoke-virtual {v1, p1}, Ljava/util/regex/Pattern;->matcher(Ljava/lang/CharSequence;)Ljava/util/regex/Matcher;

    move-result-object p1

    const-string v1, ""

    invoke-virtual {p1, v1}, Ljava/util/regex/Matcher;->replaceAll(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/util/regex/Pattern;->split(Ljava/lang/CharSequence;)[Ljava/lang/String;

    move-result-object p1

    array-length v0, p1

    const/4 v1, 0x0

    const/4 v2, 0x0

    :goto_15
    if-ge v2, v0, :cond_26

    aget-object v3, p1, v2

    .line 21
    iget-object v4, p0, Lorg/java_websocket/protocols/Protocol;->providedProtocol:Ljava/lang/String;

    invoke-virtual {v4, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_23

    .line 22
    const/4 p1, 0x1

    return p1

    .line 20
    :cond_23
    add-int/lit8 v2, v2, 0x1

    goto :goto_15

    .line 25
    :cond_26
    return v1
.end method

.method public copyInstance()Lorg/java_websocket/protocols/IProtocol;
    .registers 3

    .line 35
    new-instance v0, Lorg/java_websocket/protocols/Protocol;

    invoke-virtual {p0}, Lorg/java_websocket/protocols/Protocol;->getProvidedProtocol()Ljava/lang/String;

    move-result-object v1

    invoke-direct {v0, v1}, Lorg/java_websocket/protocols/Protocol;-><init>(Ljava/lang/String;)V

    return-object v0
.end method

.method public equals(Ljava/lang/Object;)Z
    .registers 4

    .line 44
    if-ne p0, p1, :cond_4

    .line 45
    const/4 p1, 0x1

    return p1

    .line 47
    :cond_4
    if-eqz p1, :cond_1c

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    invoke-virtual {p1}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    if-eq v0, v1, :cond_11

    goto :goto_1c

    .line 50
    :cond_11
    iget-object v0, p0, Lorg/java_websocket/protocols/Protocol;->providedProtocol:Ljava/lang/String;

    check-cast p1, Lorg/java_websocket/protocols/Protocol;

    iget-object p1, p1, Lorg/java_websocket/protocols/Protocol;->providedProtocol:Ljava/lang/String;

    invoke-virtual {v0, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p1

    return p1

    .line 48
    :cond_1c
    :goto_1c
    const/4 p1, 0x0

    return p1
.end method

.method public getProvidedProtocol()Ljava/lang/String;
    .registers 2

    .line 30
    iget-object v0, p0, Lorg/java_websocket/protocols/Protocol;->providedProtocol:Ljava/lang/String;

    return-object v0
.end method

.method public hashCode()I
    .registers 2

    .line 54
    iget-object v0, p0, Lorg/java_websocket/protocols/Protocol;->providedProtocol:Ljava/lang/String;

    invoke-virtual {v0}, Ljava/lang/String;->hashCode()I

    move-result v0

    return v0
.end method

.method public toString()Ljava/lang/String;
    .registers 2

    .line 40
    invoke-virtual {p0}, Lorg/java_websocket/protocols/Protocol;->getProvidedProtocol()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
