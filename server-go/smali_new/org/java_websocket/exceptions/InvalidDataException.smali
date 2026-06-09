.class public Lorg/java_websocket/exceptions/InvalidDataException;
.super Ljava/lang/Exception;
.source "InvalidDataException.java"


# static fields
.field private static final serialVersionUID:J = 0x33ca2ae9af8edac6L


# instance fields
.field private final closecode:I


# direct methods
.method public constructor <init>(I)V
    .registers 2

    .line 8
    invoke-direct {p0}, Ljava/lang/Exception;-><init>()V

    .line 9
    iput p1, p0, Lorg/java_websocket/exceptions/InvalidDataException;->closecode:I

    .line 10
    return-void
.end method

.method public constructor <init>(ILjava/lang/String;)V
    .registers 3

    .line 13
    invoke-direct {p0, p2}, Ljava/lang/Exception;-><init>(Ljava/lang/String;)V

    .line 14
    iput p1, p0, Lorg/java_websocket/exceptions/InvalidDataException;->closecode:I

    .line 15
    return-void
.end method

.method public constructor <init>(ILjava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 23
    invoke-direct {p0, p2, p3}, Ljava/lang/Exception;-><init>(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 24
    iput p1, p0, Lorg/java_websocket/exceptions/InvalidDataException;->closecode:I

    .line 25
    return-void
.end method

.method public constructor <init>(ILjava/lang/Throwable;)V
    .registers 3

    .line 18
    invoke-direct {p0, p2}, Ljava/lang/Exception;-><init>(Ljava/lang/Throwable;)V

    .line 19
    iput p1, p0, Lorg/java_websocket/exceptions/InvalidDataException;->closecode:I

    .line 20
    return-void
.end method


# virtual methods
.method public getCloseCode()I
    .registers 2

    .line 28
    iget v0, p0, Lorg/java_websocket/exceptions/InvalidDataException;->closecode:I

    return v0
.end method
