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
    .locals 0

    .line 116
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method public static configure(IIZZZ)V
    .locals 1
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 122
    new-instance v0, Lcom/genymobile/scrcpy/CleanUp$Config;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/CleanUp$Config;-><init>()V

    .line 123
    invoke-static {v0, p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$002(Lcom/genymobile/scrcpy/CleanUp$Config;I)I

    .line 124
    invoke-static {v0, p2}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$102(Lcom/genymobile/scrcpy/CleanUp$Config;Z)Z

    .line 125
    invoke-static {v0, p1}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$202(Lcom/genymobile/scrcpy/CleanUp$Config;I)I

    .line 126
    invoke-static {v0, p3}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$302(Lcom/genymobile/scrcpy/CleanUp$Config;Z)Z

    .line 127
    invoke-static {v0, p4}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$402(Lcom/genymobile/scrcpy/CleanUp$Config;Z)Z

    .line 129
    invoke-static {v0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$500(Lcom/genymobile/scrcpy/CleanUp$Config;)Z

    move-result p0

    if-eqz p0, :cond_0

    .line 130
    invoke-static {v0}, Lcom/genymobile/scrcpy/CleanUp;->startProcess(Lcom/genymobile/scrcpy/CleanUp$Config;)V

    goto :goto_0

    .line 133
    :cond_0
    invoke-static {}, Lcom/genymobile/scrcpy/CleanUp;->unlinkSelf()V

    :goto_0
    return-void
.end method

.method public static varargs main([Ljava/lang/String;)V
    .locals 5

    .line 154
    invoke-static {}, Lcom/genymobile/scrcpy/CleanUp;->unlinkSelf()V

    .line 158
    :try_start_0
    sget-object v0, Ljava/lang/System;->in:Ljava/io/InputStream;

    invoke-virtual {v0}, Ljava/io/InputStream;->read()I
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    nop

    :goto_0
    const-string v0, "Cleaning up"

    .line 163
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    const/4 v0, 0x0

    .line 165
    aget-object p0, p0, v0

    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->fromBase64(Ljava/lang/String;)Lcom/genymobile/scrcpy/CleanUp$Config;

    move-result-object p0

    .line 167
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$100(Lcom/genymobile/scrcpy/CleanUp$Config;)Z

    move-result v0

    const/4 v1, -0x1

    if-nez v0, :cond_0

    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$200(Lcom/genymobile/scrcpy/CleanUp$Config;)I

    move-result v0

    if-eq v0, v1, :cond_3

    .line 168
    :cond_0
    new-instance v0, Lcom/genymobile/scrcpy/wrappers/ServiceManager;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;-><init>()V

    .line 169
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ServiceManager;->getActivityManager()Lcom/genymobile/scrcpy/wrappers/ActivityManager;

    move-result-object v0

    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ActivityManager;->createSettingsProvider()Lcom/genymobile/scrcpy/wrappers/ContentProvider;

    move-result-object v0

    .line 170
    :try_start_1
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$100(Lcom/genymobile/scrcpy/CleanUp$Config;)Z

    move-result v2

    if-eqz v2, :cond_1

    const-string v2, "Disabling \"show touches\""

    .line 171
    invoke-static {v2}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    const-string v2, "system"

    const-string v3, "show_touches"

    const-string v4, "0"

    .line 172
    invoke-virtual {v0, v2, v3, v4}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->putValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V

    .line 174
    :cond_1
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$200(Lcom/genymobile/scrcpy/CleanUp$Config;)I

    move-result v2

    if-eq v2, v1, :cond_2

    const-string v1, "Restoring \"stay awake\""

    .line 175
    invoke-static {v1}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    const-string v1, "global"

    const-string v2, "stay_on_while_plugged_in"

    .line 176
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$200(Lcom/genymobile/scrcpy/CleanUp$Config;)I

    move-result v3

    invoke-static {v3}, Ljava/lang/String;->valueOf(I)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v0, v1, v2, v3}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->putValue(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    :cond_2
    if-eqz v0, :cond_3

    .line 178
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->close()V

    .line 181
    :cond_3
    invoke-static {}, Lcom/genymobile/scrcpy/Device;->isScreenOn()Z

    move-result v0

    if-eqz v0, :cond_5

    .line 182
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$400(Lcom/genymobile/scrcpy/CleanUp$Config;)Z

    move-result v0

    if-eqz v0, :cond_4

    const-string v0, "Power off screen"

    .line 183
    invoke-static {v0}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    .line 184
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$000(Lcom/genymobile/scrcpy/CleanUp$Config;)I

    move-result p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Device;->powerOffScreen(I)Z

    goto :goto_1

    .line 185
    :cond_4
    invoke-static {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->access$300(Lcom/genymobile/scrcpy/CleanUp$Config;)Z

    move-result p0

    if-eqz p0, :cond_5

    const-string p0, "Restoring normal power mode"

    .line 186
    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->i(Ljava/lang/String;)V

    const/4 p0, 0x2

    .line 187
    invoke-static {p0}, Lcom/genymobile/scrcpy/Device;->setScreenPowerMode(I)Z

    :cond_5
    :goto_1
    return-void

    :catchall_0
    move-exception p0

    .line 169
    :try_start_2
    throw p0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_1

    :catchall_1
    move-exception v1

    if-eqz v0, :cond_6

    .line 178
    :try_start_3
    invoke-virtual {v0}, Lcom/genymobile/scrcpy/wrappers/ContentProvider;->close()V
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_2

    goto :goto_2

    :catchall_2
    move-exception v0

    invoke-virtual {p0, v0}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :cond_6
    :goto_2
    throw v1
.end method

.method private static startProcess(Lcom/genymobile/scrcpy/CleanUp$Config;)V
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    const/4 v0, 0x4

    new-array v0, v0, [Ljava/lang/String;

    const/4 v1, 0x0

    const-string v2, "app_process"

    aput-object v2, v0, v1

    const/4 v1, 0x1

    const-string v2, "/"

    aput-object v2, v0, v1

    .line 138
    const-class v1, Lcom/genymobile/scrcpy/CleanUp;

    invoke-virtual {v1}, Ljava/lang/Class;->getName()Ljava/lang/String;

    move-result-object v1

    const/4 v2, 0x2

    aput-object v1, v0, v2

    invoke-virtual {p0}, Lcom/genymobile/scrcpy/CleanUp$Config;->toBase64()Ljava/lang/String;

    move-result-object p0

    const/4 v1, 0x3

    aput-object p0, v0, v1

    .line 140
    new-instance p0, Ljava/lang/ProcessBuilder;

    invoke-direct {p0, v0}, Ljava/lang/ProcessBuilder;-><init>([Ljava/lang/String;)V

    .line 141
    invoke-virtual {p0}, Ljava/lang/ProcessBuilder;->environment()Ljava/util/Map;

    move-result-object v0

    const-string v1, "CLASSPATH"

    const-string v2, "/data/local/tmp/scrcpy-server.jar"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 142
    invoke-virtual {p0}, Ljava/lang/ProcessBuilder;->start()Ljava/lang/Process;

    return-void
.end method

.method private static unlinkSelf()V
    .locals 2

    .line 147
    :try_start_0
    new-instance v0, Ljava/io/File;

    const-string v1, "/data/local/tmp/scrcpy-server.jar"

    invoke-direct {v0, v1}, Ljava/io/File;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0}, Ljava/io/File;->delete()Z
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    move-exception v0

    const-string v1, "Could not unlink server"

    .line 149
    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    :goto_0
    return-void
.end method
