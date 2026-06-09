.class public final Lcom/genymobile/scrcpy/WSServer$SocketInfo;
.super Ljava/lang/Object;
.source "WSServer.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/genymobile/scrcpy/WSServer;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x19
    name = "SocketInfo"
.end annotation


# static fields
.field private static final INSTANCES_BY_ID:Ljava/util/HashSet;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/HashSet<",
            "Ljava/lang/Short;",
            ">;"
        }
    .end annotation
.end field


# instance fields
.field private connection:Lcom/genymobile/scrcpy/WebSocketConnection;

.field private final id:S


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .line 22
    new-instance v0, Ljava/util/HashSet;

    invoke-direct {v0}, Ljava/util/HashSet;-><init>()V

    sput-object v0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->INSTANCES_BY_ID:Ljava/util/HashSet;

    return-void
.end method

.method constructor <init>(S)V
    .registers 3

    .line 26
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 27
    iput-short p1, p0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->id:S

    .line 28
    sget-object v0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->INSTANCES_BY_ID:Ljava/util/HashSet;

    invoke-static {p1}, Ljava/lang/Short;->valueOf(S)Ljava/lang/Short;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/util/HashSet;->add(Ljava/lang/Object;)Z

    return-void
.end method

.method public static getNextClientId()S
    .registers 3

    const/4 v0, 0x0

    .line 33
    :cond_1
    sget-object v1, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->INSTANCES_BY_ID:Ljava/util/HashSet;

    add-int/lit8 v0, v0, 0x1

    int-to-short v0, v0

    invoke-static {v0}, Ljava/lang/Short;->valueOf(S)Ljava/lang/Short;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/util/HashSet;->contains(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_15

    const/16 v1, 0x7fff

    if-ne v0, v1, :cond_1

    const/4 v0, -0x1

    :cond_15
    return v0
.end method


# virtual methods
.method public getConnection()Lcom/genymobile/scrcpy/WebSocketConnection;
    .registers 2

    .line 46
    iget-object v0, p0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->connection:Lcom/genymobile/scrcpy/WebSocketConnection;

    return-object v0
.end method

.method public getId()S
    .registers 2

    .line 42
    iget-short v0, p0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->id:S

    return v0
.end method

.method public release()V
    .registers 3

    .line 54
    sget-object v0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->INSTANCES_BY_ID:Ljava/util/HashSet;

    iget-short v1, p0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->id:S

    invoke-static {v1}, Ljava/lang/Short;->valueOf(S)Ljava/lang/Short;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/util/HashSet;->remove(Ljava/lang/Object;)Z

    return-void
.end method

.method public setConnection(Lcom/genymobile/scrcpy/WebSocketConnection;)V
    .registers 2

    .line 50
    iput-object p1, p0, Lcom/genymobile/scrcpy/WSServer$SocketInfo;->connection:Lcom/genymobile/scrcpy/WebSocketConnection;

    return-void
.end method
