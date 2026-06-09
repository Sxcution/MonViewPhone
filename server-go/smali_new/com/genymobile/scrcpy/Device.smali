.class public final Lcom/genymobile/scrcpy/Device;
.super Ljava/lang/Object;
.source "Device.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/genymobile/scrcpy/Device$ClipboardListener;,
        Lcom/genymobile/scrcpy/Device$RotationListener;
    }
.end annotation


# static fields
.field public static final LOCK_VIDEO_ORIENTATION_INITIAL:I = -0x2

.field public static final LOCK_VIDEO_ORIENTATION_UNLOCKED:I = -0x1

.field public static final POWER_MODE_NORMAL:I = 0x2

.field public static final POWER_MODE_OFF:I

.field private static final SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;


# instance fields
.field private clipChangedListener:Landroid/content/IOnPrimaryClipChangedListener;

.field private clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;

.field private final displayId:I

.field private final isSettingClipboard:Ljava/util/concurrent/atomic/AtomicBoolean;

.field private final layerStack:I

.field private rotationListener:Lcom/genymobile/scrcpy/Device$RotationListener;

.field private rotationWatcher:Landroid/view/IRotationWatcher;

.field private screenInfo:Lcom/genymobile/scrcpy/ScreenInfo;

.field private final supportsInputEvents:Z


# direct methods
.method static constructor <clinit>()V
    .registers 1

    .line 25
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;-><init>()V

    sput-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    return-void
.end method

.method public constructor <init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V
    .registers 6

    .line 44
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 29
    new-instance v0, Ljava/util/concurrent/atomic/AtomicBoolean;

    invoke-direct {v0}, Ljava/util/concurrent/atomic/AtomicBoolean;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/Device;->isSettingClipboard:Ljava/util/concurrent/atomic/AtomicBoolean;

    .line 45
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/VideoSettings;->getDisplayId()I

    move-result v0

    .line 46
    iput v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    .line 47
    invoke-static {v0}, Lcom/genymobile/scrcpy/Device;->getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;

    move-result-object v0

    .line 48
    if-eqz v0, :cond_79

    .line 51
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/DisplayInfo;->getFlags()I

    move-result v1

    .line 52
    invoke-static {v0, p2}, Lcom/genymobile/scrcpy/ScreenInfo;->computeScreenInfo(Lcom/genymobile/scrcpy/DisplayInfo;Lcom/genymobile/scrcpy/VideoSettings;)Lcom/genymobile/scrcpy/ScreenInfo;

    move-result-object v2

    iput-object v2, p0, Lcom/genymobile/scrcpy/Device;->screenInfo:Lcom/genymobile/scrcpy/ScreenInfo;

    .line 53
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/DisplayInfo;->getLayerStack()I

    move-result v0

    iput v0, p0, Lcom/genymobile/scrcpy/Device;->layerStack:I

    .line 54
    new-instance v0, Lcom/genymobile/scrcpy/Device$1;

    invoke-direct {v0, p0, p2}, Lcom/genymobile/scrcpy/Device$1;-><init>(Lcom/genymobile/scrcpy/Device;Lcom/genymobile/scrcpy/VideoSettings;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/Device;->rotationWatcher:Landroid/view/IRotationWatcher;

    .line 65
    sget-object p2, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {p2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getWindowManager()Lcom/genymobile/scrcpy/wrappers/WindowManager;

    move-result-object p2

    iget-object v0, p0, Lcom/genymobile/scrcpy/Device;->rotationWatcher:Landroid/view/IRotationWatcher;

    iget v2, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-virtual {p2, v0, v2}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->registerRotationWatcher(Landroid/view/IRotationWatcher;I)V

    .line 66
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getControl()Z

    move-result p1

    if-eqz p1, :cond_58

    .line 67
    sget-object p1, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getClipboardManager()Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    move-result-object p1

    .line 68
    new-instance p2, Lcom/genymobile/scrcpy/Device$2;

    invoke-direct {p2, p0}, Lcom/genymobile/scrcpy/Device$2;-><init>(Lcom/genymobile/scrcpy/Device;)V

    .line 82
    iput-object p2, p0, Lcom/genymobile/scrcpy/Device;->clipChangedListener:Landroid/content/IOnPrimaryClipChangedListener;

    .line 83
    if-eqz p1, :cond_53

    .line 84
    invoke-virtual {p1, p2}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->addPrimaryClipChangedListener(Landroid/content/IOnPrimaryClipChangedListener;)Z

    goto :goto_58

    .line 86
    :cond_53
    const-string p1, "No clipboard manager, copy-paste between device and computer will not work"

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 89
    :cond_58
    :goto_58
    nop

    .line 90
    const/4 p1, 0x1

    and-int/lit8 p2, v1, 0x1

    if-nez p2, :cond_63

    .line 91
    const-string p2, "Display doesn\'t have FLAG_SUPPORTS_PROTECTED_BUFFERS flag, mirroring can be restricted"

    invoke-static {p2}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 93
    :cond_63
    iget p2, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    if-eqz p2, :cond_6e

    sget p2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v0, 0x1d

    if-ge p2, v0, :cond_6e

    .line 94
    const/4 p1, 0x0

    .line 96
    :cond_6e
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Device;->supportsInputEvents:Z

    .line 97
    if-eqz p1, :cond_73

    .line 98
    return-void

    .line 100
    :cond_73
    const-string p1, "Input events are not supported for secondary displays before Android 10"

    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 101
    return-void

    .line 49
    :cond_79
    new-instance p1, Lcom/genymobile/scrcpy/InvalidDisplayIdException;

    iget p2, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-static {}, Lcom/genymobile/scrcpy/Device;->getDisplayIds()[I

    move-result-object v0

    invoke-direct {p1, p2, v0}, Lcom/genymobile/scrcpy/InvalidDisplayIdException;-><init>(I[I)V

    throw p1
.end method

.method static synthetic access$000(Lcom/genymobile/scrcpy/Device;)Lcom/genymobile/scrcpy/Device$RotationListener;
    .registers 1

    .line 20
    iget-object p0, p0, Lcom/genymobile/scrcpy/Device;->rotationListener:Lcom/genymobile/scrcpy/Device$RotationListener;

    return-object p0
.end method

.method static synthetic access$100(Lcom/genymobile/scrcpy/Device;)Ljava/util/concurrent/atomic/AtomicBoolean;
    .registers 1

    .line 20
    iget-object p0, p0, Lcom/genymobile/scrcpy/Device;->isSettingClipboard:Ljava/util/concurrent/atomic/AtomicBoolean;

    return-object p0
.end method

.method static synthetic access$200(Lcom/genymobile/scrcpy/Device;)Lcom/genymobile/scrcpy/Device$ClipboardListener;
    .registers 1

    .line 20
    iget-object p0, p0, Lcom/genymobile/scrcpy/Device;->clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;

    return-object p0
.end method

.method public static collapsePanels()V
    .registers 1

    .line 199
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getStatusBarManager()Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->collapsePanels()V

    .line 200
    return-void
.end method

.method public static createSettingsProvider()Lcom/genymobile/scrcpy/wrappers/ContentProvider;
    .registers 1

    .line 270
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getActivityManager()Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->createSettingsProvider()Lcom/genymobile/scrcpy/wrappers/ContentProvider;

    move-result-object v0

    return-object v0
.end method

.method public static expandNotificationPanel()V
    .registers 1

    .line 191
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getStatusBarManager()Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandNotificationsPanel()V

    .line 192
    return-void
.end method

.method public static expandSettingsPanel()V
    .registers 1

    .line 195
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getStatusBarManager()Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanel()V

    .line 196
    return-void
.end method

.method public static getClipboardText()Ljava/lang/String;
    .registers 1

    .line 204
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getClipboardManager()Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    move-result-object v0

    .line 205
    if-eqz v0, :cond_14

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->getText()Ljava/lang/CharSequence;

    move-result-object v0

    if-nez v0, :cond_f

    goto :goto_14

    .line 208
    :cond_f
    invoke-interface {v0}, Ljava/lang/CharSequence;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0

    .line 206
    :cond_14
    :goto_14
    const/4 v0, 0x0

    return-object v0
.end method

.method public static getDeviceName()Ljava/lang/String;
    .registers 1

    .line 136
    sget-object v0, Landroid/os/Build;->MODEL:Ljava/lang/String;

    return-object v0
.end method

.method public static getDisplayIds()[I
    .registers 1

    .line 274
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getDisplayManager()Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->getDisplayIds()[I

    move-result-object v0

    return-object v0
.end method

.method public static getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;
    .registers 2

    .line 278
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getDisplayManager()Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    move-result-object v0

    invoke-virtual {v0, p0}, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;

    move-result-object p0

    return-object p0
.end method

.method public static injectEvent(Landroid/view/InputEvent;I)Z
    .registers 3

    .line 148
    invoke-static {p1}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents(I)Z

    move-result v0

    if-eqz v0, :cond_1c

    .line 151
    const/4 v0, 0x0

    if-eqz p1, :cond_11

    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/wrappers/InputManager;->setDisplayId(Landroid/view/InputEvent;I)Z

    move-result p1

    if-eqz p1, :cond_10

    goto :goto_11

    .line 154
    :cond_10
    return v0

    .line 152
    :cond_11
    :goto_11
    sget-object p1, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getInputManager()Lcom/genymobile/scrcpy/wrappers/InputManager;

    move-result-object p1

    invoke-virtual {p1, p0, v0}, Lcom/genymobile/scrcpy/wrappers/InputManager;->injectInputEvent(Landroid/view/InputEvent;I)Z

    move-result p0

    return p0

    .line 149
    :cond_1c
    new-instance p0, Ljava/lang/AssertionError;

    const-string p1, "Could not inject input event if !supportsInputEvents()"

    invoke-direct {p0, p1}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw p0
.end method

.method public static injectKeyEvent(IIIII)Z
    .registers 18

    .line 162
    invoke-static {}, Landroid/os/SystemClock;->uptimeMillis()J

    move-result-wide v1

    .line 163
    new-instance v0, Landroid/view/KeyEvent;

    const/4 v11, 0x0

    const/16 v12, 0x101

    const/4 v9, -0x1

    const/4 v10, 0x0

    move-wide v3, v1

    move v5, p0

    move v6, p1

    move v7, p2

    move/from16 v8, p3

    invoke-direct/range {v0 .. v12}, Landroid/view/KeyEvent;-><init>(JJIIIIIIII)V

    move/from16 p0, p4

    invoke-static {v0, p0}, Lcom/genymobile/scrcpy/Device;->injectEvent(Landroid/view/InputEvent;I)Z

    move-result p0

    return p0
.end method

.method public static isScreenOn()Z
    .registers 1

    .line 179
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getPowerManager()Lcom/genymobile/scrcpy/wrappers/PowerManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/PowerManager;->isScreenOn()Z

    move-result v0

    return v0
.end method

.method public static powerOffScreen(I)Z
    .registers 2

    .line 252
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->isScreenOn()Z

    move-result v0

    if-eqz v0, :cond_d

    .line 253
    const/16 v0, 0x1a

    invoke-static {v0, p0}, Lcom/genymobile/scrcpy/Device;->pressReleaseKeycode(II)Z

    move-result p0

    return p0

    .line 255
    :cond_d
    const/4 p0, 0x1

    return p0
.end method

.method public static pressReleaseKeycode(II)Z
    .registers 4

    .line 171
    const/4 v0, 0x0

    invoke-static {v0, p0, v0, v0, p1}, Lcom/genymobile/scrcpy/Device;->injectKeyEvent(IIIII)Z

    move-result v1

    if-eqz v1, :cond_f

    const/4 v1, 0x1

    invoke-static {v1, p0, v0, v0, p1}, Lcom/genymobile/scrcpy/Device;->injectKeyEvent(IIIII)Z

    move-result p0

    if-eqz p0, :cond_f

    const/4 v0, 0x1

    :cond_f
    return v0
.end method

.method public static rotateDevice()V
    .registers 5

    .line 259
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getWindowManager()Lcom/genymobile/scrcpy/wrappers/WindowManager;

    move-result-object v0

    .line 260
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->isRotationFrozen()Z

    move-result v1

    .line 261
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRotation()I

    move-result v2

    and-int/lit8 v2, v2, 0x1

    xor-int/lit8 v2, v2, 0x1

    .line 262
    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "Device rotation requested: "

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    if-nez v2, :cond_22

    const-string v4, "portrait"

    goto :goto_24

    :cond_22
    const-string v4, "landscape"

    :goto_24
    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-static {v3}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 263
    invoke-virtual {v0, v2}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->freezeRotation(I)V

    .line 264
    if-nez v1, :cond_37

    .line 265
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->thawRotation()V

    .line 267
    :cond_37
    return-void
.end method

.method public static setScreenPowerMode(I)Z
    .registers 2

    .line 243
    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->getBuiltInDisplay()Landroid/os/IBinder;

    move-result-object v0

    .line 244
    if-nez v0, :cond_d

    .line 245
    const-string p0, "Could not get built-in display"

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    .line 246
    const/4 p0, 0x0

    return p0

    .line 248
    :cond_d
    invoke-static {v0, p0}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->setDisplayPowerMode(Landroid/os/IBinder;I)Z

    move-result p0

    return p0
.end method

.method public static supportsInputEvents(I)Z
    .registers 2

    .line 140
    if-eqz p0, :cond_b

    sget p0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v0, 0x1d

    if-lt p0, v0, :cond_9

    goto :goto_b

    :cond_9
    const/4 p0, 0x0

    goto :goto_c

    :cond_b
    :goto_b
    const/4 p0, 0x1

    :goto_c
    return p0
.end method


# virtual methods
.method public applyNewVideoSetting(Lcom/genymobile/scrcpy/VideoSettings;)V
    .registers 3

    .line 116
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-static {v0}, Lcom/genymobile/scrcpy/Device;->getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;

    move-result-object v0

    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/ScreenInfo;->computeScreenInfo(Lcom/genymobile/scrcpy/DisplayInfo;Lcom/genymobile/scrcpy/VideoSettings;)Lcom/genymobile/scrcpy/ScreenInfo;

    move-result-object p1

    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/Device;->setScreenInfo(Lcom/genymobile/scrcpy/ScreenInfo;)V

    .line 117
    return-void
.end method

.method public getDisplayId()I
    .registers 2

    .line 104
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    return v0
.end method

.method public getLayerStack()I
    .registers 2

    .line 112
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->layerStack:I

    return v0
.end method

.method public getPhysicalPoint(Lcom/genymobile/scrcpy/Position;)Lcom/genymobile/scrcpy/Point;
    .registers 8

    .line 124
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/Device;->getScreenInfo()Lcom/genymobile/scrcpy/ScreenInfo;

    move-result-object v0

    .line 125
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->getUnlockedVideoSize()Lcom/genymobile/scrcpy/Size;

    move-result-object v1

    .line 126
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->getReverseVideoRotation()I

    move-result v2

    invoke-virtual {p1, v2}, Lcom/genymobile/scrcpy/Position;->rotate(I)Lcom/genymobile/scrcpy/Position;

    move-result-object p1

    .line 127
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Position;->getScreenSize()Lcom/genymobile/scrcpy/Size;

    move-result-object v2

    invoke-virtual {v1, v2}, Lcom/genymobile/scrcpy/Size;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-nez v2, :cond_1c

    .line 128
    const/4 p1, 0x0

    return-object p1

    .line 130
    :cond_1c
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->getContentRect()Landroid/graphics/Rect;

    move-result-object v0

    .line 131
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Position;->getPoint()Lcom/genymobile/scrcpy/Point;

    move-result-object p1

    .line 132
    new-instance v2, Lcom/genymobile/scrcpy/Point;

    iget v3, v0, Landroid/graphics/Rect;->left:I

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Point;->getX()I

    move-result v4

    invoke-virtual {v0}, Landroid/graphics/Rect;->width()I

    move-result v5

    mul-int v4, v4, v5

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v5

    div-int/2addr v4, v5

    add-int/2addr v3, v4

    iget v4, v0, Landroid/graphics/Rect;->top:I

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Point;->getY()I

    move-result p1

    invoke-virtual {v0}, Landroid/graphics/Rect;->height()I

    move-result v0

    mul-int p1, p1, v0

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v0

    div-int/2addr p1, v0

    add-int/2addr v4, p1

    invoke-direct {v2, v3, v4}, Lcom/genymobile/scrcpy/Point;-><init>(II)V

    return-object v2
.end method

.method public declared-synchronized getScreenInfo()Lcom/genymobile/scrcpy/ScreenInfo;
    .registers 2

    monitor-enter p0

    .line 108
    :try_start_1
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device;->screenInfo:Lcom/genymobile/scrcpy/ScreenInfo;
    :try_end_3
    .catchall {:try_start_1 .. :try_end_3} :catchall_5

    monitor-exit p0

    return-object v0

    .line 108
    :catchall_5
    move-exception v0

    :try_start_6
    monitor-exit p0
    :try_end_7
    .catchall {:try_start_6 .. :try_end_7} :catchall_5

    throw v0
.end method

.method public injectEvent(Landroid/view/InputEvent;)Z
    .registers 3

    .line 158
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/Device;->injectEvent(Landroid/view/InputEvent;I)Z

    move-result p1

    return p1
.end method

.method public injectKeyEvent(IIII)Z
    .registers 6

    .line 167
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-static {p1, p2, p3, p4, v0}, Lcom/genymobile/scrcpy/Device;->injectKeyEvent(IIIII)Z

    move-result p1

    return p1
.end method

.method public pressReleaseKeycode(I)Z
    .registers 3

    .line 175
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/Device;->pressReleaseKeycode(II)Z

    move-result p1

    return p1
.end method

.method public release()V
    .registers 4

    .line 227
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device;->clipChangedListener:Landroid/content/IOnPrimaryClipChangedListener;

    const/4 v1, 0x0

    if-eqz v0, :cond_14

    .line 228
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getClipboardManager()Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    move-result-object v0

    .line 229
    if-eqz v0, :cond_12

    .line 230
    iget-object v2, p0, Lcom/genymobile/scrcpy/Device;->clipChangedListener:Landroid/content/IOnPrimaryClipChangedListener;

    invoke-virtual {v0, v2}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->removePrimaryClipChangedListener(Landroid/content/IOnPrimaryClipChangedListener;)Z

    .line 232
    :cond_12
    iput-object v1, p0, Lcom/genymobile/scrcpy/Device;->clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;

    .line 234
    :cond_14
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device;->rotationWatcher:Landroid/view/IRotationWatcher;

    if-eqz v0, :cond_25

    .line 235
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getWindowManager()Lcom/genymobile/scrcpy/wrappers/WindowManager;

    move-result-object v0

    iget-object v2, p0, Lcom/genymobile/scrcpy/Device;->rotationWatcher:Landroid/view/IRotationWatcher;

    invoke-virtual {v0, v2}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->unregisterRotationWatcher(Landroid/view/IRotationWatcher;)V

    .line 236
    iput-object v1, p0, Lcom/genymobile/scrcpy/Device;->rotationWatcher:Landroid/view/IRotationWatcher;

    .line 238
    :cond_25
    iput-object v1, p0, Lcom/genymobile/scrcpy/Device;->rotationListener:Lcom/genymobile/scrcpy/Device$RotationListener;

    .line 239
    iput-object v1, p0, Lcom/genymobile/scrcpy/Device;->clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;

    .line 240
    return-void
.end method

.method public declared-synchronized setClipboardListener(Lcom/genymobile/scrcpy/Device$ClipboardListener;)V
    .registers 2

    monitor-enter p0

    .line 187
    :try_start_1
    iput-object p1, p0, Lcom/genymobile/scrcpy/Device;->clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;
    :try_end_3
    .catchall {:try_start_1 .. :try_end_3} :catchall_5

    .line 188
    monitor-exit p0

    return-void

    .line 186
    :catchall_5
    move-exception p1

    :try_start_6
    monitor-exit p0
    :try_end_7
    .catchall {:try_start_6 .. :try_end_7} :catchall_5

    throw p1
.end method

.method public setClipboardText(Ljava/lang/String;)Z
    .registers 6

    .line 212
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getClipboardManager()Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    move-result-object v0

    .line 213
    const/4 v1, 0x0

    if-nez v0, :cond_a

    .line 214
    return v1

    .line 216
    :cond_a
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->getClipboardText()Ljava/lang/String;

    move-result-object v2

    .line 217
    if-eqz v2, :cond_17

    invoke-virtual {v2, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_17

    .line 218
    return v1

    .line 220
    :cond_17
    iget-object v2, p0, Lcom/genymobile/scrcpy/Device;->isSettingClipboard:Ljava/util/concurrent/atomic/AtomicBoolean;

    const/4 v3, 0x1

    invoke-virtual {v2, v3}, Ljava/util/concurrent/atomic/AtomicBoolean;->set(Z)V

    .line 221
    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->setText(Ljava/lang/CharSequence;)Z

    move-result p1

    .line 222
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device;->isSettingClipboard:Ljava/util/concurrent/atomic/AtomicBoolean;

    invoke-virtual {v0, v1}, Ljava/util/concurrent/atomic/AtomicBoolean;->set(Z)V

    .line 223
    return p1
.end method

.method public declared-synchronized setRotationListener(Lcom/genymobile/scrcpy/Device$RotationListener;)V
    .registers 2

    monitor-enter p0

    .line 183
    :try_start_1
    iput-object p1, p0, Lcom/genymobile/scrcpy/Device;->rotationListener:Lcom/genymobile/scrcpy/Device$RotationListener;
    :try_end_3
    .catchall {:try_start_1 .. :try_end_3} :catchall_5

    .line 184
    monitor-exit p0

    return-void

    .line 182
    :catchall_5
    move-exception p1

    :try_start_6
    monitor-exit p0
    :try_end_7
    .catchall {:try_start_6 .. :try_end_7} :catchall_5

    throw p1
.end method

.method public declared-synchronized setScreenInfo(Lcom/genymobile/scrcpy/ScreenInfo;)V
    .registers 2

    monitor-enter p0

    .line 120
    :try_start_1
    iput-object p1, p0, Lcom/genymobile/scrcpy/Device;->screenInfo:Lcom/genymobile/scrcpy/ScreenInfo;
    :try_end_3
    .catchall {:try_start_1 .. :try_end_3} :catchall_5

    .line 121
    monitor-exit p0

    return-void

    .line 119
    :catchall_5
    move-exception p1

    :try_start_6
    monitor-exit p0
    :try_end_7
    .catchall {:try_start_6 .. :try_end_7} :catchall_5

    throw p1
.end method

.method public supportsInputEvents()Z
    .registers 2

    .line 144
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Device;->supportsInputEvents:Z

    return v0
.end method
