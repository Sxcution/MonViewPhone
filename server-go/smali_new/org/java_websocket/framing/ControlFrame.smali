.class public abstract Lorg/java_websocket/framing/ControlFrame;
.super Lorg/java_websocket/framing/FramedataImpl1;
.source "ControlFrame.java"


# direct methods
.method public constructor <init>(Lorg/java_websocket/enums/Opcode;)V
    .registers 2

    .line 10
    invoke-direct {p0, p1}, Lorg/java_websocket/framing/FramedataImpl1;-><init>(Lorg/java_websocket/enums/Opcode;)V

    .line 11
    return-void
.end method


# virtual methods
.method public isValid()V
    .registers 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Lorg/java_websocket/exceptions/InvalidDataException;
        }
    .end annotation

    .line 15
    invoke-virtual {p0}, Lorg/java_websocket/framing/ControlFrame;->isFin()Z

    move-result v0

    if-eqz v0, :cond_31

    .line 18
    invoke-virtual {p0}, Lorg/java_websocket/framing/ControlFrame;->isRSV1()Z

    move-result v0

    if-nez v0, :cond_29

    .line 21
    invoke-virtual {p0}, Lorg/java_websocket/framing/ControlFrame;->isRSV2()Z

    move-result v0

    if-nez v0, :cond_21

    .line 24
    invoke-virtual {p0}, Lorg/java_websocket/framing/ControlFrame;->isRSV3()Z

    move-result v0

    if-nez v0, :cond_19

    .line 27
    return-void

    .line 25
    :cond_19
    new-instance v0, Lorg/java_websocket/exceptions/InvalidFrameException;

    const-string v1, "Control frame cant have rsv3==true set"

    invoke-direct {v0, v1}, Lorg/java_websocket/exceptions/InvalidFrameException;-><init>(Ljava/lang/String;)V

    throw v0

    .line 22
    :cond_21
    new-instance v0, Lorg/java_websocket/exceptions/InvalidFrameException;

    const-string v1, "Control frame cant have rsv2==true set"

    invoke-direct {v0, v1}, Lorg/java_websocket/exceptions/InvalidFrameException;-><init>(Ljava/lang/String;)V

    throw v0

    .line 19
    :cond_29
    new-instance v0, Lorg/java_websocket/exceptions/InvalidFrameException;

    const-string v1, "Control frame cant have rsv1==true set"

    invoke-direct {v0, v1}, Lorg/java_websocket/exceptions/InvalidFrameException;-><init>(Ljava/lang/String;)V

    throw v0

    .line 16
    :cond_31
    new-instance v0, Lorg/java_websocket/exceptions/InvalidFrameException;

    const-string v1, "Control frame cant have fin==false set"

    invoke-direct {v0, v1}, Lorg/java_websocket/exceptions/InvalidFrameException;-><init>(Ljava/lang/String;)V

    throw v0
.end method
