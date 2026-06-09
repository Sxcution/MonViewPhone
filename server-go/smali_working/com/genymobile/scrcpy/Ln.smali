.class public final Lcom/genymobile/scrcpy/Ln;
.super Ljava/lang/Object;
.source "Ln.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/genymobile/scrcpy/Ln$Level;
    }
.end annotation


# static fields
.field private static final PREFIX:Ljava/lang/String; = "[server] "

.field private static final TAG:Ljava/lang/String; = "scrcpy"

.field private static threshold:Lcom/genymobile/scrcpy/Ln$Level;


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .line 18
    sget-object v0, Lcom/genymobile/scrcpy/Ln$Level;->INFO:Lcom/genymobile/scrcpy/Ln$Level;

    sput-object v0, Lcom/genymobile/scrcpy/Ln;->threshold:Lcom/genymobile/scrcpy/Ln$Level;

    return-void
.end method

.method private constructor <init>()V
    .registers 1

    .line 20
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method public static d(Ljava/lang/String;)V
    .registers 4

    .line 47
    sget-object v0, Lcom/genymobile/scrcpy/Ln$Level;->DEBUG:Lcom/genymobile/scrcpy/Ln$Level;

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->isEnabled(Lcom/genymobile/scrcpy/Ln$Level;)Z

    move-result v0

    if-eqz v0, :cond_23

    const-string v0, "scrcpy"

    .line 48
    invoke-static {v0, p0}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    .line 49
    sget-object v0, Ljava/lang/System;->out:Ljava/io/PrintStream;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "[server] DEBUG: "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/io/PrintStream;->println(Ljava/lang/String;)V

    :cond_23
    return-void
.end method

.method public static e(Ljava/lang/String;)V
    .registers 2

    const/4 v0, 0x0

    .line 78
    invoke-static {p0, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    return-void
.end method

.method public static e(Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 5

    .line 68
    sget-object v0, Lcom/genymobile/scrcpy/Ln$Level;->ERROR:Lcom/genymobile/scrcpy/Ln$Level;

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->isEnabled(Lcom/genymobile/scrcpy/Ln$Level;)Z

    move-result v0

    if-eqz v0, :cond_28

    const-string v0, "scrcpy"

    .line 69
    invoke-static {v0, p0, p1}, Landroid/util/Log;->e(Ljava/lang/String;Ljava/lang/String;Ljava/lang/Throwable;)I

    .line 70
    sget-object v0, Ljava/lang/System;->out:Ljava/io/PrintStream;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "[server] ERROR: "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/io/PrintStream;->println(Ljava/lang/String;)V

    if-eqz p1, :cond_28

    .line 72
    invoke-virtual {p1}, Ljava/lang/Throwable;->printStackTrace()V

    :cond_28
    return-void
.end method

.method public static i(Ljava/lang/String;)V
    .registers 4

    .line 54
    sget-object v0, Lcom/genymobile/scrcpy/Ln$Level;->INFO:Lcom/genymobile/scrcpy/Ln$Level;

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->isEnabled(Lcom/genymobile/scrcpy/Ln$Level;)Z

    move-result v0

    if-eqz v0, :cond_23

    const-string v0, "scrcpy"

    .line 55
    invoke-static {v0, p0}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I

    .line 56
    sget-object v0, Ljava/lang/System;->out:Ljava/io/PrintStream;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "[server] INFO: "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/io/PrintStream;->println(Ljava/lang/String;)V

    :cond_23
    return-void
.end method

.method public static initLogLevel(Lcom/genymobile/scrcpy/Ln$Level;)V
    .registers 1

    .line 32
    sput-object p0, Lcom/genymobile/scrcpy/Ln;->threshold:Lcom/genymobile/scrcpy/Ln$Level;

    return-void
.end method

.method public static isEnabled(Lcom/genymobile/scrcpy/Ln$Level;)Z
    .registers 2

    .line 36
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/Ln$Level;->ordinal()I

    move-result p0

    sget-object v0, Lcom/genymobile/scrcpy/Ln;->threshold:Lcom/genymobile/scrcpy/Ln$Level;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Ln$Level;->ordinal()I

    move-result v0

    if-lt p0, v0, :cond_e

    const/4 p0, 0x1

    goto :goto_f

    :cond_e
    const/4 p0, 0x0

    :goto_f
    return p0
.end method

.method public static v(Ljava/lang/String;)V
    .registers 4

    .line 40
    sget-object v0, Lcom/genymobile/scrcpy/Ln$Level;->VERBOSE:Lcom/genymobile/scrcpy/Ln$Level;

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->isEnabled(Lcom/genymobile/scrcpy/Ln$Level;)Z

    move-result v0

    if-eqz v0, :cond_23

    const-string v0, "scrcpy"

    .line 41
    invoke-static {v0, p0}, Landroid/util/Log;->v(Ljava/lang/String;Ljava/lang/String;)I

    .line 42
    sget-object v0, Ljava/lang/System;->out:Ljava/io/PrintStream;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "[server] VERBOSE: "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/io/PrintStream;->println(Ljava/lang/String;)V

    :cond_23
    return-void
.end method

.method public static w(Ljava/lang/String;)V
    .registers 4

    .line 61
    sget-object v0, Lcom/genymobile/scrcpy/Ln$Level;->WARN:Lcom/genymobile/scrcpy/Ln$Level;

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->isEnabled(Lcom/genymobile/scrcpy/Ln$Level;)Z

    move-result v0

    if-eqz v0, :cond_23

    const-string v0, "scrcpy"

    .line 62
    invoke-static {v0, p0}, Landroid/util/Log;->w(Ljava/lang/String;Ljava/lang/String;)I

    .line 63
    sget-object v0, Ljava/lang/System;->out:Ljava/io/PrintStream;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "[server] WARN: "

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1, p0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-virtual {v0, p0}, Ljava/io/PrintStream;->println(Ljava/lang/String;)V

    :cond_23
    return-void
.end method
