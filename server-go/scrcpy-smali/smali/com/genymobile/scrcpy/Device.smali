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
    .locals 1

    .line 31
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;-><init>()V

    sput-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    return-void
.end method

.method public constructor <init>(Lcom/genymobile/scrcpy/Options;Lcom/genymobile/scrcpy/VideoSettings;)V
    .locals 3

    .line 61
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 44
    new-instance v0, Ljava/util/concurrent/atomic/AtomicBoolean;

    invoke-direct {v0}, Ljava/util/concurrent/atomic/AtomicBoolean;-><init>()V

    iput-object v0, p0, Lcom/genymobile/scrcpy/Device;->isSettingClipboard:Ljava/util/concurrent/atomic/AtomicBoolean;

    .line 62
    invoke-virtual {p2}, Lcom/genymobile/scrcpy/VideoSettings;->getDisplayId()I

    move-result v0

    iput v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    .line 63
    invoke-static {v0}, Lcom/genymobile/scrcpy/Device;->getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;

    move-result-object v0

    if-eqz v0, :cond_6

    .line 68
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/DisplayInfo;->getFlags()I

    move-result v1

    .line 70
    invoke-static {v0, p2}, Lcom/genymobile/scrcpy/ScreenInfo;->computeScreenInfo(Lcom/genymobile/scrcpy/DisplayInfo;Lcom/genymobile/scrcpy/VideoSettings;)Lcom/genymobile/scrcpy/ScreenInfo;

    move-result-object v2

    iput-object v2, p0, Lcom/genymobile/scrcpy/Device;->screenInfo:Lcom/genymobile/scrcpy/ScreenInfo;

    .line 71
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/DisplayInfo;->getLayerStack()I

    move-result v0

    iput v0, p0, Lcom/genymobile/scrcpy/Device;->layerStack:I

    .line 73
    new-instance v0, Lcom/genymobile/scrcpy/Device$1;

    invoke-direct {v0, p0, p2}, Lcom/genymobile/scrcpy/Device$1;-><init>(Lcom/genymobile/scrcpy/Device;Lcom/genymobile/scrcpy/VideoSettings;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/Device;->rotationWatcher:Landroid/view/IRotationWatcher;

    .line 87
    sget-object p2, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {p2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getWindowManager()Lcom/genymobile/scrcpy/wrappers/WindowManager;

    move-result-object p2

    iget-object v0, p0, Lcom/genymobile/scrcpy/Device;->rotationWatcher:Landroid/view/IRotationWatcher;

    iget v2, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-virtual {p2, v0, v2}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->registerRotationWatcher(Landroid/view/IRotationWatcher;I)V

    .line 89
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Options;->getControl()Z

    move-result p1

    if-eqz p1, :cond_1

    .line 91
    sget-object p1, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getClipboardManager()Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    move-result-object p1

    .line 92
    new-instance p2, Lcom/genymobile/scrcpy/Device$2;

    invoke-direct {p2, p0}, Lcom/genymobile/scrcpy/Device$2;-><init>(Lcom/genymobile/scrcpy/Device;)V

    iput-object p2, p0, Lcom/genymobile/scrcpy/Device;->clipChangedListener:Landroid/content/IOnPrimaryClipChangedListener;

    if-eqz p1, :cond_0

    .line 110
    invoke-virtual {p1, p2}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->addPrimaryClipChangedListener(Landroid/content/IOnPrimaryClipChangedListener;)Z

    goto :goto_0

    :cond_0
    const-string p1, "No clipboard manager, copy-paste between device and computer will not work"

    .line 112
    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    :cond_1
    :goto_0
    const/4 p1, 0x1

    and-int/lit8 p2, v1, 0x1

    if-nez p2, :cond_2

    const-string p2, "Display doesn\'t have FLAG_SUPPORTS_PROTECTED_BUFFERS flag, mirroring can be restricted"

    .line 117
    invoke-static {p2}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 121
    :cond_2
    iget p2, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    if-eqz p2, :cond_4

    sget p2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v0, 0x1d

    if-lt p2, v0, :cond_3

    goto :goto_1

    :cond_3
    const/4 p1, 0x0

    :cond_4
    :goto_1
    iput-boolean p1, p0, Lcom/genymobile/scrcpy/Device;->supportsInputEvents:Z

    if-nez p1, :cond_5

    const-string p1, "Input events are not supported for secondary displays before Android 10"

    .line 123
    invoke-static {p1}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    :cond_5
    return-void

    .line 65
    :cond_6
    new-instance p1, Lcom/genymobile/scrcpy/InvalidDisplayIdException;

    iget p2, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-static {}, Lcom/genymobile/scrcpy/Device;->getDisplayIds()[I

    move-result-object v0

    invoke-direct {p1, p2, v0}, Lcom/genymobile/scrcpy/InvalidDisplayIdException;-><init>(I[I)V

    throw p1
.end method

.method static synthetic access$000(Lcom/genymobile/scrcpy/Device;)Lcom/genymobile/scrcpy/Device$RotationListener;
    .locals 0

    .line 23
    iget-object p0, p0, Lcom/genymobile/scrcpy/Device;->rotationListener:Lcom/genymobile/scrcpy/Device$RotationListener;

    return-object p0
.end method

.method static synthetic access$100(Lcom/genymobile/scrcpy/Device;)Ljava/util/concurrent/atomic/AtomicBoolean;
    .locals 0

    .line 23
    iget-object p0, p0, Lcom/genymobile/scrcpy/Device;->isSettingClipboard:Ljava/util/concurrent/atomic/AtomicBoolean;

    return-object p0
.end method

.method static synthetic access$200(Lcom/genymobile/scrcpy/Device;)Lcom/genymobile/scrcpy/Device$ClipboardListener;
    .locals 0

    .line 23
    iget-object p0, p0, Lcom/genymobile/scrcpy/Device;->clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;

    return-object p0
.end method

.method public static collapsePanels()V
    .locals 1

    .line 240
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getStatusBarManager()Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->collapsePanels()V

    return-void
.end method

.method public static createSettingsProvider()Lcom/genymobile/scrcpy/wrappers/ContentProvider;
    .locals 1

    .line 333
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getActivityManager()Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->createSettingsProvider()Lcom/genymobile/scrcpy/wrappers/ContentProvider;

    move-result-object v0

    return-object v0
.end method

.method public static expandNotificationPanel()V
    .locals 1

    .line 232
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getStatusBarManager()Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandNotificationsPanel()V

    return-void
.end method

.method public static expandSettingsPanel()V
    .locals 1

    .line 236
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getStatusBarManager()Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanel()V

    return-void
.end method

.method public static getClipboardText()Ljava/lang/String;
    .locals 2

    .line 244
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getClipboardManager()Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    move-result-object v0

    const/4 v1, 0x0

    if-nez v0, :cond_0

    return-object v1

    .line 248
    :cond_0
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->getText()Ljava/lang/CharSequence;

    move-result-object v0

    if-nez v0, :cond_1

    return-object v1

    .line 252
    :cond_1
    invoke-interface {v0}, Ljava/lang/CharSequence;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method

.method public static getDeviceName()Ljava/lang/String;
    .locals 1

    .line 173
    sget-object v0, Landroid/os/Build;->MODEL:Ljava/lang/String;

    return-object v0
.end method

.method public static getDisplayIds()[I
    .locals 1

    .line 337
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getDisplayManager()Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->getDisplayIds()[I

    move-result-object v0

    return-object v0
.end method

.method public static getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;
    .locals 1

    .line 341
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getDisplayManager()Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    move-result-object v0

    invoke-virtual {v0, p0}, Lcom/genymobile/scrcpy/wrappers/DisplayManager;->getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;

    move-result-object p0

    return-object p0
.end method

.method public static injectEvent(Landroid/view/InputEvent;I)Z
    .locals 1

    .line 185
    invoke-static {p1}, Lcom/genymobile/scrcpy/Device;->supportsInputEvents(I)Z

    move-result v0

    if-eqz v0, :cond_1

    if-eqz p1, :cond_0

    .line 189
    invoke-static {p0, p1}, Lcom/genymobile/scrcpy/wrappers/InputManager;->setDisplayId(Landroid/view/InputEvent;I)Z

    .line 193
    :cond_0
    sget-object p1, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getInputManager()Lcom/genymobile/scrcpy/wrappers/InputManager;

    move-result-object p1

    const/4 v0, 0x0

    invoke-virtual {p1, p0, v0}, Lcom/genymobile/scrcpy/wrappers/InputManager;->injectInputEvent(Landroid/view/InputEvent;I)Z

    move-result p0

    return p0

    .line 186
    :cond_1
    new-instance p0, Ljava/lang/AssertionError;

    const-string p1, "Could not inject input event if !supportsInputEvents()"

    invoke-direct {p0, p1}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw p0
.end method

.method public static injectKeyEvent(IIIII)Z
    .locals 14

    .line 201
    invoke-static {}, Landroid/os/SystemClock;->uptimeMillis()J

    move-result-wide v3

    .line 202
    new-instance v13, Landroid/view/KeyEvent;

    const/4 v9, -0x1

    const/4 v10, 0x0

    const/4 v11, 0x0

    const/16 v12, 0x101

    move-object v0, v13

    move-wide v1, v3

    move v5, p0

    move v6, p1

    move/from16 v7, p2

    move/from16 v8, p3

    invoke-direct/range {v0 .. v12}, Landroid/view/KeyEvent;-><init>(JJIIIIIIII)V

    move/from16 v0, p4

    .line 204
    invoke-static {v13, v0}, Lcom/genymobile/scrcpy/Device;->injectEvent(Landroid/view/InputEvent;I)Z

    move-result v0

    return v0
.end method

.method public static isScreenOn()Z
    .locals 1

    .line 220
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getPowerManager()Lcom/genymobile/scrcpy/wrappers/PowerManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/PowerManager;->isScreenOn()Z

    move-result v0

    return v0
.end method

.method public static powerOffScreen(I)Z
    .locals 1

    .line 305
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->isScreenOn()Z

    move-result v0

    if-nez v0, :cond_0

    const/4 p0, 0x1

    return p0

    :cond_0
    const/16 v0, 0x1a

    .line 308
    invoke-static {v0, p0}, Lcom/genymobile/scrcpy/Device;->pressReleaseKeycode(II)Z

    move-result p0

    return p0
.end method

.method public static pressReleaseKeycode(II)Z
    .locals 3

    const/4 v0, 0x0

    .line 212
    invoke-static {v0, p0, v0, v0, p1}, Lcom/genymobile/scrcpy/Device;->injectKeyEvent(IIIII)Z

    move-result v1

    const/4 v2, 0x1

    if-eqz v1, :cond_0

    invoke-static {v2, p0, v0, v0, p1}, Lcom/genymobile/scrcpy/Device;->injectKeyEvent(IIIII)Z

    move-result p0

    if-eqz p0, :cond_0

    const/4 v0, 0x1

    :cond_0
    return v0
.end method

.method public static rotateDevice()V
    .locals 6

    .line 315
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getWindowManager()Lcom/genymobile/scrcpy/wrappers/WindowManager;

    move-result-object v0

    .line 317
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->isRotationFrozen()Z

    move-result v1

    xor-int/lit8 v1, v1, 0x1

    .line 319
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->getRotation()I

    move-result v2

    and-int/lit8 v2, v2, 0x1

    xor-int/lit8 v2, v2, 0x1

    if-nez v2, :cond_0

    const-string v3, "portrait"

    goto :goto_0

    :cond_0
    const-string v3, "landscape"

    .line 323
    :goto_0
    new-instance v4, Ljava/lang/StringBuilder;

    invoke-direct {v4}, Ljava/lang/StringBuilder;-><init>()V

    const-string v5, "Device rotation requested: "

    invoke-virtual {v4, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v4}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-static {v3}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 324
    invoke-virtual {v0, v2}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->freezeRotation(I)V

    if-eqz v1, :cond_1

    .line 328
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->thawRotation()V

    :cond_1
    return-void
.end method

.method public static setScreenPowerMode(I)Z
    .locals 1

    .line 296
    invoke-static {}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->getBuiltInDisplay()Landroid/os/IBinder;

    move-result-object v0

    if-nez v0, :cond_0

    const-string p0, "Could not get built-in display"

    .line 298
    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;)V

    const/4 p0, 0x0

    return p0

    .line 301
    :cond_0
    invoke-static {v0, p0}, Lcom/genymobile/scrcpy/wrappers/SurfaceControl;->setDisplayPowerMode(Landroid/os/IBinder;I)Z

    move-result p0

    return p0
.end method

.method public static supportsInputEvents(I)Z
    .locals 1

    if-eqz p0, :cond_1

    .line 177
    sget p0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v0, 0x1d

    if-lt p0, v0, :cond_0

    goto :goto_0

    :cond_0
    const/4 p0, 0x0

    goto :goto_1

    :cond_1
    :goto_0
    const/4 p0, 0x1

    :goto_1
    return p0
.end method


# virtual methods
.method public applyNewVideoSetting(Lcom/genymobile/scrcpy/VideoSettings;)V
    .locals 1

    .line 140
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-static {v0}, Lcom/genymobile/scrcpy/Device;->getDisplayInfo(I)Lcom/genymobile/scrcpy/DisplayInfo;

    move-result-object v0

    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/ScreenInfo;->computeScreenInfo(Lcom/genymobile/scrcpy/DisplayInfo;Lcom/genymobile/scrcpy/VideoSettings;)Lcom/genymobile/scrcpy/ScreenInfo;

    move-result-object p1

    invoke-virtual {p0, p1}, Lcom/genymobile/scrcpy/Device;->setScreenInfo(Lcom/genymobile/scrcpy/ScreenInfo;)V

    return-void
.end method

.method public getDisplayId()I
    .locals 1

    .line 128
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    return v0
.end method

.method public getLayerStack()I
    .locals 1

    .line 136
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->layerStack:I

    return v0
.end method

.method public getPhysicalPoint(Lcom/genymobile/scrcpy/Position;)Lcom/genymobile/scrcpy/Point;
    .locals 5

    .line 150
    invoke-virtual {p0}, Lcom/genymobile/scrcpy/Device;->getScreenInfo()Lcom/genymobile/scrcpy/ScreenInfo;

    move-result-object v0

    .line 153
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->getUnlockedVideoSize()Lcom/genymobile/scrcpy/Size;

    move-result-object v1

    .line 155
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->getReverseVideoRotation()I

    move-result v2

    .line 157
    invoke-virtual {p1, v2}, Lcom/genymobile/scrcpy/Position;->rotate(I)Lcom/genymobile/scrcpy/Position;

    move-result-object p1

    .line 159
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Position;->getScreenSize()Lcom/genymobile/scrcpy/Size;

    move-result-object v2

    .line 160
    invoke-virtual {v1, v2}, Lcom/genymobile/scrcpy/Size;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-nez v2, :cond_0

    const/4 p1, 0x0

    return-object p1

    .line 165
    :cond_0
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/ScreenInfo;->getContentRect()Landroid/graphics/Rect;

    move-result-object v0

    .line 166
    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Position;->getPoint()Lcom/genymobile/scrcpy/Point;

    move-result-object p1

    .line 167
    iget v2, v0, Landroid/graphics/Rect;->left:I

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Point;->getX()I

    move-result v3

    invoke-virtual {v0}, Landroid/graphics/Rect;->width()I

    move-result v4

    mul-int v3, v3, v4

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getWidth()I

    move-result v4

    div-int/2addr v3, v4

    add-int/2addr v2, v3

    .line 168
    iget v3, v0, Landroid/graphics/Rect;->top:I

    invoke-virtual {p1}, Lcom/genymobile/scrcpy/Point;->getY()I

    move-result p1

    invoke-virtual {v0}, Landroid/graphics/Rect;->height()I

    move-result v0

    mul-int p1, p1, v0

    invoke-virtual {v1}, Lcom/genymobile/scrcpy/Size;->getHeight()I

    move-result v0

    div-int/2addr p1, v0

    add-int/2addr v3, p1

    .line 169
    new-instance p1, Lcom/genymobile/scrcpy/Point;

    invoke-direct {p1, v2, v3}, Lcom/genymobile/scrcpy/Point;-><init>(II)V

    return-object p1
.end method

.method public declared-synchronized getScreenInfo()Lcom/genymobile/scrcpy/ScreenInfo;
    .locals 1

    monitor-enter p0

    .line 132
    :try_start_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device;->screenInfo:Lcom/genymobile/scrcpy/ScreenInfo;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    monitor-exit p0

    return-object v0

    :catchall_0
    move-exception v0

    monitor-exit p0

    throw v0
.end method

.method public injectEvent(Landroid/view/InputEvent;)Z
    .locals 1

    .line 197
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/Device;->injectEvent(Landroid/view/InputEvent;I)Z

    move-result p1

    return p1
.end method

.method public injectKeyEvent(IIII)Z
    .locals 1

    .line 208
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-static {p1, p2, p3, p4, v0}, Lcom/genymobile/scrcpy/Device;->injectKeyEvent(IIIII)Z

    move-result p1

    return p1
.end method

.method public pressReleaseKeycode(I)Z
    .locals 1

    .line 216
    iget v0, p0, Lcom/genymobile/scrcpy/Device;->displayId:I

    invoke-static {p1, v0}, Lcom/genymobile/scrcpy/Device;->pressReleaseKeycode(II)Z

    move-result p1

    return p1
.end method

.method public release()V
    .locals 3

    .line 277
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device;->clipChangedListener:Landroid/content/IOnPrimaryClipChangedListener;

    const/4 v1, 0x0

    if-eqz v0, :cond_1

    .line 278
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getClipboardManager()Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    move-result-object v0

    if-eqz v0, :cond_0

    .line 280
    iget-object v2, p0, Lcom/genymobile/scrcpy/Device;->clipChangedListener:Landroid/content/IOnPrimaryClipChangedListener;

    invoke-virtual {v0, v2}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->removePrimaryClipChangedListener(Landroid/content/IOnPrimaryClipChangedListener;)Z

    .line 282
    :cond_0
    iput-object v1, p0, Lcom/genymobile/scrcpy/Device;->clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;

    .line 284
    :cond_1
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device;->rotationWatcher:Landroid/view/IRotationWatcher;

    if-eqz v0, :cond_2

    .line 285
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getWindowManager()Lcom/genymobile/scrcpy/wrappers/WindowManager;

    move-result-object v0

    iget-object v2, p0, Lcom/genymobile/scrcpy/Device;->rotationWatcher:Landroid/view/IRotationWatcher;

    invoke-virtual {v0, v2}, Lcom/genymobile/scrcpy/wrappers/WindowManager;->unregisterRotationWatcher(Landroid/view/IRotationWatcher;)V

    .line 286
    iput-object v1, p0, Lcom/genymobile/scrcpy/Device;->rotationWatcher:Landroid/view/IRotationWatcher;

    .line 288
    :cond_2
    iput-object v1, p0, Lcom/genymobile/scrcpy/Device;->rotationListener:Lcom/genymobile/scrcpy/Device$RotationListener;

    .line 289
    iput-object v1, p0, Lcom/genymobile/scrcpy/Device;->clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;

    return-void
.end method

.method public declared-synchronized setClipboardListener(Lcom/genymobile/scrcpy/Device$ClipboardListener;)V
    .locals 0

    monitor-enter p0

    .line 228
    :try_start_0
    iput-object p1, p0, Lcom/genymobile/scrcpy/Device;->clipboardListener:Lcom/genymobile/scrcpy/Device$ClipboardListener;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 229
    monitor-exit p0

    return-void

    :catchall_0
    move-exception p1

    monitor-exit p0

    throw p1
.end method

.method public setClipboardText(Ljava/lang/String;)Z
    .locals 4

    .line 256
    sget-object v0, Lcom/genymobile/scrcpy/Device;->SERVICE_MANAGER:Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getClipboardManager()Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    move-result-object v0

    const/4 v1, 0x0

    if-nez v0, :cond_0

    return v1

    .line 261
    :cond_0
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->getClipboardText()Ljava/lang/String;

    move-result-object v2

    if-eqz v2, :cond_1

    .line 262
    invoke-virtual {v2, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_1

    return v1

    .line 270
    :cond_1
    iget-object v2, p0, Lcom/genymobile/scrcpy/Device;->isSettingClipboard:Ljava/util/concurrent/atomic/AtomicBoolean;

    const/4 v3, 0x1

    invoke-virtual {v2, v3}, Ljava/util/concurrent/atomic/AtomicBoolean;->set(Z)V

    .line 271
    invoke-virtual {v0, p1}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->setText(Ljava/lang/CharSequence;)Z

    move-result p1

    .line 272
    iget-object v0, p0, Lcom/genymobile/scrcpy/Device;->isSettingClipboard:Ljava/util/concurrent/atomic/AtomicBoolean;

    invoke-virtual {v0, v1}, Ljava/util/concurrent/atomic/AtomicBoolean;->set(Z)V

    return p1
.end method

.method public declared-synchronized setRotationListener(Lcom/genymobile/scrcpy/Device$RotationListener;)V
    .locals 0

    monitor-enter p0

    .line 224
    :try_start_0
    iput-object p1, p0, Lcom/genymobile/scrcpy/Device;->rotationListener:Lcom/genymobile/scrcpy/Device$RotationListener;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 225
    monitor-exit p0

    return-void

    :catchall_0
    move-exception p1

    monitor-exit p0

    throw p1
.end method

.method public declared-synchronized setScreenInfo(Lcom/genymobile/scrcpy/ScreenInfo;)V
    .locals 0

    monitor-enter p0

    .line 144
    :try_start_0
    iput-object p1, p0, Lcom/genymobile/scrcpy/Device;->screenInfo:Lcom/genymobile/scrcpy/ScreenInfo;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 145
    monitor-exit p0

    return-void

    :catchall_0
    move-exception p1

    monitor-exit p0

    throw p1
.end method

.method public supportsInputEvents()Z
    .locals 1

    .line 181
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/Device;->supportsInputEvents:Z

    return v0
.end method
