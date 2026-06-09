.class public Lorg/java_websocket/handshake/HandshakeImpl1Server;
.super Lorg/java_websocket/handshake/HandshakedataImpl1;
.source "HandshakeImpl1Server.java"

# interfaces
.implements Lorg/java_websocket/handshake/ServerHandshakeBuilder;


# instance fields
.field private httpstatus:S

.field private httpstatusmessage:Ljava/lang/String;


# direct methods
.method public constructor <init>()V
    .registers 1

    .line 4
    invoke-direct {p0}, Lorg/java_websocket/handshake/HandshakedataImpl1;-><init>()V

    return-void
.end method


# virtual methods
.method public getHttpStatus()S
    .registers 2

    .line 15
    iget-short v0, p0, Lorg/java_websocket/handshake/HandshakeImpl1Server;->httpstatus:S

    return v0
.end method

.method public getHttpStatusMessage()Ljava/lang/String;
    .registers 2

    .line 10
    iget-object v0, p0, Lorg/java_websocket/handshake/HandshakeImpl1Server;->httpstatusmessage:Ljava/lang/String;

    return-object v0
.end method

.method public setHttpStatus(S)V
    .registers 2

    .line 25
    iput-short p1, p0, Lorg/java_websocket/handshake/HandshakeImpl1Server;->httpstatus:S

    .line 26
    return-void
.end method

.method public setHttpStatusMessage(Ljava/lang/String;)V
    .registers 2

    .line 20
    iput-object p1, p0, Lorg/java_websocket/handshake/HandshakeImpl1Server;->httpstatusmessage:Ljava/lang/String;

    .line 21
    return-void
.end method
