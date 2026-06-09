.class public Lorg/java_websocket/exceptions/InvalidEncodingException;
.super Ljava/lang/RuntimeException;
.source "InvalidEncodingException.java"


# instance fields
.field private final encodingException:Ljava/io/UnsupportedEncodingException;


# direct methods
.method public constructor <init>(Ljava/io/UnsupportedEncodingException;)V
    .registers 2

    .line 9
    invoke-direct {p0}, Ljava/lang/RuntimeException;-><init>()V

    .line 10
    if-eqz p1, :cond_8

    .line 13
    iput-object p1, p0, Lorg/java_websocket/exceptions/InvalidEncodingException;->encodingException:Ljava/io/UnsupportedEncodingException;

    .line 14
    return-void

    .line 11
    :cond_8
    new-instance p1, Ljava/lang/IllegalArgumentException;

    invoke-direct {p1}, Ljava/lang/IllegalArgumentException;-><init>()V

    throw p1
.end method


# virtual methods
.method public getEncodingException()Ljava/io/UnsupportedEncodingException;
    .registers 2

    .line 17
    iget-object v0, p0, Lorg/java_websocket/exceptions/InvalidEncodingException;->encodingException:Ljava/io/UnsupportedEncodingException;

    return-object v0
.end method
