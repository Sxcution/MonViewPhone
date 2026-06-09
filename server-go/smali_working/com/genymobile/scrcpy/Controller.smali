.class public Lcom/genymobile/scrcpy/Controller;
.super Ljava/lang/Object;
.source "Controller.java"


# static fields
.field private static final DEFAULT_DEVICE_ID:I

.field private static final EXECUTOR:Ljava/util/concurrent/ScheduledExecutorService;


# instance fields
.field private final charMap:Landroid/view/KeyCharacterMap;

.field private final connection:Lcom/genymobile/scrcpy/Connection;

.field private final device:Lcom/genymobile/scrcpy/Device;

.field private keepPowerModeOff:Z

.field private lastTouchDown:J

.field private final pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

.field private final pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

.field private final pointersState:Lcom/genymobile/scrcpy/PointersState;

.field private final sender:Lcom/genymobile/scrcpy/DeviceMessageSender;


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .line 19
    invoke-static {}, Ljava/util/concurrent/Executors;->newSingleThreadScheduledExecutor()Ljava/util/concurrent/ScheduledExecutorService;

    move-result-object v0

    sput-object v0, Lcom/genymobile/scrcpy/Controller;->EXECUTOR:Ljava/util/concurrent/ScheduledExecutorService;

    return-void
.end method

.method public constructor <init>(Lcom/genymobile/scrcpy/Device;Lcom/genymobile/scrcpy/Connection;)V
    .registers 5

    .line 34
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const/4 v0, -0x1

    .line 25
    invoke-static {v0}, Landroid/view/KeyCharacterMap;->load(I)Landroid/view/KeyCharacterMap;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/Controller;->charMap:Landroid/view/KeyCharacterMap;

    .line 28
    new-instance v0, Lcom/genymobile/scrcpy/PointersState;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/PointersState;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/Controller;->pointersState:Lcom/genymobile/scrcpy/PointersState;

    const/16 v0, 0xa

    new-array v1, v0, [Landroid/view/MotionEvent$PointerProperties;

    .line 29
    iput-object v1, p0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    new-array v0, v0, [Landroid/view/MotionEvent$PointerCoords;

    .line 30
    iput-object v0, p0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    .line 35
    iput-object p1, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    .line 36
    iput-object p2, p0, Lcom/genymobile/scrcpy/Controller;->connection:Lcom/genymobile/scrcpy/Connection;

    .line 37
    invoke-direct {p0}, Lcom/genymobile/scrcpy/Controller;->initPointers()V

    .line 38
    new-instance p1, Lcom/genymobile/scrcpy/DeviceMessageSender;

    invoke-direct {p1, p2}, Lcom/genymobile/scrcpy/DeviceMessageSender;-><init>(Lcom/genymobile/scrcpy/Connection;)V

    iput-object p1, p0, Lcom/genymobile/scrcpy/Controller;->sender:Lcom/genymobile/scrcpy/DeviceMessageSender;

    return-void
.end method

.method private initPointers()V
    .registers 5

    const/4 v0, 0x0

    :goto_1
    const/16 v1, 0xa

    if-ge v0, v1, :cond_22

    .line 43
    new-instance v1, Landroid/view/MotionEvent$PointerProperties;

    invoke-direct {v1}, Landroid/view/MotionEvent$PointerProperties;-><init>()V

    const/4 v2, 0x1

    .line 44
    iput v2, v1, Landroid/view/MotionEvent$PointerProperties;->toolType:I

    .line 46
    new-instance v2, Landroid/view/MotionEvent$PointerCoords;

    invoke-direct {v2}, Landroid/view/MotionEvent$PointerCoords;-><init>()V

    const/4 v3, 0x0

    .line 47
    iput v3, v2, Landroid/view/MotionEvent$PointerCoords;->orientation:F

    .line 48
    iput v3, v2, Landroid/view/MotionEvent$PointerCoords;->size:F

    .line 50
    iget-object v3, p0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    aput-object v1, v3, v0

    .line 51
    iget-object v1, p0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    aput-object v2, v1, v0

    add-int/lit8 v0, v0, 0x1

    goto :goto_1

    :cond_22
    return-void
.end method

.method private injectChar(C)Z
    .registers 8

    .line 135
    invoke-static {p1}, Lcom/genymobile/scrcpy/KeyComposition;->decompose(C)Ljava/lang/String;

    move-result-object v0

    const/4 v1, 0x1

    const/4 v2, 0x0

    if-eqz v0, :cond_d

    .line 136
    invoke-virtual {v0}, Ljava/lang/String;->toCharArray()[C

    move-result-object p1

    goto :goto_12

    :cond_d
    new-array v0, v1, [C

    aput-char p1, v0, v2

    move-object p1, v0

    .line 137
    :goto_12
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->charMap:Landroid/view/KeyCharacterMap;

    invoke-virtual {v0, p1}, Landroid/view/KeyCharacterMap;->getEvents([C)[Landroid/view/KeyEvent;

    move-result-object p1

    if-nez p1, :cond_1b

    return v2

    .line 141
    :cond_1b
    array-length v0, p1

    const/4 v3, 0x0

    :goto_1d
    if-ge v3, v0, :cond_2d

    aget-object v4, p1, v3

    .line 142
    iget-object v5, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v5, v4}, Lcom/genymobile/scrcpy/Device;->injectEvent(Landroid/view/InputEvent;)Z

    move-result v4

    if-nez v4, :cond_2a

    return v2

    :cond_2a
    add-int/lit8 v3, v3, 0x1

    goto :goto_1d

    :cond_2d
    return v1
.end method

.method private injectKeycode(IIII)Z
    .registers 6

    .line 128
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Controller;->keepPowerModeOff:Z

    if-eqz v0, :cond_12

    const/4 v0, 0x1

    if-ne p1, v0, :cond_12

    const/16 v0, 0x1a

    if-eq p2, v0, :cond_f

    const/16 v0, 0xe0

    if-ne p2, v0, :cond_12

    .line 129
    :cond_f
    invoke-static {}, Lcom/genymobile/scrcpy/Controller;->schedulePowerModeOff()V

    .line 131
    :cond_12
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0, p1, p2, p3, p4}, Lcom/genymobile/scrcpy/Device;->injectKeyEvent(IIII)Z

    move-result p1

    return p1
.end method

.method private injectScroll(Lcom/genymobile/scrcpy/Position;II)Z
    .registers 21

    move-object/from16 v0, p0

    .line 210
    invoke-static {}, Landroid/os/SystemClock;->uptimeMillis()J

    move-result-wide v3

    .line 211
    iget-object v1, v0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    move-object/from16 v2, p1

    invoke-virtual {v1, v2}, Lcom/genymobile/scrcpy/Device;->getPhysicalPoint(Lcom/genymobile/scrcpy/Position;)Lcom/genymobile/scrcpy/Point;

    move-result-object v1

    const/4 v2, 0x0

    if-nez v1, :cond_12

    return v2

    .line 217
    :cond_12
    iget-object v5, v0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    aget-object v5, v5, v2

    .line 218
    iput v2, v5, Landroid/view/MotionEvent$PointerProperties;->id:I

    .line 220
    iget-object v5, v0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    aget-object v2, v5, v2

    .line 221
    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Point;->getX()I

    move-result v5

    int-to-float v5, v5

    iput v5, v2, Landroid/view/MotionEvent$PointerCoords;->x:F

    .line 222
    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Point;->getY()I

    move-result v1

    int-to-float v1, v1

    iput v1, v2, Landroid/view/MotionEvent$PointerCoords;->y:F

    const/16 v1, 0xa

    move/from16 v5, p2

    int-to-float v5, v5

    .line 223
    invoke-virtual {v2, v1, v5}, Landroid/view/MotionEvent$PointerCoords;->setAxisValue(IF)V

    const/16 v1, 0x9

    move/from16 v5, p3

    int-to-float v5, v5

    .line 224
    invoke-virtual {v2, v1, v5}, Landroid/view/MotionEvent$PointerCoords;->setAxisValue(IF)V

    .line 226
    iget-wide v1, v0, Lcom/genymobile/scrcpy/Controller;->lastTouchDown:J

    const/16 v5, 0x8

    const/4 v6, 0x1

    iget-object v7, v0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    iget-object v8, v0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    const/4 v9, 0x0

    const/4 v10, 0x0

    const/high16 v11, 0x3f800000    # 1.0f

    const/high16 v12, 0x3f800000    # 1.0f

    const/4 v13, 0x0

    const/4 v14, 0x0

    const/16 v15, 0x2002

    const/16 v16, 0x0

    .line 227
    invoke-static/range {v1 .. v16}, Landroid/view/MotionEvent;->obtain(JJII[Landroid/view/MotionEvent$PointerProperties;[Landroid/view/MotionEvent$PointerCoords;IIFFIIII)Landroid/view/MotionEvent;

    move-result-object v1

    .line 229
    iget-object v2, v0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v2, v1}, Lcom/genymobile/scrcpy/Device;->injectEvent(Landroid/view/InputEvent;)Z

    move-result v1

    return v1
.end method

.method private injectText(Ljava/lang/String;)I
    .registers 9

    .line 151
    invoke-virtual {p1}, Ljava/lang/String;->toCharArray()[C

    move-result-object p1

    array-length v0, p1

    const/4 v1, 0x0

    const/4 v2, 0x0

    const/4 v3, 0x0

    :goto_8
    if-ge v2, v0, :cond_3b

    aget-char v4, p1, v2

    .line 152
    invoke-direct {p0, v4}, Lcom/genymobile/scrcpy/Controller;->injectChar(C)Z

    move-result v5

    if-nez v5, :cond_36

    .line 153
    new-instance v5, Ljava/lang/StringBuilder;

    invoke-direct {v5}, Ljava/lang/StringBuilder;-><init>()V

    const-string v6, "Could not inject char u+"

    invoke-virtual {v5, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const/4 v6, 0x1

    new-array v6, v6, [Ljava/lang/Object;

    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    aput-object v4, v6, v1

    const-string v4, "%04x"

    invoke-static {v4, v6}, Ljava/lang/String;->format(Ljava/lang/String;[Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v5, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v5}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    invoke-static {v4}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    goto :goto_38

    :cond_36
    add-int/lit8 v3, v3, 0x1

    :goto_38
    add-int/lit8 v2, v2, 0x1

    goto :goto_8

    :cond_3b
    return v3
.end method

.method private injectTouch(IJLcom/genymobile/scrcpy/Position;FI)Z
    .registers 25

    move-object/from16 v0, p0

    move/from16 v1, p1

    .line 162
    invoke-static {}, Landroid/os/SystemClock;->uptimeMillis()J

    move-result-wide v3

    .line 164
    iget-object v2, v0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    move-object/from16 v5, p4

    invoke-virtual {v2, v5}, Lcom/genymobile/scrcpy/Device;->getPhysicalPoint(Lcom/genymobile/scrcpy/Position;)Lcom/genymobile/scrcpy/Point;

    move-result-object v2

    const/4 v5, 0x0

    if-nez v2, :cond_19

    const-string v1, "Ignore touch event, it was generated for a different device size"

    .line 166
    invoke-static {v1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    return v5

    .line 170
    :cond_19
    iget-object v6, v0, Lcom/genymobile/scrcpy/Controller;->pointersState:Lcom/genymobile/scrcpy/PointersState;

    move-wide/from16 v7, p2

    invoke-virtual {v6, v7, v8}, Lcom/genymobile/scrcpy/PointersState;->getPointerIndex(J)I

    move-result v6

    const/4 v7, -0x1

    if-ne v6, v7, :cond_2a

    const-string v1, "Too many pointers for touch event"

    .line 172
    invoke-static {v1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    return v5

    .line 175
    :cond_2a
    iget-object v7, v0, Lcom/genymobile/scrcpy/Controller;->pointersState:Lcom/genymobile/scrcpy/PointersState;

    invoke-virtual {v7, v6}, Lcom/genymobile/scrcpy/PointersState;->get(I)Lcom/genymobile/scrcpy/Pointer;

    move-result-object v7

    .line 176
    invoke-virtual {v7, v2}, Lcom/genymobile/scrcpy/Pointer;->setPoint(Lcom/genymobile/scrcpy/Point;)V

    move/from16 v2, p5

    .line 177
    invoke-virtual {v7, v2}, Lcom/genymobile/scrcpy/Pointer;->setPressure(F)V

    const/4 v2, 0x1

    if-ne v1, v2, :cond_3d

    const/4 v8, 0x1

    goto :goto_3e

    :cond_3d
    const/4 v8, 0x0

    .line 178
    :goto_3e
    invoke-virtual {v7, v8}, Lcom/genymobile/scrcpy/Pointer;->setUp(Z)V

    .line 180
    iget-object v7, v0, Lcom/genymobile/scrcpy/Controller;->pointersState:Lcom/genymobile/scrcpy/PointersState;

    iget-object v8, v0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    iget-object v9, v0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    invoke-virtual {v7, v8, v9}, Lcom/genymobile/scrcpy/PointersState;->update([Landroid/view/MotionEvent$PointerProperties;[Landroid/view/MotionEvent$PointerCoords;)I

    move-result v7

    if-ne v7, v2, :cond_52

    if-nez v1, :cond_5f

    .line 184
    iput-wide v3, v0, Lcom/genymobile/scrcpy/Controller;->lastTouchDown:J

    goto :goto_5f

    :cond_52
    if-ne v1, v2, :cond_59

    shl-int/lit8 v1, v6, 0x8

    or-int/lit8 v1, v1, 0x6

    goto :goto_5f

    :cond_59
    if-nez v1, :cond_5f

    shl-int/lit8 v1, v6, 0x8

    or-int/lit8 v1, v1, 0x5

    :cond_5f
    :goto_5f
    move v6, v1

    and-int/lit8 v1, p6, -0x2

    if-eqz v1, :cond_65

    goto :goto_66

    :cond_65
    const/4 v2, 0x0

    :goto_66
    const/16 v1, 0x2002

    if-eqz v2, :cond_6d

    const/16 v15, 0x2002

    goto :goto_71

    :cond_6d
    const/16 v2, 0x1002

    const/16 v15, 0x1002

    :goto_71
    if-eq v15, v1, :cond_75

    const/4 v10, 0x0

    goto :goto_77

    :cond_75
    move/from16 v10, p6

    .line 203
    :goto_77
    iget-wide v1, v0, Lcom/genymobile/scrcpy/Controller;->lastTouchDown:J

    iget-object v8, v0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    iget-object v9, v0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    const/4 v11, 0x0

    const/high16 v12, 0x3f800000    # 1.0f

    const/high16 v13, 0x3f800000    # 1.0f

    const/4 v14, 0x0

    const/16 v16, 0x0

    const/16 v17, 0x0

    move v5, v6

    move v6, v7

    move-object v7, v8

    move-object v8, v9

    move v9, v11

    move v11, v12

    move v12, v13

    move v13, v14

    move/from16 v14, v16

    move/from16 v16, v17

    .line 204
    invoke-static/range {v1 .. v16}, Landroid/view/MotionEvent;->obtain(JJII[Landroid/view/MotionEvent$PointerProperties;[Landroid/view/MotionEvent$PointerCoords;IIFFIIII)Landroid/view/MotionEvent;

    move-result-object v1

    .line 206
    iget-object v2, v0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v2, v1}, Lcom/genymobile/scrcpy/Device;->injectEvent(Landroid/view/InputEvent;)Z

    move-result v1

    return v1
.end method

.method private pressBackOrTurnScreenOn(I)Z
    .registers 5

    .line 246
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->isScreenOn()Z

    move-result v0

    if-eqz v0, :cond_f

    .line 247
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    const/4 v1, 0x4

    const/4 v2, 0x0

    invoke-virtual {v0, p1, v1, v2, v2}, Lcom/genymobile/scrcpy/Device;->injectKeyEvent(IIII)Z

    move-result p1

    return p1

    :cond_f
    if-eqz p1, :cond_13

    const/4 p1, 0x1

    return p1

    .line 257
    :cond_13
    iget-boolean p1, p0, Lcom/genymobile/scrcpy/Controller;->keepPowerModeOff:Z

    if-eqz p1, :cond_1a

    .line 258
    invoke-static {}, Lcom/genymobile/scrcpy/Controller;->schedulePowerModeOff()V

    .line 260
    :cond_1a
    iget-object p1, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    const/16 v0, 0x1a

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/Device;->pressReleaseKeycode(I)Z

    move-result p1

    return p1
.end method

.method private static schedulePowerModeOff()V
    .registers 5

    .line 236
    sget-object v0, Lcom/genymobile/scrcpy/Controller;->EXECUTOR:Ljava/util/concurrent/ScheduledExecutorService;

    new-instance v1, Lcom/genymobile/scrcpy/Controller$1;

    invoke-direct {v1}, Lcom/genymobile/scrcpy/Controller$1;-><init>()V

    sget-object v2, Ljava/util/concurrent/TimeUnit;->MILLISECONDS:Ljava/util/concurrent/TimeUnit;

    const-wide/16 v3, 0xc8

    invoke-interface {v0, v1, v3, v4, v2}, Ljava/util/concurrent/ScheduledExecutorService;->schedule(Ljava/lang/Runnable;JLjava/util/concurrent/TimeUnit;)Ljava/util/concurrent/ScheduledFuture;

    return-void
.end method

.method private setClipboard(Ljava/lang/String;Z)Z
    .registers 4

    .line 264
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/Device;->setClipboardText(Ljava/lang/String;)Z

    move-result p1

    if-eqz p1, :cond_d

    const-string v0, "Device clipboard set"

    .line 266
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    :cond_d
    if-eqz p2, :cond_24

    .line 270
    sget p2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v0, 0x18

    if-lt p2, v0, :cond_24

    iget-object p2, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {p2}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result p2

    if-eqz p2, :cond_24

    .line 271
    iget-object p2, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    const/16 v0, 0x117

    invoke-virtual {p2, v0}, Lcom/genymobile/scrcpy/Device;->pressReleaseKeycode(I)Z

    :cond_24
    return p1
.end method


# virtual methods
.method public getSender()Lcom/genymobile/scrcpy/DeviceMessageSender;
    .registers 2

    .line 56
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->sender:Lcom/genymobile/scrcpy/DeviceMessageSender;

    return-object v0
.end method

.method public handleEvent(Lcom/genymobile/scrcpy/ControlMessage;)V
    .registers 10

    .line 60
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getType()I

    move-result v0

    packed-switch v0, :pswitch_data_ee

    goto/16 :goto_ec

    .line 120
    :pswitch_9
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->rotateDevice()V

    goto/16 :goto_ec

    .line 110
    :pswitch_e
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_ec

    .line 111
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getAction()I

    move-result p1

    .line 112
    invoke-static {p1}, Lcom/genymobile/scrcpy/Device;->setScreenPowerMode(I)Z

    move-result v0

    if-eqz v0, :cond_ec

    if-nez p1, :cond_24

    const/4 v0, 0x1

    goto :goto_25

    :cond_24
    const/4 v0, 0x0

    .line 114
    :goto_25
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/Controller;->keepPowerModeOff:Z

    .line 115
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Device screen turned "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    if-nez p1, :cond_36

    const-string p1, "off"

    goto :goto_38

    :cond_36
    const-string p1, "on"

    :goto_38
    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    goto/16 :goto_ec

    .line 107
    :pswitch_44
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getText()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPaste()Z

    move-result p1

    invoke-direct {p0, v0, p1}, Lcom/genymobile/scrcpy/Controller;->setClipboard(Ljava/lang/String;Z)Z

    goto/16 :goto_ec

    .line 96
    :pswitch_51
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->getClipboardText()Ljava/lang/String;

    move-result-object p1

    if-eqz p1, :cond_ec

    .line 98
    invoke-static {p1}, Lcom/genymobile/scrcpy/DeviceMessage;->createClipboard(Ljava/lang/String;)Lcom/genymobile/scrcpy/DeviceMessage;

    move-result-object p1

    .line 100
    :try_start_5b
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/Connection;->sendDeviceMessage(Lcom/genymobile/scrcpy/DeviceMessage;)V
    :try_end_60
    .catch Ljava/io/IOException; {:try_start_5b .. :try_end_60} :catch_62

    goto/16 :goto_ec

    :catch_62
    const-string p1, ""

    .line 102
    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    goto/16 :goto_ec

    .line 93
    :pswitch_69
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->collapsePanels()V

    goto/16 :goto_ec

    .line 90
    :pswitch_6e
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->expandSettingsPanel()V

    goto/16 :goto_ec

    .line 87
    :pswitch_73
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->expandNotificationPanel()V

    goto/16 :goto_ec

    .line 82
    :pswitch_78
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_ec

    .line 83
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getAction()I

    move-result p1

    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/Controller;->pressBackOrTurnScreenOn(I)Z

    goto :goto_ec

    .line 77
    :pswitch_88
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_ec

    .line 78
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPosition()Lcom/genymobile/scrcpy/Position;

    move-result-object v0

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getHScroll()I

    move-result v1

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getVScroll()I

    move-result p1

    invoke-direct {p0, v0, v1, p1}, Lcom/genymobile/scrcpy/Controller;->injectScroll(Lcom/genymobile/scrcpy/Position;II)Z

    goto :goto_ec

    .line 72
    :pswitch_a0
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_ec

    .line 73
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getAction()I

    move-result v2

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPointerId()J

    move-result-wide v3

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPosition()Lcom/genymobile/scrcpy/Position;

    move-result-object v5

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPressure()F

    move-result v6

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getButtons()I

    move-result v7

    move-object v1, p0

    invoke-direct/range {v1 .. v7}, Lcom/genymobile/scrcpy/Controller;->injectTouch(IJLcom/genymobile/scrcpy/Position;FI)Z

    goto :goto_ec

    .line 67
    :pswitch_c1
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_ec

    .line 68
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getText()Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/Controller;->injectText(Ljava/lang/String;)I

    goto :goto_ec

    .line 62
    :pswitch_d1
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_ec

    .line 63
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getAction()I

    move-result v0

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getKeycode()I

    move-result v1

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getRepeat()I

    move-result v2

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getMetaState()I

    move-result p1

    invoke-direct {p0, v0, v1, v2, p1}, Lcom/genymobile/scrcpy/Controller;->injectKeycode(IIII)Z

    :cond_ec
    :goto_ec
    return-void

    nop

    :pswitch_data_ee
    .packed-switch 0x0
        :pswitch_d1
        :pswitch_c1
        :pswitch_a0
        :pswitch_88
        :pswitch_78
        :pswitch_73
        :pswitch_6e
        :pswitch_69
        :pswitch_51
        :pswitch_44
        :pswitch_e
        :pswitch_9
    .end packed-switch
.end method

.method public turnScreenOn()V
    .registers 3

    .line 278
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    const/16 v1, 0x1a

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/Device;->pressReleaseKeycode(I)Z

    return-void
.end method
