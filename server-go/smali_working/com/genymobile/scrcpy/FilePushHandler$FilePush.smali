.class final Lcom/genymobile/scrcpy/FilePushHandler$FilePush;
.super Ljava/lang/Object;
.source "FilePushHandler.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/genymobile/scrcpy/FilePushHandler;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x1a
    name = "FilePush"
.end annotation


# static fields
.field private static final INSTANCES_BY_ID:Ljava/util/HashMap;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/HashMap<",
            "Ljava/lang/Short;",
            "Lcom/genymobile/scrcpy/FilePushHandler$FilePush;",
            ">;"
        }
    .end annotation
.end field

.field private static final INSTANCES_BY_NAME:Ljava/util/HashMap;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/HashMap<",
            "Ljava/lang/String;",
            "Lcom/genymobile/scrcpy/FilePushHandler$FilePush;",
            ">;"
        }
    .end annotation
.end field

.field private static nextPushId:S


# instance fields
.field private final conn:Lorg/java_websocket/WebSocket;

.field private final fileName:Ljava/lang/String;

.field private final fileSize:J

.field private processedBytes:J

.field private final pushId:S

.field private final stream:Ljava/io/FileOutputStream;


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .line 34
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    sput-object v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->INSTANCES_BY_NAME:Ljava/util/HashMap;

    .line 35
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    sput-object v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->INSTANCES_BY_ID:Ljava/util/HashMap;

    const/4 v0, 0x0

    .line 36
    sput-short v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->nextPushId:S

    return-void
.end method

.method constructor <init>(SJLjava/lang/String;Ljava/io/FileOutputStream;Lorg/java_websocket/WebSocket;)V
    .registers 9

    .line 46
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const-wide/16 v0, 0x0

    .line 43
    iput-wide v0, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->processedBytes:J

    .line 47
    iput-short p1, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->pushId:S

    .line 48
    iput-wide p2, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->fileSize:J

    .line 49
    iput-object p4, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->fileName:Ljava/lang/String;

    .line 50
    iput-object p5, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->stream:Ljava/io/FileOutputStream;

    .line 51
    iput-object p6, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->conn:Lorg/java_websocket/WebSocket;

    .line 52
    sget-object p2, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->INSTANCES_BY_ID:Ljava/util/HashMap;

    invoke-static {p1}, Ljava/lang/Short;->valueOf(S)Ljava/lang/Short;

    move-result-object p1

    invoke-virtual {p2, p1, p0}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 53
    sget-object p1, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->INSTANCES_BY_NAME:Ljava/util/HashMap;

    invoke-virtual {p1, p4, p0}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    return-void
.end method

.method public static getInstance(Ljava/lang/String;)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;
    .registers 2

    .line 56
    sget-object v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->INSTANCES_BY_NAME:Ljava/util/HashMap;

    invoke-virtual {v0, p0}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    return-object p0
.end method

.method public static getInstance(S)Lcom/genymobile/scrcpy/FilePushHandler$FilePush;
    .registers 2

    .line 59
    sget-object v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->INSTANCES_BY_ID:Ljava/util/HashMap;

    invoke-static {p0}, Ljava/lang/Short;->valueOf(S)Ljava/lang/Short;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/util/HashMap;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    return-object p0
.end method

.method public static getNextPushId()S
    .registers 3

    .line 62
    sget-short v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->nextPushId:S

    .line 63
    :cond_2
    sget-object v1, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->INSTANCES_BY_ID:Ljava/util/HashMap;

    sget-short v2, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->nextPushId:S

    add-int/lit8 v2, v2, 0x1

    int-to-short v2, v2

    sput-short v2, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->nextPushId:S

    invoke-static {v2}, Ljava/lang/Short;->valueOf(S)Ljava/lang/Short;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/util/HashMap;->containsKey(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_24

    .line 64
    sget-short v1, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->nextPushId:S

    const/16 v2, 0x7fff

    if-ne v1, v2, :cond_1e

    const/4 v1, 0x0

    .line 65
    sput-short v1, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->nextPushId:S

    .line 67
    :cond_1e
    sget-short v1, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->nextPushId:S

    if-ne v1, v0, :cond_2

    const/4 v0, -0x1

    return v0

    .line 71
    :cond_24
    sget-short v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->nextPushId:S

    return v0
.end method

.method public static releaseByConnection(Lorg/java_websocket/WebSocket;)V
    .registers 5

    .line 74
    new-instance v0, Ljava/util/ArrayList;

    invoke-direct {v0}, Ljava/util/ArrayList;-><init>()V

    .line 75
    sget-object v1, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->INSTANCES_BY_ID:Ljava/util/HashMap;

    invoke-virtual {v1}, Ljava/util/HashMap;->values()Ljava/util/Collection;

    move-result-object v1

    invoke-interface {v1}, Ljava/util/Collection;->iterator()Ljava/util/Iterator;

    move-result-object v1

    :cond_f
    :goto_f
    invoke-interface {v1}, Ljava/util/Iterator;->hasNext()Z

    move-result v2

    if-eqz v2, :cond_27

    invoke-interface {v1}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v2

    check-cast v2, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    .line 76
    iget-object v3, v2, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->conn:Lorg/java_websocket/WebSocket;

    invoke-virtual {v3, p0}, Ljava/lang/Object;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_f

    .line 77
    invoke-virtual {v0, v2}, Ljava/util/ArrayList;->add(Ljava/lang/Object;)Z

    goto :goto_f

    .line 80
    :cond_27
    invoke-virtual {v0}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object p0

    :goto_2b
    invoke-interface {p0}, Ljava/util/Iterator;->hasNext()Z

    move-result v0

    if-eqz v0, :cond_59

    invoke-interface {p0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;

    .line 82
    :try_start_37
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->release()V
    :try_end_3a
    .catch Ljava/io/IOException; {:try_start_37 .. :try_end_3a} :catch_3b

    goto :goto_2b

    .line 84
    :catch_3b
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "Failed to release stream for file: \""

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->getFileName()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, "\""

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    goto :goto_2b

    :cond_59
    return-void
.end method


# virtual methods
.method public getFileName()Ljava/lang/String;
    .registers 2

    .line 93
    iget-object v0, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->fileName:Ljava/lang/String;

    return-object v0
.end method

.method public isComplete()Z
    .registers 6

    .line 96
    iget-wide v0, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->processedBytes:J

    iget-wide v2, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->fileSize:J

    cmp-long v4, v0, v2

    if-nez v4, :cond_a

    const/4 v0, 0x1

    goto :goto_b

    :cond_a
    const/4 v0, 0x0

    :goto_b
    return v0
.end method

.method public release()V
    .registers 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 99
    sget-object v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->INSTANCES_BY_ID:Ljava/util/HashMap;

    iget-short v1, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->pushId:S

    invoke-static {v1}, Ljava/lang/Short;->valueOf(S)Ljava/lang/Short;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/util/HashMap;->remove(Ljava/lang/Object;)Ljava/lang/Object;

    .line 100
    sget-object v0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->INSTANCES_BY_NAME:Ljava/util/HashMap;

    iget-object v1, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->fileName:Ljava/lang/String;

    invoke-virtual {v0, v1}, Ljava/util/HashMap;->remove(Ljava/lang/Object;)Ljava/lang/Object;

    .line 101
    iget-object v0, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->stream:Ljava/io/FileOutputStream;

    invoke-virtual {v0}, Ljava/io/FileOutputStream;->close()V

    return-void
.end method

.method public write([BI)V
    .registers 7
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 89
    iget-wide v0, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->processedBytes:J

    int-to-long v2, p2

    add-long/2addr v0, v2

    iput-wide v0, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->processedBytes:J

    .line 90
    iget-object v0, p0, Lcom/genymobile/scrcpy/FilePushHandler$FilePush;->stream:Ljava/io/FileOutputStream;

    const/4 v1, 0x0

    invoke-virtual {v0, p1, v1, p2}, Ljava/io/FileOutputStream;->write([BII)V

    return-void
.end method
