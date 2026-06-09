.class public final Lcom/genymobile/scrcpy/CleanUp;
.super Ljava/lang/Object;
.source "CleanUp.java"


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Lcom/genymobile/scrcpy/CleanUp$Config;
    }
.end annotation


# static fields
.field public static final SERVER_PATH:Ljava/lang/String; = "/data/local/tmp/scrcpy-server.jar"


# direct methods
.method private constructor <init>()V
    .registers 1

    .line 100
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 101
    return-void
.end method

.method public static configure(IIZZZ)V
    .registers 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 104
    new-instance v0, Lcom/genymobile/scrcpy/CleanUp$Config;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/CleanUp$Config;-><init>()V

    .line 105
    # setter for: Lcom/genymobile/scrcpy/CleanUp$Config;->displayId:I
    invoke-static {v0, p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$002(Lcom/genymobile/scrcpy/CleanUp$Config;I)I

    .line 106
    # setter for: Lcom/genymobile/scrcpy/CleanUp$Config;->disableShowTouches:Z
    invoke-static {v0, p2}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$102(Lcom/genymobile/scrcpy/CleanUp$Config;Z)Z

    .line 107
    # setter for: Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I
    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$202(Lcom/genymobile/scrcpy/CleanUp$Config;I)I

    .line 108
    # setter for: Lcom/genymobile/scrcpy/CleanUp$Config;->restoreNormalPowerMode:Z
    invoke-static {v0, p3}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$302(Lcom/genymobile/scrcpy/CleanUp$Config;Z)Z

    .line 109
    # setter for: Lcom/genymobile/scrcpy/CleanUp$Config;->powerOffScreen:Z
    invoke-static {v0, p4}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$402(Lcom/genymobile/scrcpy/CleanUp$Config;Z)Z

    .line 110
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/CleanUp$Config;->hasWork()Z

    move-result p0

    if-eqz p0, :cond_1e

    .line 111
    invoke-static {v0}, Lcom/genymobile/scrcpy/CleanUp;->startProcess(Lcom/genymobile/scrcpy/CleanUp$Config;)V

    goto :goto_21

    .line 113
    :cond_1e
    invoke-static {}, Lcom/genymobile/scrcpy/CleanUp;->unlinkSelf()V

    .line 115
    :goto_21
    return-void
.end method

.method public static varargs main([Ljava/lang/String;)V
    .registers 6

    .line 132
    invoke-static {}, Lcom/genymobile/scrcpy/CleanUp;->unlinkSelf()V

    .line 134
    :try_start_3
    sget-object v0, Ljava/lang/System;->in:Ljava/io/InputStream;

    invoke-virtual {v0}, Ljava/io/InputStream;->read()I
    :try_end_8
    .catch Ljava/io/IOException; {:try_start_3 .. :try_end_8} :catch_9

    .line 136
    goto :goto_a

    .line 135
    :catch_9
    move-exception v0

    .line 137
    :goto_a
    const-string v0, "Cleaning up"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 138
    const/4 v0, 0x0

    aget-object p0, p0, v0

    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->fromBase64(Ljava/lang/String;)Lcom/genymobile/scrcpy/CleanUp$Config;

    move-result-object p0

    .line 139
    # getter for: Lcom/genymobile/scrcpy/CleanUp$Config;->disableShowTouches:Z
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$100(Lcom/genymobile/scrcpy/CleanUp$Config;)Z

    move-result v0

    const/4 v1, -0x1

    if-nez v0, :cond_23

    # getter for: Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$200(Lcom/genymobile/scrcpy/CleanUp$Config;)I

    move-result v0

    if-eq v0, v1, :cond_64

    .line 140
    :cond_23
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;-><init>()V

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getActivityManager()Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->createSettingsProvider()Lcom/genymobile/scrcpy/wrappers/ContentProvider;

    move-result-object v0

    .line 142
    :try_start_30
    # getter for: Lcom/genymobile/scrcpy/CleanUp$Config;->disableShowTouches:Z
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$100(Lcom/genymobile/scrcpy/CleanUp$Config;)Z

    move-result v2

    if-eqz v2, :cond_44

    .line 143
    const-string v2, "Disabling \"show touches\""

    invoke-static {v2}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 144
    const-string v2, "system"

    const-string v3, "show_touches"

    const-string v4, "0"

    invoke-virtual {v0, v2, v3, v4}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->putValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V

    .line 146
    :cond_44
    # getter for: Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$200(Lcom/genymobile/scrcpy/CleanUp$Config;)I

    move-result v2

    if-eq v2, v1, :cond_5e

    .line 147
    const-string v1, "Restoring \"stay awake\""

    invoke-static {v1}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 148
    const-string v1, "global"

    const-string v2, "stay_on_while_plugged_in"

    # getter for: Lcom/genymobile/scrcpy/CleanUp$Config;->restoreStayOn:I
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$200(Lcom/genymobile/scrcpy/CleanUp$Config;)I

    move-result v3

    invoke-static {v3}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v0, v1, v2, v3}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->putValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V

    .line 150
    :cond_5e
    if-eqz v0, :cond_63

    .line 151
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->close()V
    :try_end_63
    .catchall {:try_start_30 .. :try_end_63} :catchall_8e

    .line 166
    :cond_63
    nop

    .line 168
    :cond_64
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->isScreenOn()Z

    move-result v0

    if-eqz v0, :cond_8d

    .line 169
    # getter for: Lcom/genymobile/scrcpy/CleanUp$Config;->powerOffScreen:Z
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$400(Lcom/genymobile/scrcpy/CleanUp$Config;)Z

    move-result v0

    if-nez v0, :cond_81

    .line 170
    # getter for: Lcom/genymobile/scrcpy/CleanUp$Config;->restoreNormalPowerMode:Z
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$300(Lcom/genymobile/scrcpy/CleanUp$Config;)Z

    move-result p0

    if-eqz p0, :cond_80

    .line 171
    const-string p0, "Restoring normal power mode"

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 172
    const/4 p0, 0x2

    invoke-static {p0}, Lcom/genymobile/scrcpy/Device;->setScreenPowerMode(I)Z

    .line 173
    return-void

    .line 175
    :cond_80
    return-void

    .line 177
    :cond_81
    const-string v0, "Power off screen"

    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 178
    # getter for: Lcom/genymobile/scrcpy/CleanUp$Config;->displayId:I
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$000(Lcom/genymobile/scrcpy/CleanUp$Config;)I

    move-result p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Device;->powerOffScreen(I)Z

    .line 180
    :cond_8d
    return-void

    .line 153
    :catchall_8e
    move-exception p0

    .line 155
    :try_start_8f
    throw p0
    :try_end_90
    .catchall {:try_start_8f .. :try_end_90} :catchall_90

    .line 156
    :catchall_90
    move-exception v1

    .line 157
    if-eqz v0, :cond_9b

    .line 159
    :try_start_93
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->close()V
    :try_end_96
    .catchall {:try_start_93 .. :try_end_96} :catchall_97

    .line 162
    goto :goto_9b

    .line 160
    :catchall_97
    move-exception v0

    .line 161
    invoke-virtual {p0, v0}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    .line 164
    :cond_9b
    :goto_9b
    throw v1
.end method

.method private static startProcess(Lcom/genymobile/scrcpy/CleanUp$Config;)V
    .registers 5
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 118
    new-instance v0, Ljava/lang/ProcessBuilder;

    const-class v1, Lcom/genymobile/scrcpy/CleanUp;

    invoke-virtual {v1}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->toBase64()Ljava/lang/String;

    move-result-object p0

    const-string v2, "app_process"

    const-string v3, "/"

    filled-new-array {v2, v3, v1, p0}, [Ljava/lang/String;

    move-result-object p0

    invoke-direct {v0, p0}, Ljava/lang/ProcessBuilder;-><init>([Ljava/lang/String;)V

    .line 119
    invoke-virtual {v0}, Ljava/lang/ProcessBuilder;->environment()Ljava/util/Map;

    move-result-object p0

    const-string v1, "CLASSPATH"

    const-string v2, "/data/local/tmp/scrcpy-server.jar"

    invoke-interface {p0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 120
    invoke-virtual {v0}, Ljava/lang/ProcessBuilder;->start()Ljava/lang/Process;

    .line 121
    return-void
.end method

.method private static unlinkSelf()V
    .registers 2

    .line 125
    :try_start_0
    new-instance v0, Ljava/io/File;

    const-string v1, "/data/local/tmp/scrcpy-server.jar"

    invoke-direct {v0, v1}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0}, Ljava/io/File;->delete()Z
    :try_end_a
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_a} :catch_b

    .line 128
    goto :goto_11

    .line 126
    :catch_b
    move-exception v0

    .line 127
    const-string v1, "Could not unlink server"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 129
    :goto_11
    return-void
.end method
