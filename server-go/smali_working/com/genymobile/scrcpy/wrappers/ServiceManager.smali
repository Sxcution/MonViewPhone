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

    .line 25
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    :try_start_3
    const-string v0, "android.os.ServiceManager"

    .line 27
    invoke-static {v0}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object v0

    const-string v1, "getService"

    const/4 v2, 0x1

    new-array v2, v2, [Ljava/lang/Class;

    const/4 v3, 0x0

    const-class v4, Ljava/lang/String;

    aput-object v4, v2, v3

    invoke-virtual {v0, v1, v2}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getServiceMethod:Ljava/lang/reflect/Method;
    :try_end_19
    .catch Ljava/lang/Exception; {:try_start_3 .. :try_end_19} :catch_1a

    return-void

    :catch_1a
    move-exception v0

    .line 29
    new-instance v1, Ljava/lang/AssertionError;

    invoke-direct {v1, v0}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw v1
.end method

.method private getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;
    .registers 9

    .line 35
    :try_start_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getServiceMethod:Ljava/lang/reflect/Method;

    const/4 v1, 0x1

    new-array v2, v1, [Ljava/lang/Object;

    const/4 v3, 0x0

    aput-object p1, v2, v3

    const/4 p1, 0x0

    invoke-virtual {v0, p1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/os/IBinder;

    .line 36
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v2, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p2, "$Stub"

    invoke-virtual {v2, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-static {p2}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object p2

    const-string v2, "asInterface"

    new-array v4, v1, [Ljava/lang/Class;

    const-class v5, Landroid/os/IBinder;

    aput-object v5, v4, v3

    invoke-virtual {p2, v2, v4}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object p2

    new-array v1, v1, [Ljava/lang/Object;

    aput-object v0, v1, v3

    .line 37
    invoke-virtual {p2, p1, v1}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p1

    check-cast p1, Landroid/os/IInterface;
    :try_end_3a
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_3a} :catch_3b

    return-object p1

    :catch_3b
    move-exception p1

    .line 39
    new-instance p2, Ljava/lang/AssertionError;

    invoke-direct {p2, p1}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw p2
.end method


# virtual methods
.method public getActivityManager()Lcom/genymobile/scrcpy/wrappers/ActivityManager;
    .registers 5

    .line 93
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->activityManager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    if-nez v0, :cond_2b

    :try_start_4
    const-string v0, "android.app.ActivityManagerNative"

    .line 97
    invoke-static {v0}, Ljava/lang/Class;->forName(Ljava/lang/String;)Ljava/lang/Class;

    move-result-object v0

    const-string v1, "getDefault"

    const/4 v2, 0x0

    new-array v3, v2, [Ljava/lang/Class;

    .line 98
    invoke-virtual {v0, v1, v3}, Ljava/lang/Class;->getDeclaredMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    const/4 v1, 0x0

    new-array v2, v2, [Ljava/lang/Object;

    .line 99
    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/os/IInterface;

    .line 100
    new-instance v1, Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    invoke-direct {v1, v0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;-><init>(Landroid/os/IInterface;)V

    iput-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->activityManager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;
    :try_end_23
    .catch Ljava/lang/Exception; {:try_start_4 .. :try_end_23} :catch_24

    goto :goto_2b

    :catch_24
    move-exception v0

    .line 102
    new-instance v1, Ljava/lang/AssertionError;

    invoke-direct {v1, v0}, Ljava/lang/AssertionError;-><init>(Ljava/lang/Object;)V

    throw v1

    .line 106
    :cond_2b
    :goto_2b
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->activityManager:Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    return-object v0
.end method

.method public getClipboardManager()Lcom/genymobile/scrcpy/wrappers/ClipboardManager;
    .registers 3

    .line 79
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->clipboardManager:Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    if-nez v0, :cond_17

    const-string v0, "clipboard"

    const-string v1, "android.content.IClipboard"

    .line 80
    invoke-direct {p0, v0, v1}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v0

    if-nez v0, :cond_10

    const/4 v0, 0x0

    return-object v0

    .line 87
    :cond_10
    new-instance v1, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    invoke-direct {v1, v0}, Lcom/genymobile/scrcpy/wrappers/ClipboardManager;-><init>(Landroid/os/IInterface;)V

    iput-object v1, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->clipboardManager:Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    .line 89
    :cond_17
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->clipboardManager:Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    return-object v0
.end method

.method public getDisplayManager()Lcom/genymobile/scrcpy/wrappers/DisplayManager;
    .registers 4

    .line 51
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->displayManager:Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    if-nez v0, :cond_13

    .line 52
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    const-string v1, "display"

    const-string v2, "android.hardware.display.IDisplayManager"

    invoke-direct {p0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v1

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/DisplayManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->displayManager:Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    .line 54
    :cond_13
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->displayManager:Lcom/genymobile/scrcpy/wrappers/DisplayManager;

    return-object v0
.end method

.method public getInputManager()Lcom/genymobile/scrcpy/wrappers/InputManager;
    .registers 4

    .line 58
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->inputManager:Lcom/genymobile/scrcpy/wrappers/InputManager;

    if-nez v0, :cond_13

    .line 59
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/InputManager;

    const-string v1, "input"

    const-string v2, "android.hardware.input.IInputManager"

    invoke-direct {p0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v1

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/InputManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->inputManager:Lcom/genymobile/scrcpy/wrappers/InputManager;

    .line 61
    :cond_13
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->inputManager:Lcom/genymobile/scrcpy/wrappers/InputManager;

    return-object v0
.end method

.method public getPowerManager()Lcom/genymobile/scrcpy/wrappers/PowerManager;
    .registers 4

    .line 65
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->powerManager:Lcom/genymobile/scrcpy/wrappers/PowerManager;

    if-nez v0, :cond_13

    .line 66
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/PowerManager;

    const-string v1, "power"

    const-string v2, "android.os.IPowerManager"

    invoke-direct {p0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v1

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/PowerManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->powerManager:Lcom/genymobile/scrcpy/wrappers/PowerManager;

    .line 68
    :cond_13
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->powerManager:Lcom/genymobile/scrcpy/wrappers/PowerManager;

    return-object v0
.end method

.method public getStatusBarManager()Lcom/genymobile/scrcpy/wrappers/StatusBarManager;
    .registers 4

    .line 72
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->statusBarManager:Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    if-nez v0, :cond_13

    .line 73
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    const-string v1, "statusbar"

    const-string v2, "com.android.internal.statusbar.IStatusBarService"

    invoke-direct {p0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v1

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->statusBarManager:Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    .line 75
    :cond_13
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->statusBarManager:Lcom/genymobile/scrcpy/wrappers/StatusBarManager;

    return-object v0
.end method

.method public getWindowManager()Lcom/genymobile/scrcpy/wrappers/WindowManager;
    .registers 4

    .line 44
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->windowManager:Lcom/genymobile/scrcpy/wrappers/WindowManager;

    if-nez v0, :cond_13

    .line 45
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/WindowManager;

    const-string v1, "window"

    const-string v2, "android.view.IWindowManager"

    invoke-direct {p0, v1, v2}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getService(Ljava/lang/String;Ljava/lang/String;)Landroid/os/IInterface;

    move-result-object v1

    invoke-direct {v0, v1}, Lcom/genymobile/scrcpy/wrappers/WindowManager;-><init>(Landroid/os/IInterface;)V

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->windowManager:Lcom/genymobile/scrcpy/wrappers/WindowManager;

    .line 47
    :cond_13
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->windowManager:Lcom/genymobile/scrcpy/wrappers/WindowManager;

    return-object v0
.end method
