.class public final Lcom/genymobile/scrcpy/wrappers/ServiceManager;
.super Ljava/lang/Object;
.source "ServiceManager.java"


# static fields
.field public static final PACKAGE_NAME:Ljava/lang/String; = "com.android.shell"

.field public static final USER_ID:I


# instance fields
.field private activityManager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;

.field private clipboardManager:Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

.field private displayManager:Lcom/genymobile/scrcpy/wrappers/DisplayManager;

.field private final getServiceMethod:Ljava/lang/reflect/Method;

.field private inputManager:Lcom/genymobile/scrcpy/wrappers/InputManager;

.field private powerManager:Lcom/genymobile/scrcpy/wrappers/PowerManager;

.field private statusBarManager:Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

.field private windowManager:Lcom/genymobile/scrcpy/wrappers/WindowManager;


# direct methods
.method public constructor <init>()V
    .registers 6

    .line 20
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 22
    :try_start_3
    const-string v0, "android.os.ServiceManager"

    invoke-static {v0}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object v0

    const-string v1, "getService"

    const/4 v2, 0x1

    new-array v2, v2, [Ljava/lang/Class;

    const-class v3, Ljava/lang/String;

    const/4 v4, 0x0

    aput-object v3, v2, v4

    invoke-virtual {v0, v1, v2}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getServiceMethod:Ljava/lang/reflect/Method;
    :try_end_19
    .catch Ljava/lang/Exception; {:try_start_3 .. :try_end_19} :catch_1b

    .line 25
    nop

    .line 26
    return-void

    .line 23
    :catch_1b
    move-exception v0

    .line 24
    new-instance v1, Ljava/lang/AssertionError;

    invoke-direct {v1, v0}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw v1
.end method

.method private getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;
    .registers 8

    .line 30
    :try_start_0
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p2

    const-string v0, "$Stub"

    invoke-virtual {p2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p2

    invoke-virtual {p2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-static {p2}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object p2

    const-string v0, "asInterface"

    const/4 v1, 0x1

    new-array v2, v1, [Ljava/lang/Class;

    const-class v3, Landroid/os/IBinder;

    const/4 v4, 0x0

    aput-object v3, v2, v4

    invoke-virtual {p2, v0, v2}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object p2

    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getServiceMethod:Ljava/lang/reflect/Method;

    new-array v2, v1, [Ljava/lang/Object;

    aput-object p1, v2, v4

    const/4 p1, 0x0

    invoke-virtual {v0, p1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/os/IBinder;

    new-array v1, v1, [Ljava/lang/Object;

    aput-object v0, v1, v4

    invoke-virtual {p2, p1, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Landroid/os/IInterface;
    :try_end_3c
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_3c} :catch_3d

    return-object p1

    .line 31
    :catch_3d
    move-exception p1

    .line 32
    new-instance p2, Ljava/lang/AssertionError;

    invoke-direct {p2, p1}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw p2
.end method


# virtual methods
.method public getActivityManager()Lcom/genymobile/scrcpy/wrappers/ActivityManager;
    .registers 6

    .line 83
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->activityManager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    if-nez v0, :cond_2b

    .line 85
    :try_start_4
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    const-string v1, "android.app.ActivityManagerNative"

    invoke-static {v1}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object v1

    const-string v2, "getDefault"

    const/4 v3, 0x0

    new-array v4, v3, [Ljava/lang/Class;

    invoke-virtual {v1, v2, v4}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v1

    new-array v2, v3, [Ljava/lang/Object;

    const/4 v3, 0x0

    invoke-virtual {v1, v3, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Landroid/os/IInterface;

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->activityManager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;
    :try_end_23
    .catch Ljava/lang/Exception; {:try_start_4 .. :try_end_23} :catch_24

    .line 88
    goto :goto_2b

    .line 86
    :catch_24
    move-exception v0

    .line 87
    new-instance v1, Ljava/lang/AssertionError;

    invoke-direct {v1, v0}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw v1

    .line 90
    :cond_2b
    :goto_2b
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->activityManager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    return-object v0
.end method

.method public getClipboardManager()Lcom/genymobile/scrcpy/wrappers/ClipboardManager;
    .registers 3

    .line 72
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->clipboardManager:Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    if-nez v0, :cond_17

    .line 73
    const-string v0, "clipboard"

    const-string v1, "android.content.IClipboard"

    invoke-direct {p0, v0, v1}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v0

    .line 74
    if-nez v0, :cond_10

    .line 75
    const/4 v0, 0x0

    return-object v0

    .line 77
    :cond_10
    new-instance v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    invoke-direct {v1, v0}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;-><init>(Landroid/os/IInterface;)V

    iput-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->clipboardManager:Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    .line 79
    :cond_17
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->clipboardManager:Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    return-object v0
.end method

.method public getDisplayManager()Lcom/genymobile/scrcpy/wrappers/DisplayManager;
    .registers 4

    .line 44
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->displayManager:Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    if-nez v0, :cond_13

    .line 45
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    const-string v1, "display"

    const-string v2, "android.hardware.display.IDisplayManager"

    invoke-direct {p0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v1

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/DisplayManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->displayManager:Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    .line 47
    :cond_13
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->displayManager:Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    return-object v0
.end method

.method public getInputManager()Lcom/genymobile/scrcpy/wrappers/InputManager;
    .registers 4

    .line 51
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->inputManager:Lcom/genymobile/scrcpy/wrappers/InputManager;

    if-nez v0, :cond_13

    .line 52
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/InputManager;

    const-string v1, "input"

    const-string v2, "android.hardware.input.IInputManager"

    invoke-direct {p0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v1

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/InputManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->inputManager:Lcom/genymobile/scrcpy/wrappers/InputManager;

    .line 54
    :cond_13
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->inputManager:Lcom/genymobile/scrcpy/wrappers/InputManager;

    return-object v0
.end method

.method public getPowerManager()Lcom/genymobile/scrcpy/wrappers/PowerManager;
    .registers 4

    .line 58
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->powerManager:Lcom/genymobile/scrcpy/wrappers/PowerManager;

    if-nez v0, :cond_13

    .line 59
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/PowerManager;

    const-string v1, "power"

    const-string v2, "android.os.IPowerManager"

    invoke-direct {p0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v1

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/PowerManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->powerManager:Lcom/genymobile/scrcpy/wrappers/PowerManager;

    .line 61
    :cond_13
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->powerManager:Lcom/genymobile/scrcpy/wrappers/PowerManager;

    return-object v0
.end method

.method public getStatusBarManager()Lcom/genymobile/scrcpy/wrappers/StatusBarManager;
    .registers 4

    .line 65
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->statusBarManager:Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    if-nez v0, :cond_13

    .line 66
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    const-string v1, "statusbar"

    const-string v2, "com.android.internal.statusbar.IStatusBarService"

    invoke-direct {p0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v1

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->statusBarManager:Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    .line 68
    :cond_13
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->statusBarManager:Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    return-object v0
.end method

.method public getWindowManager()Lcom/genymobile/scrcpy/wrappers/WindowManager;
    .registers 4

    .line 37
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->windowManager:Lcom/genymobile/scrcpy/wrappers/WindowManager;

    if-nez v0, :cond_13

    .line 38
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/WindowManager;

    const-string v1, "window"

    const-string v2, "android.view.IWindowManager"

    invoke-direct {p0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v1

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/WindowManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->windowManager:Lcom/genymobile/scrcpy/wrappers/WindowManager;

    .line 40
    :cond_13
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->windowManager:Lcom/genymobile/scrcpy/wrappers/WindowManager;

    return-object v0
.end method
