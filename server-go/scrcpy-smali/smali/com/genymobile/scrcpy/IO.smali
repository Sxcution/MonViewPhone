.class public final Lcom/genymobile/scrcpy/IO;
.super Ljava/lang/Object;
.source "IO.java"


# direct methods
.method private constructor <init>()V
    .locals 0

    .line 12
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method public static writeFully(Ljava/io/FileDescriptor;Ljava/nio/ByteBuffer;)V
    .locals 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 20
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    :goto_0
    if-lez v0, :cond_1

    .line 23
    :try_start_0
    invoke-static {p0, p1}, Landroid/system/Os;->write(Ljava/io/FileDescriptor;Ljava/nio/ByteBuffer;)I

    move-result v1
    :try_end_0
    .catch Landroid/system/ErrnoException; {:try_start_0 .. :try_end_0} :catch_0

    sub-int/2addr v0, v1

    goto :goto_0

    :catch_0
    move-exception v1

    .line 30
    iget v2, v1, Landroid/system/ErrnoException;->errno:I

    sget v3, Landroid/system/OsConstants;->EINTR:I

    if-ne v2, v3, :cond_0

    goto :goto_0

    .line 31
    :cond_0
    new-instance p0, Ljava/io/IOException;

    invoke-direct {p0, v1}, Ljava/io/IOException;-><init>(Ljava/lang/Throwable;)V

    throw p0

    :cond_1
    return-void
.end method

.method public static writeFully(Ljava/io/FileDescriptor;[BII)V
    .locals 0
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 38
    invoke-static {p1, p2, p3}, Ljava/nio/ByteBuffer;->wrap([BII)Ljava/nio/ByteBuffer;

    move-result-object p1

    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/IO;->writeFully(Ljava/io/FileDescriptor;Ljava/nio/ByteBuffer;)V

    return-void
.end method
