.class public abstract Lorg/java_websocket/AbstractWebSocket;
.super Lorg/java_websocket/WebSocketAdapter;
.source "AbstractWebSocket.java"


# static fields
.field private static final log:Lorg/slf4j/Logger;


# instance fields
.field private connectionLostTimeout:I

.field private connectionLostTimer:Ljava/util/Timer;

.field private connectionLostTimerTask:Ljava/util/TimerTask;

.field private reuseAddr:Z

.field private final syncConnectionLost:Ljava/lang/Object;

.field private tcpNoDelay:Z

.field private websocketRunning:Z


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .line 14
    const-class v0, Lorg/java_websocket/AbstractWebSocket;

    invoke-static {v0}, Lorg/slf4j/LoggerFactory;->getLogger(Ljava/lang/Class;)Lorg/slf4j/Logger;

    move-result-object v0

    sput-object v0, Lorg/java_websocket/AbstractWebSocket;->log:Lorg/slf4j/Logger;

    return-void
.end method

.method public constructor <init>()V
    .registers 2

    .line 13
    invoke-direct {p0}, Lorg/java_websocket/WebSocketAdapter;-><init>()V

    .line 19
    const/16 v0, 0x3c

    iput v0, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimeout:I

    .line 20
    const/4 v0, 0x0

    iput-boolean v0, p0, Lorg/java_websocket/AbstractWebSocket;->websocketRunning:Z

    .line 21
    new-instance v0, Ljava/lang/Object;

    invoke-direct {v0}, Ljava/lang/Object;-><init>()V

    iput-object v0, p0, Lorg/java_websocket/AbstractWebSocket;->syncConnectionLost:Ljava/lang/Object;

    return-void
.end method

.method static synthetic access$000(Lorg/java_websocket/AbstractWebSocket;)I
    .registers 1

    .line 13
    iget p0, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimeout:I

    return p0
.end method

.method private cancelConnectionLostTimer()V
    .registers 3

    .line 122
    iget-object v0, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimer:Ljava/util/Timer;

    .line 123
    const/4 v1, 0x0

    if-eqz v0, :cond_a

    .line 124
    invoke-virtual {v0}, Ljava/util/Timer;->cancel()V

    .line 125
    iput-object v1, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimer:Ljava/util/Timer;

    .line 127
    :cond_a
    iget-object v0, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimerTask:Ljava/util/TimerTask;

    .line 128
    if-eqz v0, :cond_13

    .line 129
    invoke-virtual {v0}, Ljava/util/TimerTask;->cancel()Z

    .line 130
    iput-object v1, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimerTask:Ljava/util/TimerTask;

    .line 132
    :cond_13
    return-void
.end method

.method private restartConnectionLostTimer()V
    .registers 9

    .line 80
    invoke-direct {p0}, Lorg/java_websocket/AbstractWebSocket;->cancelConnectionLostTimer()V

    .line 81
    new-instance v0, Ljava/util/Timer;

    const-string v1, "WebSocketTimer"

    invoke-direct {v0, v1}, Ljava/util/Timer;-><init>(Ljava/lang/String;)V

    iput-object v0, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimer:Ljava/util/Timer;

    .line 82
    new-instance v3, Lorg/java_websocket/AbstractWebSocket$1;

    invoke-direct {v3, p0}, Lorg/java_websocket/AbstractWebSocket$1;-><init>(Lorg/java_websocket/AbstractWebSocket;)V

    .line 100
    iput-object v3, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimerTask:Ljava/util/TimerTask;

    .line 101
    iget-object v2, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimer:Ljava/util/Timer;

    .line 102
    iget v0, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimeout:I

    .line 103
    int-to-long v0, v0

    const-wide/16 v4, 0x3e8

    mul-long v4, v4, v0

    move-wide v6, v4

    invoke-virtual/range {v2 .. v7}, Ljava/util/Timer;->scheduleAtFixedRate(Ljava/util/TimerTask;JJ)V

    .line 104
    return-void
.end method


# virtual methods
.method public executeConnectionLostDetection(Lorg/java_websocket/WebSocket;J)V
    .registers 7

    .line 108
    instance-of v0, p1, Lorg/java_websocket/WebSocketImpl;

    if-eqz v0, :cond_2e

    .line 109
    check-cast p1, Lorg/java_websocket/WebSocketImpl;

    .line 110
    invoke-virtual {p1}, Lorg/java_websocket/WebSocketImpl;->getLastPong()J

    move-result-wide v0

    cmp-long v2, v0, p2

    if-gez v2, :cond_1d

    .line 111
    sget-object p2, Lorg/java_websocket/AbstractWebSocket;->log:Lorg/slf4j/Logger;

    const-string p3, "Closing connection due to no pong received: {}"

    invoke-interface {p2, p3, p1}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;)V

    .line 112
    const/16 p2, 0x3ee

    const-string p3, "The connection was closed because the other endpoint did not respond with a pong in time. For more information check: https://github.com/TooTallNate/Java-WebSocket/wiki/Lost-connection-detection"

    invoke-virtual {p1, p2, p3}, Lorg/java_websocket/WebSocketImpl;->closeConnection(ILjava/lang/String;)V

    goto :goto_2e

    .line 113
    :cond_1d
    invoke-virtual {p1}, Lorg/java_websocket/WebSocketImpl;->isOpen()Z

    move-result p2

    if-eqz p2, :cond_27

    .line 114
    invoke-virtual {p1}, Lorg/java_websocket/WebSocketImpl;->sendPing()V

    goto :goto_2e

    .line 116
    :cond_27
    sget-object p2, Lorg/java_websocket/AbstractWebSocket;->log:Lorg/slf4j/Logger;

    const-string p3, "Trying to ping a non open connection: {}"

    invoke-interface {p2, p3, p1}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;Ljava/lang/Object;)V

    .line 119
    :cond_2e
    :goto_2e
    return-void
.end method

.method public getConnectionLostTimeout()I
    .registers 3

    .line 27
    iget-object v0, p0, Lorg/java_websocket/AbstractWebSocket;->syncConnectionLost:Ljava/lang/Object;

    monitor-enter v0

    .line 28
    :try_start_3
    iget v1, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimeout:I

    .line 29
    monitor-exit v0

    .line 30
    return v1

    .line 29
    :catchall_7
    move-exception v1

    monitor-exit v0
    :try_end_9
    .catchall {:try_start_3 .. :try_end_9} :catchall_7

    throw v1
.end method

.method protected abstract getConnections()Ljava/util/Collection;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()",
            "Ljava/util/Collection<",
            "Lorg/java_websocket/WebSocket;",
            ">;"
        }
    .end annotation
.end method

.method public isReuseAddr()Z
    .registers 2

    .line 143
    iget-boolean v0, p0, Lorg/java_websocket/AbstractWebSocket;->reuseAddr:Z

    return v0
.end method

.method public isTcpNoDelay()Z
    .registers 2

    .line 135
    iget-boolean v0, p0, Lorg/java_websocket/AbstractWebSocket;->tcpNoDelay:Z

    return v0
.end method

.method public setConnectionLostTimeout(I)V
    .registers 5

    .line 34
    iget-object v0, p0, Lorg/java_websocket/AbstractWebSocket;->syncConnectionLost:Ljava/lang/Object;

    monitor-enter v0

    .line 35
    :try_start_3
    iput p1, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimeout:I

    .line 36
    if-gtz p1, :cond_13

    .line 37
    sget-object p1, Lorg/java_websocket/AbstractWebSocket;->log:Lorg/slf4j/Logger;

    const-string v1, "Connection lost timer stopped"

    invoke-interface {p1, v1}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;)V

    .line 38
    invoke-direct {p0}, Lorg/java_websocket/AbstractWebSocket;->cancelConnectionLostTimer()V

    .line 39
    monitor-exit v0

    return-void

    .line 41
    :cond_13
    iget-boolean p1, p0, Lorg/java_websocket/AbstractWebSocket;->websocketRunning:Z

    if-eqz p1, :cond_4d

    .line 42
    sget-object p1, Lorg/java_websocket/AbstractWebSocket;->log:Lorg/slf4j/Logger;

    const-string v1, "Connection lost timer restarted"

    invoke-interface {p1, v1}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;)V
    :try_end_1e
    .catchall {:try_start_3 .. :try_end_1e} :catchall_4f

    .line 44
    :try_start_1e
    new-instance p1, Ljava/util/ArrayList;

    invoke-virtual {p0}, Lorg/java_websocket/AbstractWebSocket;->getConnections()Ljava/util/Collection;

    move-result-object v1

    invoke-direct {p1, v1}, Ljava/util/ArrayList;-><init>(Ljava/util/Collection;)V

    invoke-virtual {p1}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object p1

    :goto_2b
    invoke-interface {p1}, Ljava/util/Iterator;->hasNext()Z

    move-result v1

    if-eqz v1, :cond_41

    invoke-interface {p1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Lorg/java_websocket/WebSocket;

    .line 45
    instance-of v2, v1, Lorg/java_websocket/WebSocketImpl;

    if-eqz v2, :cond_40

    .line 46
    check-cast v1, Lorg/java_websocket/WebSocketImpl;

    invoke-virtual {v1}, Lorg/java_websocket/WebSocketImpl;->updateLastPong()V
    :try_end_40
    .catch Ljava/lang/Exception; {:try_start_1e .. :try_end_40} :catch_42
    .catchall {:try_start_1e .. :try_end_40} :catchall_4f

    .line 48
    :cond_40
    goto :goto_2b

    .line 51
    :cond_41
    goto :goto_4a

    .line 49
    :catch_42
    move-exception p1

    .line 50
    :try_start_43
    sget-object v1, Lorg/java_websocket/AbstractWebSocket;->log:Lorg/slf4j/Logger;

    const-string v2, "Exception during connection lost restart"

    invoke-interface {v1, v2, p1}, Lorg/slf4j/Logger;->error(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 52
    :goto_4a
    invoke-direct {p0}, Lorg/java_websocket/AbstractWebSocket;->restartConnectionLostTimer()V

    .line 54
    :cond_4d
    monitor-exit v0

    .line 55
    return-void

    .line 54
    :catchall_4f
    move-exception p1

    monitor-exit v0
    :try_end_51
    .catchall {:try_start_43 .. :try_end_51} :catchall_4f

    throw p1
.end method

.method public setReuseAddr(Z)V
    .registers 2

    .line 147
    iput-boolean p1, p0, Lorg/java_websocket/AbstractWebSocket;->reuseAddr:Z

    .line 148
    return-void
.end method

.method public setTcpNoDelay(Z)V
    .registers 2

    .line 139
    iput-boolean p1, p0, Lorg/java_websocket/AbstractWebSocket;->tcpNoDelay:Z

    .line 140
    return-void
.end method

.method protected startConnectionLostTimer()V
    .registers 4

    .line 68
    iget-object v0, p0, Lorg/java_websocket/AbstractWebSocket;->syncConnectionLost:Ljava/lang/Object;

    monitor-enter v0

    .line 69
    :try_start_3
    iget v1, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimeout:I

    if-gtz v1, :cond_10

    .line 70
    sget-object v1, Lorg/java_websocket/AbstractWebSocket;->log:Lorg/slf4j/Logger;

    const-string v2, "Connection lost timer deactivated"

    invoke-interface {v1, v2}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;)V

    .line 71
    monitor-exit v0

    return-void

    .line 73
    :cond_10
    sget-object v1, Lorg/java_websocket/AbstractWebSocket;->log:Lorg/slf4j/Logger;

    const-string v2, "Connection lost timer started"

    invoke-interface {v1, v2}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;)V

    .line 74
    const/4 v1, 0x1

    iput-boolean v1, p0, Lorg/java_websocket/AbstractWebSocket;->websocketRunning:Z

    .line 75
    invoke-direct {p0}, Lorg/java_websocket/AbstractWebSocket;->restartConnectionLostTimer()V

    .line 76
    monitor-exit v0

    .line 77
    return-void

    .line 76
    :catchall_1f
    move-exception v1

    monitor-exit v0
    :try_end_21
    .catchall {:try_start_3 .. :try_end_21} :catchall_1f

    throw v1
.end method

.method protected stopConnectionLostTimer()V
    .registers 4

    .line 58
    iget-object v0, p0, Lorg/java_websocket/AbstractWebSocket;->syncConnectionLost:Ljava/lang/Object;

    monitor-enter v0

    .line 59
    :try_start_3
    iget-object v1, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimer:Ljava/util/Timer;

    if-nez v1, :cond_b

    iget-object v1, p0, Lorg/java_websocket/AbstractWebSocket;->connectionLostTimerTask:Ljava/util/TimerTask;

    if-eqz v1, :cond_18

    .line 60
    :cond_b
    const/4 v1, 0x0

    iput-boolean v1, p0, Lorg/java_websocket/AbstractWebSocket;->websocketRunning:Z

    .line 61
    sget-object v1, Lorg/java_websocket/AbstractWebSocket;->log:Lorg/slf4j/Logger;

    const-string v2, "Connection lost timer stopped"

    invoke-interface {v1, v2}, Lorg/slf4j/Logger;->trace(Ljava/lang/String;)V

    .line 62
    invoke-direct {p0}, Lorg/java_websocket/AbstractWebSocket;->cancelConnectionLostTimer()V

    .line 64
    :cond_18
    monitor-exit v0

    .line 65
    return-void

    .line 64
    :catchall_1a
    move-exception v1

    monitor-exit v0
    :try_end_1c
    .catchall {:try_start_3 .. :try_end_1c} :catchall_1a

    throw v1
.end method
