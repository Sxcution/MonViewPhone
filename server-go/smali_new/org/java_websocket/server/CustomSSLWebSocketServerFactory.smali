.class public Lorg/java_websocket/server/CustomSSLWebSocketServerFactory;
.super Lorg/java_websocket/server/DefaultSSLWebSocketServerFactory;
.source "CustomSSLWebSocketServerFactory.java"


# instance fields
.field private final enabledCiphersuites:[Ljava/lang/String;

.field private final enabledProtocols:[Ljava/lang/String;


# direct methods
.method public constructor <init>(Ljavax/net/ssl/SSLContext;Ljava/util/concurrent/ExecutorService;[Ljava/lang/String;[Ljava/lang/String;)V
    .registers 5

    .line 23
    invoke-direct {p0, p1, p2}, Lorg/java_websocket/server/DefaultSSLWebSocketServerFactory;-><init>(Ljavax/net/ssl/SSLContext;Ljava/util/concurrent/ExecutorService;)V

    .line 24
    iput-object p3, p0, Lorg/java_websocket/server/CustomSSLWebSocketServerFactory;->enabledProtocols:[Ljava/lang/String;

    .line 25
    iput-object p4, p0, Lorg/java_websocket/server/CustomSSLWebSocketServerFactory;->enabledCiphersuites:[Ljava/lang/String;

    .line 26
    return-void
.end method

.method public constructor <init>(Ljavax/net/ssl/SSLContext;[Ljava/lang/String;[Ljava/lang/String;)V
    .registers 5

    .line 19
    invoke-static {}, Ljava/util/concurrent/Executors;->newSingleThreadScheduledExecutor()Ljava/util/concurrent/ScheduledExecutorService;

    move-result-object v0

    invoke-direct {p0, p1, v0, p2, p3}, Lorg/java_websocket/server/CustomSSLWebSocketServerFactory;-><init>(Ljavax/net/ssl/SSLContext;Ljava/util/concurrent/ExecutorService;[Ljava/lang/String;[Ljava/lang/String;)V

    .line 20
    return-void
.end method


# virtual methods
.method public wrapChannel(Ljava/nio/channels/SocketChannel;Ljava/nio/channels/SelectionKey;)Ljava/nio/channels/ByteChannel;
    .registers 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 30
    iget-object v0, p0, Lorg/java_websocket/server/CustomSSLWebSocketServerFactory;->sslcontext:Ljavax/net/ssl/SSLContext;

    invoke-virtual {v0}, Ljavax/net/ssl/SSLContext;->createSSLEngine()Ljavax/net/ssl/SSLEngine;

    move-result-object v0

    .line 31
    iget-object v1, p0, Lorg/java_websocket/server/CustomSSLWebSocketServerFactory;->enabledProtocols:[Ljava/lang/String;

    .line 32
    if-eqz v1, :cond_d

    .line 33
    invoke-virtual {v0, v1}, Ljavax/net/ssl/SSLEngine;->setEnabledProtocols([Ljava/lang/String;)V

    .line 35
    :cond_d
    iget-object v1, p0, Lorg/java_websocket/server/CustomSSLWebSocketServerFactory;->enabledCiphersuites:[Ljava/lang/String;

    .line 36
    if-eqz v1, :cond_14

    .line 37
    invoke-virtual {v0, v1}, Ljavax/net/ssl/SSLEngine;->setEnabledCipherSuites([Ljava/lang/String;)V

    .line 39
    :cond_14
    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Ljavax/net/ssl/SSLEngine;->setUseClientMode(Z)V

    .line 40
    new-instance v1, Lorg/java_websocket/SSLSocketChannel2;

    iget-object v2, p0, Lorg/java_websocket/server/CustomSSLWebSocketServerFactory;->exec:Ljava/util/concurrent/ExecutorService;

    invoke-direct {v1, p1, v0, v2, p2}, Lorg/java_websocket/SSLSocketChannel2;-><init>(Ljava/nio/channels/SocketChannel;Ljavax/net/ssl/SSLEngine;Ljava/util/concurrent/ExecutorService;Ljava/nio/channels/SelectionKey;)V

    return-object v1
.end method
