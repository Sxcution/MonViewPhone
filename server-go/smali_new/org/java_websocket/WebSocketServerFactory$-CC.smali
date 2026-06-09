.class public final synthetic Lorg/java_websocket/WebSocketServerFactory$-CC;
.super Ljava/lang/Object;
.source "WebSocketServerFactory.java"


# direct methods
.method public static bridge synthetic $default$createWebSocket(Lorg/java_websocket/WebSocketServerFactory;Lorg/java_websocket/WebSocketAdapter;Ljava/util/List;)Lorg/java_websocket/WebSocket;
    .registers 3
    .param p0, "_this"    # Lorg/java_websocket/WebSocketServerFactory;

    .line 11
    invoke-interface {p0, p1, p2}, Lorg/java_websocket/WebSocketServerFactory;->createWebSocket(Lorg/java_websocket/WebSocketAdapter;Ljava/util/List;)Lorg/java_websocket/WebSocketImpl;

    move-result-object p1

    return-object p1
.end method

.method public static bridge synthetic $default$createWebSocket(Lorg/java_websocket/WebSocketServerFactory;Lorg/java_websocket/WebSocketAdapter;Lorg/java_websocket/drafts/Draft;)Lorg/java_websocket/WebSocket;
    .registers 3
    .param p0, "_this"    # Lorg/java_websocket/WebSocketServerFactory;

    .line 11
    invoke-interface {p0, p1, p2}, Lorg/java_websocket/WebSocketServerFactory;->createWebSocket(Lorg/java_websocket/WebSocketAdapter;Lorg/java_websocket/drafts/Draft;)Lorg/java_websocket/WebSocketImpl;

    move-result-object p1

    return-object p1
.end method
