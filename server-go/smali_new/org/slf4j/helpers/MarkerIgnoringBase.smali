.class public abstract Lorg/slf4j/helpers/MarkerIgnoringBase;
.super Lorg/slf4j/helpers/NamedLoggerBase;
.source "MarkerIgnoringBase.java"

# interfaces
.implements Lorg/slf4j/Logger;


# static fields
.field private static final serialVersionUID:J = 0x7d83b1554e5d279bL


# direct methods
.method public constructor <init>()V
    .registers 1

    .line 7
    invoke-direct {p0}, Lorg/slf4j/helpers/NamedLoggerBase;-><init>()V

    return-void
.end method


# virtual methods
.method public debug(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .registers 3

    .line 52
    invoke-virtual {p0, p2}, Lorg/slf4j/helpers/MarkerIgnoringBase;->debug(Ljava/lang/String;)V

    .line 53
    return-void
.end method

.method public debug(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .registers 4

    .line 57
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->debug(Ljava/lang/String;Ljava/lang/Object;)V

    .line 58
    return-void
.end method

.method public debug(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 5

    .line 62
    invoke-virtual {p0, p2, p3, p4}, Lorg/slf4j/helpers/MarkerIgnoringBase;->debug(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 63
    return-void
.end method

.method public debug(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 72
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->debug(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 73
    return-void
.end method

.method public varargs debug(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 67
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->debug(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 68
    return-void
.end method

.method public error(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .registers 3

    .line 142
    invoke-virtual {p0, p2}, Lorg/slf4j/helpers/MarkerIgnoringBase;->error(Ljava/lang/String;)V

    .line 143
    return-void
.end method

.method public error(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .registers 4

    .line 147
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->error(Ljava/lang/String;Ljava/lang/Object;)V

    .line 148
    return-void
.end method

.method public error(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 5

    .line 152
    invoke-virtual {p0, p2, p3, p4}, Lorg/slf4j/helpers/MarkerIgnoringBase;->error(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 153
    return-void
.end method

.method public error(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 162
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->error(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 163
    return-void
.end method

.method public varargs error(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 157
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->error(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 158
    return-void
.end method

.method public getName()Ljava/lang/String;
    .registers 2

    .line 12
    invoke-super {p0}, Lorg/slf4j/helpers/NamedLoggerBase;->getName()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method

.method public info(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .registers 3

    .line 82
    invoke-virtual {p0, p2}, Lorg/slf4j/helpers/MarkerIgnoringBase;->info(Ljava/lang/String;)V

    .line 83
    return-void
.end method

.method public info(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .registers 4

    .line 87
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->info(Ljava/lang/String;Ljava/lang/Object;)V

    .line 88
    return-void
.end method

.method public info(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 5

    .line 92
    invoke-virtual {p0, p2, p3, p4}, Lorg/slf4j/helpers/MarkerIgnoringBase;->info(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 93
    return-void
.end method

.method public info(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 102
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->info(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 103
    return-void
.end method

.method public varargs info(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 97
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->info(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 98
    return-void
.end method

.method public isDebugEnabled(Lorg/slf4j/Marker;)Z
    .registers 2

    .line 47
    invoke-virtual {p0}, Lorg/slf4j/helpers/MarkerIgnoringBase;->isDebugEnabled()Z

    move-result p1

    return p1
.end method

.method public isErrorEnabled(Lorg/slf4j/Marker;)Z
    .registers 2

    .line 137
    invoke-virtual {p0}, Lorg/slf4j/helpers/MarkerIgnoringBase;->isErrorEnabled()Z

    move-result p1

    return p1
.end method

.method public isInfoEnabled(Lorg/slf4j/Marker;)Z
    .registers 2

    .line 77
    invoke-virtual {p0}, Lorg/slf4j/helpers/MarkerIgnoringBase;->isInfoEnabled()Z

    move-result p1

    return p1
.end method

.method public isTraceEnabled(Lorg/slf4j/Marker;)Z
    .registers 2

    .line 17
    invoke-virtual {p0}, Lorg/slf4j/helpers/MarkerIgnoringBase;->isTraceEnabled()Z

    move-result p1

    return p1
.end method

.method public isWarnEnabled(Lorg/slf4j/Marker;)Z
    .registers 2

    .line 107
    invoke-virtual {p0}, Lorg/slf4j/helpers/MarkerIgnoringBase;->isWarnEnabled()Z

    move-result p1

    return p1
.end method

.method public toString()Ljava/lang/String;
    .registers 3

    .line 166
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {p0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v1, "("

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {p0}, Lorg/slf4j/helpers/MarkerIgnoringBase;->getName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    const-string v1, ")"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method

.method public trace(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .registers 3

    .line 22
    invoke-virtual {p0, p2}, Lorg/slf4j/helpers/MarkerIgnoringBase;->trace(Ljava/lang/String;)V

    .line 23
    return-void
.end method

.method public trace(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .registers 4

    .line 27
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->trace(Ljava/lang/String;Ljava/lang/Object;)V

    .line 28
    return-void
.end method

.method public trace(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 5

    .line 32
    invoke-virtual {p0, p2, p3, p4}, Lorg/slf4j/helpers/MarkerIgnoringBase;->trace(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 33
    return-void
.end method

.method public trace(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 42
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->trace(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 43
    return-void
.end method

.method public varargs trace(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 37
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->trace(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 38
    return-void
.end method

.method public warn(Lorg/slf4j/Marker;Ljava/lang/String;)V
    .registers 3

    .line 112
    invoke-virtual {p0, p2}, Lorg/slf4j/helpers/MarkerIgnoringBase;->warn(Ljava/lang/String;)V

    .line 113
    return-void
.end method

.method public warn(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;)V
    .registers 4

    .line 117
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->warn(Ljava/lang/String;Ljava/lang/Object;)V

    .line 118
    return-void
.end method

.method public warn(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V
    .registers 5

    .line 122
    invoke-virtual {p0, p2, p3, p4}, Lorg/slf4j/helpers/MarkerIgnoringBase;->warn(Ljava/lang/String;Ljava/lang/Object;Ljava/lang/Object;)V

    .line 123
    return-void
.end method

.method public warn(Lorg/slf4j/Marker;Ljava/lang/String;Ljava/lang/Throwable;)V
    .registers 4

    .line 132
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->warn(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 133
    return-void
.end method

.method public varargs warn(Lorg/slf4j/Marker;Ljava/lang/String;[Ljava/lang/Object;)V
    .registers 4

    .line 127
    invoke-virtual {p0, p2, p3}, Lorg/slf4j/helpers/MarkerIgnoringBase;->warn(Ljava/lang/String;[Ljava/lang/Object;)V

    .line 128
    return-void
.end method
