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
    .registers 3

    .line 16
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 13
    const/4 v0, 0x1

    iput-boolean v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethodNewVersion:Z

    .line 17
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    .line 18
    return-void
.end method

.method private getCollapsePanelsMethod()Ljava/lang/reflect/Method;
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 40
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->collapsePanelsMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_15

    .line 41
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "collapsePanels"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->collapsePanelsMethod:Ljava/lang/reflect/Method;

    .line 43
    :cond_15
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->collapsePanelsMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getExpandNotificationsPanelMethod()Ljava/lang/reflect/Method;
    .registers 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 21
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandNotificationsPanelMethod:Ljava/lang/reflect/Method;

    if-nez v0, :cond_15

    .line 22
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v0}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v0

    const/4 v1, 0x0

    new-array v1, v1, [Ljava/lang/Class;

    const-string v2, "expandNotificationsPanel"

    invoke-virtual {v0, v2, v1}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandNotificationsPanelMethod:Ljava/lang/reflect/Method;

    .line 24
    :cond_15
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandNotificationsPanelMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method

.method private getExpandSettingsPanel()Ljava/lang/reflect/Method;
    .registers 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/NoSuchMethodException;
        }
    .end annotation

    .line 28
    const-string v0, "expandSettingsPanel"

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethod:Ljava/lang/reflect/Method;

    if-nez v1, :cond_2c

    .line 30
    const/4 v1, 0x0

    :try_start_7
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
    :try_end_1a
    .catch Ljava/lang/NoSuchMethodException; {:try_start_7 .. :try_end_1a} :catch_1b

    .line 34
    goto :goto_2c

    .line 31
    :catch_1b
    move-exception v2

    .line 32
    iget-object v2, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    invoke-virtual {v2}, Ljava/lang/Object;->getClass()Ljava/lang/Class;

    move-result-object v2

    new-array v3, v1, [Ljava/lang/Class;

    invoke-virtual {v2, v0, v3}, Ljava/lang/Class;->getMethod(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;

    move-result-object v0

    iput-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethod:Ljava/lang/reflect/Method;

    .line 33
    iput-boolean v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethodNewVersion:Z

    .line 36
    :cond_2c
    :goto_2c
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethod:Ljava/lang/reflect/Method;

    return-object v0
.end method


# virtual methods
.method public collapsePanels()V
    .registers 4

    .line 69
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->getCollapsePanelsMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Object;

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_c
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_c} :catch_11
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_c} :catch_f
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_c} :catch_d

    .line 72
    goto :goto_17

    .line 70
    :catch_d
    move-exception v0

    goto :goto_12

    :catch_f
    move-exception v0

    goto :goto_12

    :catch_11
    move-exception v0

    .line 71
    :goto_12
    const-string v1, "Could not invoke method"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 73
    :goto_17
    return-void
.end method

.method public expandNotificationsPanel()V
    .registers 4

    .line 48
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->getExpandNotificationsPanelMethod()Ljava/lang/reflect/Method;

    move-result-object v0

    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Object;

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_c
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_c} :catch_11
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_c} :catch_f
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_c} :catch_d

    .line 51
    goto :goto_17

    .line 49
    :catch_d
    move-exception v0

    goto :goto_12

    :catch_f
    move-exception v0

    goto :goto_12

    :catch_11
    move-exception v0

    .line 50
    :goto_12
    const-string v1, "Could not invoke method"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 52
    :goto_17
    return-void
.end method

.method public expandSettingsPanel()V
    .registers 4

    .line 56
    :try_start_0
    invoke-direct {p0}, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->getExpandSettingsPanel()Ljava/lang/reflect/Method;

    move-result-object v0

    .line 57
    iget-boolean v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->expandSettingsPanelMethodNewVersion:Z

    if-eqz v1, :cond_f

    .line 58
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;

    goto :goto_17

    .line 60
    :cond_f
    iget-object v1, p0, Lcom/genymobile/scrcpy/wrappers/StatusBarManager;->manager:Landroid/os/IInterface;

    const/4 v2, 0x0

    new-array v2, v2, [Ljava/lang/Object;

    invoke-virtual {v0, v1, v2}, Ljava/lang/reflect/Method;->invoke(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;
    :try_end_17
    .catch Ljava/lang/IllegalAccessException; {:try_start_0 .. :try_end_17} :catch_1c
    .catch Ljava/lang/NoSuchMethodException; {:try_start_0 .. :try_end_17} :catch_1a
    .catch Ljava/lang/reflect/InvocationTargetException; {:try_start_0 .. :try_end_17} :catch_18

    .line 64
    :goto_17
    goto :goto_22

    .line 62
    :catch_18
    move-exception v0

    goto :goto_1d

    :catch_1a
    move-exception v0

    goto :goto_1d

    :catch_1c
    move-exception v0

    .line 63
    :goto_1d
    const-string v1, "Could not invoke method"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 65
    :goto_22
    return-void
.end method
