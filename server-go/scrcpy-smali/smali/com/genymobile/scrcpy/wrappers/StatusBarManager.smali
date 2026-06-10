.class public Lcom/genymobile/scrcpy/wrappers/StatusBarManager;
.super Ljava/lang/Object;
.source "StatusBarManager.java"


# instance fields
.field private collapsePanelsMethod:Ljava/lang/reflect/Method;

.field private expandNotificationsPanelMethod:Ljava/lang/reflect/Method;

.field private expandSettingsPanelMethod:Ljava/lang/reflect/Method;

.field private expandSettingsPanelMethodNewVersion:Z

.field private final manager:Landroid/os/IInterface;


# direct methods
.method public constructor <init>(Landroid/os/IInterface;)V
    .locals 1

    .line 18
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    const/4 v0, 0x1

    .line 15
    iput-boolean v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethodNewVersion:Z

    .line 19
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    return-void
.end method

.method private getCollapsePanelsMethod()Ljava/lang/reflect/Method;
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 44
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->collapsePanelsMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_0

    .line 45
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "collapsePanels"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->collapsePanelsMethod:Ljava/lang/reflect/Method;

    .line 47
    :cond_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->collapsePanelsMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getExpandNotificationsPanelMethod()Ljava/lang/reflect/Method;
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 23
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandNotificationsPanelMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_0

    .line 24
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "expandNotificationsPanel"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandNotificationsPanelMethod:Ljava/lang/reflect/Method;

    .line 26
    :cond_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandNotificationsPanelMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getExpandSettingsPanel()Ljava/lang/reflect/Method;
    .locals 5
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    const-string v0, "expandSettingsPanel"

    .line 30
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethod:Ljava/lang/reflect/Method;

    if-nez v1, :cond_0

    const/4 v1, 0x0

    .line 33
    :try_start_0
    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v2}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    const/4 v3, 0x1

    new-array v3, v3, [Ljava/lang/Class;

    const-class v4, Ljava/lang/String;

    aput-object v4, v3, v1

    invoke-virtual {v2, v0, v3}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v2

    iput-object v2, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethod:Ljava/lang/reflect/Method;
    :try_end_0
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    .line 36
    :catch_0
    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v2}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    new-array v3, v1, [Ljava/lang/Class;

    invoke-virtual {v2, v0, v3}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethod:Ljava/lang/reflect/Method;

    .line 37
    iput-boolean v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethodNewVersion:Z

    .line 40
    :cond_0
    :goto_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method


# virtual methods
.method public collapsePanels()V
    .locals 3

    .line 76
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->getCollapsePanelsMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    .line 77
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Object;

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_1

    :catch_0
    move-exception v0

    goto :goto_0

    :catch_1
    move-exception v0

    goto :goto_0

    :catch_2
    move-exception v0

    :goto_0
    const-string v1, "Could not invoke method"

    .line 79
    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :goto_1
    return-void
.end method

.method public expandNotificationsPanel()V
    .locals 3

    .line 52
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->getExpandNotificationsPanelMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    .line 53
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Object;

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_1

    :catch_0
    move-exception v0

    goto :goto_0

    :catch_1
    move-exception v0

    goto :goto_0

    :catch_2
    move-exception v0

    :goto_0
    const-string v1, "Could not invoke method"

    .line 55
    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :goto_1
    return-void
.end method

.method public expandSettingsPanel()V
    .locals 5

    .line 61
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->getExpandSettingsPanel()Ljava/lang/reflect/Method;

    move-result-object v0

    .line 62
    iget-boolean v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethodNewVersion:Z

    const/4 v2, 0x0

    if-eqz v1, :cond_0

    .line 64
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    const/4 v3, 0x1

    new-array v3, v3, [Ljava/lang/Object;

    const/4 v4, 0x0

    aput-object v4, v3, v2

    invoke-virtual {v0, v1, v3}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    goto :goto_1

    .line 67
    :cond_0
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    new-array v2, v2, [Ljava/lang/Object;

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_0
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_0} :catch_2
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_1

    :catch_0
    move-exception v0

    goto :goto_0

    :catch_1
    move-exception v0

    goto :goto_0

    :catch_2
    move-exception v0

    :goto_0
    const-string v1, "Could not invoke method"

    .line 70
    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :goto_1
    return-void
.end method
