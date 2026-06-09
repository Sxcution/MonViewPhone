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

    .line 16
    invoke-static {}, Ljava/util/concurrent/Executors;->newSingleThreadScheduledExecutor()Ljava/util/concurrent/ScheduledExecutorService;

    move-result-object v0

    sput-object v0, Lcom/genymobile/scrcpy/Controller;->EXECUTOR:Ljava/util/concurrent/ScheduledExecutorService;

    return-void
.end method

.method public constructor <init>(Lcom/genymobile/scrcpy/Device;Lcom/genymobile/scrcpy/Connection;)V
    .registers 5

    .line 27
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 22
    const/4 v0, -0x1

    invoke-static {v0}, Landroid/view/KeyCharacterMap;->load(I)Landroid/view/KeyCharacterMap;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/Controller;->charMap:Landroid/view/KeyCharacterMap;

    .line 23
    new-instance v0, Lcom/genymobile/scrcpy/PointersState;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/PointersState;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/Controller;->pointersState:Lcom/genymobile/scrcpy/PointersState;

    .line 24
    const/16 v0, 0xa

    new-array v1, v0, [Landroid/view/MotionEvent$PointerProperties;

    iput-object v1, p0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    .line 25
    new-array v0, v0, [Landroid/view/MotionEvent$PointerCoords;

    iput-object v0, p0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    .line 28
    iput-object p1, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    .line 29
    iput-object p2, p0, Lcom/genymobile/scrcpy/Controller;->connection:Lcom/genymobile/scrcpy/Connection;

    .line 30
    invoke-direct {p0}, Lcom/genymobile/scrcpy/Controller;->initPointers()V

    .line 31
    new-instance p1, Lcom/genymobile/scrcpy/DeviceMessageSender;

    invoke-direct {p1, p2}, Lcom/genymobile/scrcpy/DeviceMessageSender;-><init>(Lcom/genymobile/scrcpy/Connection;)V

    iput-object p1, p0, Lcom/genymobile/scrcpy/Controller;->sender:Lcom/genymobile/scrcpy/DeviceMessageSender;

    .line 32
    return-void
.end method

.method private initPointers()V
    .registers 5

    .line 35
    const/4 v0, 0x0

    :goto_1
    const/16 v1, 0xa

    if-ge v0, v1, :cond_22

    .line 36
    new-instance v1, Landroid/view/MotionEvent$PointerProperties;

    invoke-direct {v1}, Landroid/view/MotionEvent$PointerProperties;-><init>()V

    .line 37
    const/4 v2, 0x1

    iput v2, v1, Landroid/view/MotionEvent$PointerProperties;->toolType:I

    .line 38
    new-instance v2, Landroid/view/MotionEvent$PointerCoords;

    invoke-direct {v2}, Landroid/view/MotionEvent$PointerCoords;-><init>()V

    .line 39
    const/4 v3, 0x0

    iput v3, v2, Landroid/view/MotionEvent$PointerCoords;->orientation:F

    .line 40
    iput v3, v2, Landroid/view/MotionEvent$PointerCoords;->size:F

    .line 41
    iget-object v3, p0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    aput-object v1, v3, v0

    .line 42
    iget-object v1, p0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    aput-object v2, v1, v0

    .line 35
    add-int/lit8 v0, v0, 0x1

    goto :goto_1

    .line 44
    :cond_22
    return-void
.end method

.method private injectChar(C)Z
    .registers 8

    .line 126
    invoke-static {p1}, Lcom/genymobile/scrcpy/KeyComposition;->decompose(C)Ljava/lang/String;

    move-result-object v0

    .line 127
    iget-object v1, p0, Lcom/genymobile/scrcpy/Controller;->charMap:Landroid/view/KeyCharacterMap;

    const/4 v2, 0x1

    const/4 v3, 0x0

    if-eqz v0, :cond_f

    invoke-virtual {v0}, Ljava/lang/String;->toCharArray()[C

    move-result-object p1

    goto :goto_14

    :cond_f
    new-array v0, v2, [C

    aput-char p1, v0, v3

    move-object p1, v0

    :goto_14
    invoke-virtual {v1, p1}, Landroid/view/KeyCharacterMap;->getEvents([C)[Landroid/view/KeyEvent;

    move-result-object p1

    .line 128
    if-nez p1, :cond_1b

    .line 129
    return v3

    .line 131
    :cond_1b
    array-length v0, p1

    const/4 v1, 0x0

    :goto_1d
    if-ge v1, v0, :cond_2d

    aget-object v4, p1, v1

    .line 132
    iget-object v5, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v5, v4}, Lcom/genymobile/scrcpy/Device;->injectEvent(Landroid/view/InputEvent;)Z

    move-result v4

    if-nez v4, :cond_2a

    .line 133
    return v3

    .line 131
    :cond_2a
    add-int/lit8 v1, v1, 0x1

    goto :goto_1d

    .line 136
    :cond_2d
    return v2
.end method

.method private injectKeycode(IIII)Z
    .registers 6

    .line 119
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Controller;->keepPowerModeOff:Z

    if-eqz v0, :cond_12

    const/4 v0, 0x1

    if-ne p1, v0, :cond_12

    const/16 v0, 0x1a

    if-eq p2, v0, :cond_f

    const/16 v0, 0xe0

    if-ne p2, v0, :cond_12

    .line 120
    :cond_f
    invoke-static {}, Lcom/genymobile/scrcpy/Controller;->schedulePowerModeOff()V

    .line 122
    :cond_12
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0, p1, p2, p3, p4}, Lcom/genymobile/scrcpy/Device;->injectKeyEvent(IIII)Z

    move-result p1

    return p1
.end method

.method private injectScroll(Lcom/genymobile/scrcpy/Position;II)Z
    .registers 22

    .line 184
    move-object/from16 v0, p0

    invoke-static {}, Landroid/os/SystemClock;->uptimeMillis()J

    move-result-wide v3

    .line 185
    iget-object v1, v0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    move-object/from16 v2, p1

    invoke-virtual {v1, v2}, Lcom/genymobile/scrcpy/Device;->getPhysicalPoint(Lcom/genymobile/scrcpy/Position;)Lcom/genymobile/scrcpy/Point;

    move-result-object v1

    .line 186
    const/4 v2, 0x0

    if-nez v1, :cond_12

    .line 187
    return v2

    .line 189
    :cond_12
    iget-object v5, v0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    aget-object v5, v5, v2

    iput v2, v5, Landroid/view/MotionEvent$PointerProperties;->id:I

    .line 190
    iget-object v5, v0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    aget-object v2, v5, v2

    .line 191
    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Point;->getX()I

    move-result v5

    int-to-float v5, v5

    iput v5, v2, Landroid/view/MotionEvent$PointerCoords;->x:F

    .line 192
    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Point;->getY()I

    move-result v1

    int-to-float v1, v1

    iput v1, v2, Landroid/view/MotionEvent$PointerCoords;->y:F

    .line 193
    const/16 v1, 0xa

    move/from16 v5, p2

    int-to-float v5, v5

    invoke-virtual {v2, v1, v5}, Landroid/view/MotionEvent$PointerCoords;->setAxisValue(IF)V

    .line 194
    const/16 v1, 0x9

    move/from16 v5, p3

    int-to-float v5, v5

    invoke-virtual {v2, v1, v5}, Landroid/view/MotionEvent$PointerCoords;->setAxisValue(IF)V

    .line 195
    iget-object v1, v0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    move-object v5, v1

    iget-wide v1, v0, Lcom/genymobile/scrcpy/Controller;->lastTouchDown:J

    iget-object v7, v0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    iget-object v8, v0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    const/16 v15, 0x2002

    const/16 v16, 0x0

    move-object v6, v5

    const/16 v5, 0x8

    move-object v9, v6

    const/4 v6, 0x1

    move-object v10, v9

    const/4 v9, 0x0

    move-object v11, v10

    const/4 v10, 0x0

    move-object v12, v11

    const/high16 v11, 0x3f800000    # 1.0f

    move-object v13, v12

    const/high16 v12, 0x3f800000    # 1.0f

    move-object v14, v13

    const/4 v13, 0x0

    move-object/from16 v17, v14

    const/4 v14, 0x0

    move-object/from16 v0, v17

    invoke-static/range {v1 .. v16}, Landroid/view/MotionEvent;->obtain(JJII[Landroid/view/MotionEvent$PointerProperties;[Landroid/view/MotionEvent$PointerCoords;IIFFIIII)Landroid/view/MotionEvent;

    move-result-object v1

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/Device;->injectEvent(Landroid/view/InputEvent;)Z

    move-result v0

    return v0
.end method

.method private injectText(Ljava/lang/String;)I
    .registers 9

    .line 140
    nop

    .line 141
    invoke-virtual {p1}, Ljava/lang/String;->toCharArray()[C

    move-result-object p1

    array-length v0, p1

    const/4 v1, 0x0

    const/4 v2, 0x0

    const/4 v3, 0x0

    :goto_9
    if-ge v2, v0, :cond_3e

    aget-char v4, p1, v2

    .line 142
    invoke-direct {p0, v4}, Lcom/genymobile/scrcpy/Controller;->injectChar(C)Z

    move-result v5

    if-eqz v5, :cond_16

    .line 143
    add-int/lit8 v3, v3, 0x1

    goto :goto_3b

    .line 145
    :cond_16
    new-instance v5, Ljava/lang/StringBuilder;

    invoke-direct {v5}, Ljava/lang/StringBuilder;-><init>()V

    const-string v6, "Could not inject char u+"

    invoke-virtual {v5, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v5

    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    const/4 v6, 0x1

    new-array v6, v6, [Ljava/lang/Object;

    aput-object v4, v6, v1

    const-string v4, "%04x"

    invoke-static {v4, v6}, Ljava/lang/String;->format(Ljava/lang/String;[Ljava/lang/Object;)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v5, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v4

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    invoke-static {v4}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 141
    :goto_3b
    add-int/lit8 v2, v2, 0x1

    goto :goto_9

    .line 148
    :cond_3e
    return v3
.end method

.method private injectTouch(IJLcom/genymobile/scrcpy/Position;FI)Z
    .registers 25

    .line 152
    move-object/from16 v0, p0

    move/from16 v1, p1

    .line 153
    invoke-static {}, Landroid/os/SystemClock;->uptimeMillis()J

    move-result-wide v3

    .line 154
    iget-object v2, v0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    move-object/from16 v5, p4

    invoke-virtual {v2, v5}, Lcom/genymobile/scrcpy/Device;->getPhysicalPoint(Lcom/genymobile/scrcpy/Position;)Lcom/genymobile/scrcpy/Point;

    move-result-object v2

    .line 155
    const/4 v5, 0x0

    if-nez v2, :cond_19

    .line 156
    const-string v1, "Ignore touch event, it was generated for a different device size"

    invoke-static {v1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 157
    return v5

    .line 159
    :cond_19
    iget-object v6, v0, Lcom/genymobile/scrcpy/Controller;->pointersState:Lcom/genymobile/scrcpy/PointersState;

    move-wide/from16 v7, p2

    invoke-virtual {v6, v7, v8}, Lcom/genymobile/scrcpy/PointersState;->getPointerIndex(J)I

    move-result v6

    .line 160
    const/4 v7, -0x1

    if-ne v6, v7, :cond_2a

    .line 161
    const-string v1, "Too many pointers for touch event"

    invoke-static {v1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 162
    return v5

    .line 164
    :cond_2a
    iget-object v7, v0, Lcom/genymobile/scrcpy/Controller;->pointersState:Lcom/genymobile/scrcpy/PointersState;

    invoke-virtual {v7, v6}, Lcom/genymobile/scrcpy/PointersState;->get(I)Lcom/genymobile/scrcpy/Pointer;

    move-result-object v7

    .line 165
    invoke-virtual {v7, v2}, Lcom/genymobile/scrcpy/Pointer;->setPoint(Lcom/genymobile/scrcpy/Point;)V

    .line 166
    move/from16 v2, p5

    invoke-virtual {v7, v2}, Lcom/genymobile/scrcpy/Pointer;->setPressure(F)V

    .line 167
    const/4 v2, 0x1

    if-ne v1, v2, :cond_3d

    const/4 v8, 0x1

    goto :goto_3e

    :cond_3d
    const/4 v8, 0x0

    :goto_3e
    invoke-virtual {v7, v8}, Lcom/genymobile/scrcpy/Pointer;->setUp(Z)V

    .line 168
    iget-object v7, v0, Lcom/genymobile/scrcpy/Controller;->pointersState:Lcom/genymobile/scrcpy/PointersState;

    iget-object v8, v0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    iget-object v9, v0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    invoke-virtual {v7, v8, v9}, Lcom/genymobile/scrcpy/PointersState;->update([Landroid/view/MotionEvent$PointerProperties;[Landroid/view/MotionEvent$PointerCoords;)I

    move-result v7

    .line 169
    if-ne v7, v2, :cond_52

    .line 170
    if-nez v1, :cond_5f

    .line 171
    iput-wide v3, v0, Lcom/genymobile/scrcpy/Controller;->lastTouchDown:J

    goto :goto_5f

    .line 173
    :cond_52
    if-ne v1, v2, :cond_59

    .line 174
    shl-int/lit8 v1, v6, 0x8

    or-int/lit8 v1, v1, 0x6

    goto :goto_5f

    .line 175
    :cond_59
    if-nez v1, :cond_5f

    .line 176
    shl-int/lit8 v1, v6, 0x8

    or-int/lit8 v1, v1, 0x5

    .line 178
    :cond_5f
    :goto_5f
    nop

    .line 179
    and-int/lit8 v2, p6, -0x2

    const/16 v6, 0x2002

    if-eqz v2, :cond_69

    const/16 v15, 0x2002

    goto :goto_6d

    :cond_69
    const/16 v2, 0x1002

    const/16 v15, 0x1002

    .line 180
    :goto_6d
    iget-object v2, v0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    move v5, v1

    move-object v8, v2

    const/4 v9, 0x0

    iget-wide v1, v0, Lcom/genymobile/scrcpy/Controller;->lastTouchDown:J

    move v10, v7

    iget-object v7, v0, Lcom/genymobile/scrcpy/Controller;->pointerProperties:[Landroid/view/MotionEvent$PointerProperties;

    move-object v11, v8

    iget-object v8, v0, Lcom/genymobile/scrcpy/Controller;->pointerCoords:[Landroid/view/MotionEvent$PointerCoords;

    if-eq v15, v6, :cond_7d

    goto :goto_7f

    :cond_7d
    move/from16 v9, p6

    :goto_7f
    const/4 v14, 0x0

    const/16 v16, 0x0

    move v6, v10

    move v10, v9

    const/4 v9, 0x0

    move-object v12, v11

    const/high16 v11, 0x3f800000    # 1.0f

    move-object v13, v12

    const/high16 v12, 0x3f800000    # 1.0f

    move-object/from16 v17, v13

    const/4 v13, 0x0

    move-object/from16 v0, v17

    invoke-static/range {v1 .. v16}, Landroid/view/MotionEvent;->obtain(JJII[Landroid/view/MotionEvent$PointerProperties;[Landroid/view/MotionEvent$PointerCoords;IIFFIIII)Landroid/view/MotionEvent;

    move-result-object v1

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/Device;->injectEvent(Landroid/view/InputEvent;)Z

    move-result v0

    return v0
.end method

.method private pressBackOrTurnScreenOn(I)Z
    .registers 5

    .line 209
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->isScreenOn()Z

    move-result v0

    if-eqz v0, :cond_f

    .line 210
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    const/4 v1, 0x4

    const/4 v2, 0x0

    invoke-virtual {v0, p1, v1, v2, v2}, Lcom/genymobile/scrcpy/Device;->injectKeyEvent(IIII)Z

    move-result p1

    return p1

    .line 212
    :cond_f
    if-eqz p1, :cond_13

    .line 213
    const/4 p1, 0x1

    return p1

    .line 215
    :cond_13
    iget-boolean p1, p0, Lcom/genymobile/scrcpy/Controller;->keepPowerModeOff:Z

    if-eqz p1, :cond_1a

    .line 216
    invoke-static {}, Lcom/genymobile/scrcpy/Controller;->schedulePowerModeOff()V

    .line 218
    :cond_1a
    iget-object p1, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    const/16 v0, 0x1a

    invoke-virtual {p1, v0}, Lcom/genymobile/scrcpy/Device;->pressReleaseKeycode(I)Z

    move-result p1

    return p1
.end method

.method private static schedulePowerModeOff()V
    .registers 5

    .line 199
    sget-object v0, Lcom/genymobile/scrcpy/Controller;->EXECUTOR:Ljava/util/concurrent/ScheduledExecutorService;

    new-instance v1, Lcom/genymobile/scrcpy/Controller$1;

    invoke-direct {v1}, Lcom/genymobile/scrcpy/Controller$1;-><init>()V

    const-wide/16 v2, 0xc8

    sget-object v4, Ljava/util/concurrent/TimeUnit;->MILLISECONDS:Ljava/util/concurrent/TimeUnit;

    invoke-interface {v0, v1, v2, v3, v4}, Ljava/util/concurrent/ScheduledExecutorService;->schedule(Ljava/lang/Runnable;JLjava/util/concurrent/TimeUnit;)Ljava/util/concurrent/ScheduledFuture;

    .line 206
    return-void
.end method

.method private setClipboard(Ljava/lang/String;Z)Z
    .registers 4

    .line 222
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/Device;->setClipboardText(Ljava/lang/String;)Z

    move-result p1

    .line 223
    if-eqz p1, :cond_d

    .line 224
    const-string v0, "Device clipboard set"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 226
    :cond_d
    if-eqz p2, :cond_24

    sget p2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v0, 0x18

    if-lt p2, v0, :cond_24

    iget-object p2, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {p2}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result p2

    if-eqz p2, :cond_24

    .line 227
    iget-object p2, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    const/16 v0, 0x117

    invoke-virtual {p2, v0}, Lcom/genymobile/scrcpy/Device;->pressReleaseKeycode(I)Z

    .line 229
    :cond_24
    return p1
.end method


# virtual methods
.method public getSender()Lcom/genymobile/scrcpy/DeviceMessageSender;
    .registers 2

    .line 47
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->sender:Lcom/genymobile/scrcpy/DeviceMessageSender;

    return-object v0
.end method

.method public handleEvent(Lcom/genymobile/scrcpy/ControlMessage;)V
    .registers 10

    .line 51
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getType()I

    move-result v0

    packed-switch v0, :pswitch_data_108

    move-object v1, p0

    goto/16 :goto_106

    .line 113
    :pswitch_a
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->rotateDevice()V

    move-object v1, p0

    goto/16 :goto_106

    .line 101
    :pswitch_10
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_47

    .line 102
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getAction()I

    move-result p1

    .line 103
    invoke-static {p1}, Lcom/genymobile/scrcpy/Device;->setScreenPowerMode(I)Z

    move-result v0

    if-eqz v0, :cond_44

    .line 104
    if-nez p1, :cond_26

    const/4 v0, 0x1

    goto :goto_27

    :cond_26
    const/4 v0, 0x0

    :goto_27
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/Controller;->keepPowerModeOff:Z

    .line 105
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    .line 106
    const-string v1, "Device screen turned "

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 107
    if-nez p1, :cond_38

    const-string p1, "off"

    goto :goto_3a

    :cond_38
    const-string p1, "on"

    :goto_3a
    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    .line 108
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 110
    :cond_44
    move-object v1, p0

    goto/16 :goto_106

    .line 101
    :cond_47
    move-object v1, p0

    goto/16 :goto_106

    .line 98
    :pswitch_4a
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getText()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPaste()Z

    move-result p1

    invoke-direct {p0, v0, p1}, Lcom/genymobile/scrcpy/Controller;->setClipboard(Ljava/lang/String;Z)Z

    .line 99
    move-object v1, p0

    goto/16 :goto_106

    .line 87
    :pswitch_58
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->getClipboardText()Ljava/lang/String;

    move-result-object p1

    .line 88
    if-eqz p1, :cond_71

    .line 90
    :try_start_5e
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->connection:Lcom/genymobile/scrcpy/Connection;

    invoke-static {p1}, Lcom/genymobile/scrcpy/DeviceMessage;->createClipboard(Ljava/lang/String;)Lcom/genymobile/scrcpy/DeviceMessage;

    move-result-object p1

    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/Connection;->sendDeviceMessage(Lcom/genymobile/scrcpy/DeviceMessage;)V
    :try_end_67
    .catch Ljava/io/IOException; {:try_start_5e .. :try_end_67} :catch_6a

    .line 94
    move-object v1, p0

    goto/16 :goto_106

    .line 91
    :catch_6a
    move-exception v0

    .line 92
    const-string p1, ""

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 93
    return-void

    .line 88
    :cond_71
    move-object v1, p0

    goto/16 :goto_106

    .line 84
    :pswitch_74
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->collapsePanels()V

    .line 85
    move-object v1, p0

    goto/16 :goto_106

    .line 81
    :pswitch_7a
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->expandSettingsPanel()V

    .line 82
    move-object v1, p0

    goto/16 :goto_106

    .line 78
    :pswitch_80
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->expandNotificationPanel()V

    .line 79
    move-object v1, p0

    goto/16 :goto_106

    .line 73
    :pswitch_86
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_98

    .line 74
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getAction()I

    move-result p1

    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/Controller;->pressBackOrTurnScreenOn(I)Z

    move-object v1, p0

    goto/16 :goto_106

    .line 73
    :cond_98
    move-object v1, p0

    goto/16 :goto_106

    .line 68
    :pswitch_9b
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_b4

    .line 69
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getPosition()Lcom/genymobile/scrcpy/Position;

    move-result-object v0

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getHScroll()I

    move-result v1

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getVScroll()I

    move-result p1

    invoke-direct {p0, v0, v1, p1}, Lcom/genymobile/scrcpy/Controller;->injectScroll(Lcom/genymobile/scrcpy/Position;II)Z

    move-object v1, p0

    goto :goto_106

    .line 68
    :cond_b4
    move-object v1, p0

    goto :goto_106

    .line 63
    :pswitch_b6
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_d7

    .line 64
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

    goto :goto_106

    .line 63
    :cond_d7
    move-object v1, p0

    goto :goto_106

    .line 58
    :pswitch_d9
    move-object v1, p0

    iget-object v0, v1, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_106

    .line 59
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getText()Ljava/lang/String;

    move-result-object p1

    invoke-direct {p0, p1}, Lcom/genymobile/scrcpy/Controller;->injectText(Ljava/lang/String;)I

    goto :goto_106

    .line 53
    :pswitch_ea
    move-object v1, p0

    iget-object v0, v1, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents()Z

    move-result v0

    if-eqz v0, :cond_106

    .line 54
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getAction()I

    move-result v0

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getKeycode()I

    move-result v2

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getRepeat()I

    move-result v3

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/ControlMessage;->getMetaState()I

    move-result p1

    invoke-direct {p0, v0, v2, v3, p1}, Lcom/genymobile/scrcpy/Controller;->injectKeycode(IIII)Z

    .line 116
    :cond_106
    :goto_106
    return-void

    nop

    :pswitch_data_108
    .packed-switch 0x0
        :pswitch_ea
        :pswitch_d9
        :pswitch_b6
        :pswitch_9b
        :pswitch_86
        :pswitch_80
        :pswitch_7a
        :pswitch_74
        :pswitch_58
        :pswitch_4a
        :pswitch_10
        :pswitch_a
    .end packed-switch
.end method

.method public turnScreenOn()V
    .registers 3

    .line 233
    iget-object v0, p0, Lcom/genymobile/scrcpy/Controller;->device:Lcom/genymobile/scrcpy/Device;

    const/16 v1, 0x1a

    invoke-virtual {v0, v1}, Lcom/genymobile/scrcpy/Device;->pressReleaseKeycode(I)Z

    .line 234
    return-void
.end method
