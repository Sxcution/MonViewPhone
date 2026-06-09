.class Lcom/genymobile/scrcpy/wrappers/ClipboardManager$1;
.super Ljava/lang/Object;
.source "ClipboardManager.java"

# interfaces
.implements Landroid/content/ClipboardManager$OnPrimaryClipChangedListener;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Lcom/genymobile/scrcpy/wrappers/ClipboardManager;->addPrimaryClipChangedListener(Landroid/content/IOnPrimaryClipChangedListener;)Z
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

.field final synthetic val$listener:Landroid/content/IOnPrimaryClipChangedListener;


# direct methods
.method constructor <init>(Lcom/genymobile/scrcpy/wrappers/ClipboardManager;Landroid/content/IOnPrimaryClipChangedListener;)V
    .registers 3
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 261
    iput-object p1, p0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager$1;->this$0:Lcom/genymobile/scrcpy/wrappers/ClipboardManager;

    iput-object p2, p0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager$1;->val$listener:Landroid/content/IOnPrimaryClipChangedListener;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public onPrimaryClipChanged()V
    .registers 3

    .line 265
    :try_start_0
    iget-object v0, p0, Lcom/genymobile/scrcpy/wrappers/ClipboardManager$1;->val$listener:Landroid/content/IOnPrimaryClipChangedListener;

    invoke-interface {v0}, Landroid/content/IOnPrimaryClipChangedListener;->dispatchPrimaryClipChanged()V
    :try_end_5
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_5} :catch_6

    .line 268
    goto :goto_c

    .line 266
    :catch_6
    move-exception v0

    .line 267
    const-string v1, "Failed to dispatch primary clip changed"

    invoke-static {v1, v0}, Lcom/genymobile/scrcpy/Ln;->e(Ljava/lang/String;Ljava/lang/Throwable;)V

    .line 269
    :goto_c
    return-void
.end method
