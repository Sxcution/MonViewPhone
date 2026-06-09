.class public final Lcom/genymobile/scrcpy/IO;
.super Ljava/lang/Object;
.source "IO.java"


# direct methods
.method private constructor <init>()V
    .registers 1

    .line 12
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method public static writeFully(Ljava/io/FileDescriptor;Ljava/nio/ByteBuffer;)V
    .registers 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 20
    invoke-virtual {p1}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v0

    :goto_4
    if-lez v0, :cond_1a

    .line 23
    :try_start_6
    invoke-static {p0, p1}, Landroid/system/Os;->write(Ljava/io/FileDescriptor;Ljava/nio/ByteBuffer;)I

    move-result v1
    :try_end_a
    .catch Landroid/system/ErrnoException; {:try_start_6 .. :try_end_a} :catch_c

    sub-int/2addr v0, v1

    goto :goto_4

    :catch_c
    move-exception v1

    .line 30
    iget v2, v1, Landroid/system/ErrnoException;->errno:I

    sget v3, Landroid/system/OsConstants;->EINTR:I

    if-ne v2, v3, :cond_14

    goto :goto_4

    .line 31
    :cond_14
    new-instance p0, Ljava/io/IOException;

    invoke-direct {p0, v1}, Ljava/io/IOException;-><init>(Ljava/lang/Throwable;)V

    throw p0

    :cond_1a
    return-void
.end method

.method public static writeFully(Ljava/io/FileDescriptor;[BII)V
    .registers 4
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
