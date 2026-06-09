.class public Lorg/java_websocket/util/Base64$OutputStream;
.super Ljava/io/FilterOutputStream;
.source "Base64.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lorg/java_websocket/util/Base64;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x9
    name = "OutputStream"
.end annotation


# instance fields
.field private b4:[B

.field private breakLines:Z

.field private buffer:[B

.field private bufferLength:I

.field private decodabet:[B

.field private encode:Z

.field private lineLength:I

.field private options:I

.field private position:I

.field private suspendEncoding:Z


# direct methods
.method public constructor <init>(Ljava/io/OutputStream;)V
    .registers 3

    .line 166
    const/4 v0, 0x1

    invoke-direct {p0, p1, v0}, Lorg/java_websocket/util/Base64$OutputStream;-><init>(Ljava/io/OutputStream;I)V

    .line 167
    return-void
.end method

.method public constructor <init>(Ljava/io/OutputStream;I)V
    .registers 5

    .line 170
    invoke-direct {p0, p1}, Ljava/io/FilterOutputStream;-><init>(Ljava/io/OutputStream;)V

    .line 171
    and-int/lit8 p1, p2, 0x8

    const/4 v0, 0x1

    const/4 v1, 0x0

    if-eqz p1, :cond_b

    const/4 p1, 0x1

    goto :goto_c

    :cond_b
    const/4 p1, 0x0

    :goto_c
    iput-boolean p1, p0, Lorg/java_websocket/util/Base64$OutputStream;->breakLines:Z

    .line 172
    and-int/lit8 p1, p2, 0x1

    if-eqz p1, :cond_13

    goto :goto_14

    :cond_13
    const/4 v0, 0x0

    .line 173
    :goto_14
    iput-boolean v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->encode:Z

    .line 174
    const/4 p1, 0x4

    if-eqz v0, :cond_1b

    const/4 v0, 0x3

    goto :goto_1c

    :cond_1b
    const/4 v0, 0x4

    .line 175
    :goto_1c
    iput v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->bufferLength:I

    .line 176
    new-array v0, v0, [B

    iput-object v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->buffer:[B

    .line 177
    iput v1, p0, Lorg/java_websocket/util/Base64$OutputStream;->position:I

    .line 178
    iput v1, p0, Lorg/java_websocket/util/Base64$OutputStream;->lineLength:I

    .line 179
    iput-boolean v1, p0, Lorg/java_websocket/util/Base64$OutputStream;->suspendEncoding:Z

    .line 180
    new-array p1, p1, [B

    iput-object p1, p0, Lorg/java_websocket/util/Base64$OutputStream;->b4:[B

    .line 181
    iput p2, p0, Lorg/java_websocket/util/Base64$OutputStream;->options:I

    .line 182
    invoke-static {p2}, Lorg/java_websocket/util/Base64;->getDecodabet(I)[B

    move-result-object p1

    iput-object p1, p0, Lorg/java_websocket/util/Base64$OutputStream;->decodabet:[B

    .line 183
    return-void
.end method


# virtual methods
.method public close()V
    .registers 2
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 254
    invoke-virtual {p0}, Lorg/java_websocket/util/Base64$OutputStream;->flushBase64()V

    .line 255
    invoke-super {p0}, Ljava/io/FilterOutputStream;->close()V

    .line 256
    const/4 v0, 0x0

    iput-object v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->buffer:[B

    .line 257
    iput-object v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->out:Ljava/io/OutputStream;

    .line 258
    return-void
.end method

.method public flushBase64()V
    .registers 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 242
    iget v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->position:I

    if-lez v0, :cond_25

    .line 243
    iget-boolean v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->encode:Z

    if-eqz v0, :cond_1d

    .line 244
    iget-object v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->out:Ljava/io/OutputStream;

    iget-object v1, p0, Lorg/java_websocket/util/Base64$OutputStream;->b4:[B

    iget-object v2, p0, Lorg/java_websocket/util/Base64$OutputStream;->buffer:[B

    iget v3, p0, Lorg/java_websocket/util/Base64$OutputStream;->position:I

    iget v4, p0, Lorg/java_websocket/util/Base64$OutputStream;->options:I

    invoke-static {v1, v2, v3, v4}, Lorg/java_websocket/util/Base64;->encode3to4([B[BII)[B

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/io/OutputStream;->write([B)V

    .line 245
    const/4 v0, 0x0

    iput v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->position:I

    .line 246
    return-void

    .line 248
    :cond_1d
    new-instance v0, Ljava/io/IOException;

    const-string v1, "Base64 input not properly padded."

    invoke-direct {v0, v1}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v0

    .line 250
    :cond_25
    return-void
.end method

.method public write(I)V
    .registers 7
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 187
    iget-boolean v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->suspendEncoding:Z

    if-eqz v0, :cond_a

    .line 188
    iget-object v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->out:Ljava/io/OutputStream;

    invoke-virtual {v0, p1}, Ljava/io/OutputStream;->write(I)V

    .line 189
    return-void

    .line 191
    :cond_a
    iget-boolean v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->encode:Z

    const/4 v1, 0x0

    if-eqz v0, :cond_4a

    .line 192
    iget-object v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->buffer:[B

    .line 193
    iget v2, p0, Lorg/java_websocket/util/Base64$OutputStream;->position:I

    .line 194
    add-int/lit8 v3, v2, 0x1

    .line 195
    iput v3, p0, Lorg/java_websocket/util/Base64$OutputStream;->position:I

    .line 196
    int-to-byte p1, p1

    aput-byte p1, v0, v2

    .line 197
    iget p1, p0, Lorg/java_websocket/util/Base64$OutputStream;->bufferLength:I

    if-lt v3, p1, :cond_49

    .line 198
    iget-object p1, p0, Lorg/java_websocket/util/Base64$OutputStream;->out:Ljava/io/OutputStream;

    iget-object v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->b4:[B

    iget-object v2, p0, Lorg/java_websocket/util/Base64$OutputStream;->buffer:[B

    iget v3, p0, Lorg/java_websocket/util/Base64$OutputStream;->bufferLength:I

    iget v4, p0, Lorg/java_websocket/util/Base64$OutputStream;->options:I

    invoke-static {v0, v2, v3, v4}, Lorg/java_websocket/util/Base64;->encode3to4([B[BII)[B

    move-result-object v0

    invoke-virtual {p1, v0}, Ljava/io/OutputStream;->write([B)V

    .line 199
    iget p1, p0, Lorg/java_websocket/util/Base64$OutputStream;->lineLength:I

    add-int/lit8 p1, p1, 0x4

    .line 200
    iput p1, p0, Lorg/java_websocket/util/Base64$OutputStream;->lineLength:I

    .line 201
    iget-boolean v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->breakLines:Z

    if-eqz v0, :cond_46

    const/16 v0, 0x4c

    if-lt p1, v0, :cond_46

    .line 202
    iget-object p1, p0, Lorg/java_websocket/util/Base64$OutputStream;->out:Ljava/io/OutputStream;

    const/16 v0, 0xa

    invoke-virtual {p1, v0}, Ljava/io/OutputStream;->write(I)V

    .line 203
    iput v1, p0, Lorg/java_websocket/util/Base64$OutputStream;->lineLength:I

    .line 205
    :cond_46
    iput v1, p0, Lorg/java_websocket/util/Base64$OutputStream;->position:I

    .line 206
    return-void

    .line 208
    :cond_49
    return-void

    .line 210
    :cond_4a
    iget-object v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->decodabet:[B

    .line 211
    and-int/lit8 v2, p1, 0x7f

    .line 212
    aget-byte v3, v0, v2

    const/4 v4, -0x5

    if-le v3, v4, :cond_75

    .line 213
    iget-object v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->buffer:[B

    .line 214
    iget v2, p0, Lorg/java_websocket/util/Base64$OutputStream;->position:I

    .line 215
    add-int/lit8 v3, v2, 0x1

    .line 216
    iput v3, p0, Lorg/java_websocket/util/Base64$OutputStream;->position:I

    .line 217
    int-to-byte p1, p1

    aput-byte p1, v0, v2

    .line 218
    iget p1, p0, Lorg/java_websocket/util/Base64$OutputStream;->bufferLength:I

    if-lt v3, p1, :cond_74

    .line 219
    iget-object p1, p0, Lorg/java_websocket/util/Base64$OutputStream;->out:Ljava/io/OutputStream;

    iget-object v2, p0, Lorg/java_websocket/util/Base64$OutputStream;->b4:[B

    iget-object v3, p0, Lorg/java_websocket/util/Base64$OutputStream;->b4:[B

    iget v4, p0, Lorg/java_websocket/util/Base64$OutputStream;->options:I

    invoke-static {v0, v1, v3, v1, v4}, Lorg/java_websocket/util/Base64;->decode4to3([BI[BII)I

    move-result v0

    invoke-virtual {p1, v2, v1, v0}, Ljava/io/OutputStream;->write([BII)V

    .line 220
    iput v1, p0, Lorg/java_websocket/util/Base64$OutputStream;->position:I

    .line 221
    return-void

    .line 223
    :cond_74
    return-void

    .line 225
    :cond_75
    aget-byte p1, v0, v2

    if-ne p1, v4, :cond_7a

    .line 228
    return-void

    .line 226
    :cond_7a
    new-instance p1, Ljava/io/IOException;

    const-string v0, "Invalid character in Base64 data."

    invoke-direct {p1, v0}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1
.end method

.method public write([BII)V
    .registers 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 232
    iget-boolean v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->suspendEncoding:Z

    if-eqz v0, :cond_a

    .line 233
    iget-object v0, p0, Lorg/java_websocket/util/Base64$OutputStream;->out:Ljava/io/OutputStream;

    invoke-virtual {v0, p1, p2, p3}, Ljava/io/OutputStream;->write([BII)V

    .line 234
    return-void

    .line 236
    :cond_a
    const/4 v0, 0x0

    :goto_b
    if-ge v0, p3, :cond_17

    .line 237
    add-int v1, p2, v0

    aget-byte v1, p1, v1

    invoke-virtual {p0, v1}, Lorg/java_websocket/util/Base64$OutputStream;->write(I)V

    .line 236
    add-int/lit8 v0, v0, 0x1

    goto :goto_b

    .line 239
    :cond_17
    return-void
.end method
