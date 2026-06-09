.class public Lorg/java_websocket/SocketChannelIOHelper;
.super Ljava/lang/Object;
.source "SocketChannelIOHelper.java"


# direct methods
.method private constructor <init>()V
    .registers 3

    .line 10
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 11
    new-instance v0, Ljava/lang/IllegalStateException;

    const-string v1, "Utility class"

    invoke-direct {v0, v1}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/String;)V

    throw v0
.end method

.method public static batch(Lorg/java_websocket/WebSocketImpl;Ljava/nio/channels/ByteChannel;)Z
    .registers 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 37
    const/4 v0, 0x0

    if-nez p0, :cond_4

    .line 38
    return v0

    .line 40
    :cond_4
    iget-object v1, p0, Lorg/java_websocket/WebSocketImpl;->outQueue:Ljava/util/concurrent/BlockingQueue;

    invoke-interface {v1}, Ljava/util/concurrent/BlockingQueue;->peek()Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ljava/nio/ByteBuffer;

    .line 41
    nop

    .line 42
    if-eqz v1, :cond_29

    .line 44
    :cond_f
    invoke-interface {p1, v1}, Ljava/nio/channels/ByteChannel;->write(Ljava/nio/ByteBuffer;)I

    .line 45
    invoke-virtual {v1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v1

    if-lez v1, :cond_19

    .line 46
    return v0

    .line 48
    :cond_19
    iget-object v1, p0, Lorg/java_websocket/WebSocketImpl;->outQueue:Ljava/util/concurrent/BlockingQueue;

    invoke-interface {v1}, Ljava/util/concurrent/BlockingQueue;->poll()Ljava/lang/Object;

    .line 49
    iget-object v1, p0, Lorg/java_websocket/WebSocketImpl;->outQueue:Ljava/util/concurrent/BlockingQueue;

    invoke-interface {v1}, Ljava/util/concurrent/BlockingQueue;->peek()Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ljava/nio/ByteBuffer;

    .line 50
    if-nez v1, :cond_f

    goto :goto_3a

    .line 51
    :cond_29
    instance-of v1, p1, Lorg/java_websocket/WrappedByteChannel;

    if-eqz v1, :cond_3a

    .line 52
    move-object v1, p1

    check-cast v1, Lorg/java_websocket/WrappedByteChannel;

    .line 53
    invoke-interface {v1}, Lorg/java_websocket/WrappedByteChannel;->isNeedWrite()Z

    move-result v2

    if-eqz v2, :cond_3b

    .line 54
    invoke-interface {v1}, Lorg/java_websocket/WrappedByteChannel;->writeMore()V

    goto :goto_3b

    .line 57
    :cond_3a
    :goto_3a
    const/4 v1, 0x0

    :cond_3b
    :goto_3b
    iget-object v2, p0, Lorg/java_websocket/WebSocketImpl;->outQueue:Ljava/util/concurrent/BlockingQueue;

    invoke-interface {v2}, Ljava/util/concurrent/BlockingQueue;->isEmpty()Z

    move-result v2

    if-eqz v2, :cond_68

    invoke-virtual {p0}, Lorg/java_websocket/WebSocketImpl;->isFlushAndClose()Z

    move-result v2

    if-eqz v2, :cond_68

    invoke-virtual {p0}, Lorg/java_websocket/WebSocketImpl;->getDraft()Lorg/java_websocket/drafts/Draft;

    move-result-object v2

    if-eqz v2, :cond_68

    invoke-virtual {p0}, Lorg/java_websocket/WebSocketImpl;->getDraft()Lorg/java_websocket/drafts/Draft;

    move-result-object v2

    invoke-virtual {v2}, Lorg/java_websocket/drafts/Draft;->getRole()Lorg/java_websocket/enums/Role;

    move-result-object v2

    if-eqz v2, :cond_68

    invoke-virtual {p0}, Lorg/java_websocket/WebSocketImpl;->getDraft()Lorg/java_websocket/drafts/Draft;

    move-result-object v2

    invoke-virtual {v2}, Lorg/java_websocket/drafts/Draft;->getRole()Lorg/java_websocket/enums/Role;

    move-result-object v2

    sget-object v3, Lorg/java_websocket/enums/Role;->SERVER:Lorg/java_websocket/enums/Role;

    if-ne v2, v3, :cond_68

    .line 58
    invoke-virtual {p0}, Lorg/java_websocket/WebSocketImpl;->closeConnection()V

    .line 60
    :cond_68
    if-eqz v1, :cond_72

    check-cast p1, Lorg/java_websocket/WrappedByteChannel;

    invoke-interface {p1}, Lorg/java_websocket/WrappedByteChannel;->isNeedWrite()Z

    move-result p0

    if-nez p0, :cond_73

    :cond_72
    const/4 v0, 0x1

    :cond_73
    return v0
.end method

.method public static read(Ljava/nio/ByteBuffer;Lorg/java_websocket/WebSocketImpl;Ljava/nio/channels/ByteChannel;)Z
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 15
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->clear()Ljava/nio/Buffer;

    .line 16
    invoke-interface {p2, p0}, Ljava/nio/channels/ByteChannel;->read(Ljava/nio/ByteBuffer;)I

    move-result p2

    .line 17
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->flip()Ljava/nio/Buffer;

    .line 18
    const/4 p0, -0x1

    const/4 v0, 0x0

    if-eq p2, p0, :cond_12

    .line 19
    if-eqz p2, :cond_11

    const/4 v0, 0x1

    :cond_11
    return v0

    .line 21
    :cond_12
    invoke-virtual {p1}, Lorg/java_websocket/WebSocketImpl;->eot()V

    .line 22
    return v0
.end method

.method public static readMore(Ljava/nio/ByteBuffer;Lorg/java_websocket/WebSocketImpl;Lorg/java_websocket/WrappedByteChannel;)Z
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 26
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->clear()Ljava/nio/Buffer;

    .line 27
    invoke-interface {p2, p0}, Lorg/java_websocket/WrappedByteChannel;->readMore(Ljava/nio/ByteBuffer;)I

    move-result v0

    .line 28
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->flip()Ljava/nio/Buffer;

    .line 29
    const/4 p0, -0x1

    if-ne v0, p0, :cond_12

    .line 30
    invoke-virtual {p1}, Lorg/java_websocket/WebSocketImpl;->eot()V

    .line 31
    const/4 p0, 0x0

    return p0

    .line 33
    :cond_12
    invoke-interface {p2}, Lorg/java_websocket/WrappedByteChannel;->isNeedRead()Z

    move-result p0

    return p0
.end method
