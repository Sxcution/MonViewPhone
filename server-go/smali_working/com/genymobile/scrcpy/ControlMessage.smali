.class public final Lcom/genymobile/scrcpy/ControlMessage;
.super Ljava/lang/Object;
.source "ControlMessage.java"


# static fields
.field public static final PUSH_STATE_APPEND:I = 0x2

.field public static final PUSH_STATE_CANCEL:I = 0x4

.field public static final PUSH_STATE_FINISH:I = 0x3

.field public static final PUSH_STATE_NEW:I = 0x0

.field public static final PUSH_STATE_START:I = 0x1

.field public static final TYPE_BACK_OR_SCREEN_ON:I = 0x4

.field public static final TYPE_CHANGE_STREAM_PARAMETERS:I = 0x65

.field public static final TYPE_COLLAPSE_PANELS:I = 0x7

.field public static final TYPE_EXPAND_NOTIFICATION_PANEL:I = 0x5

.field public static final TYPE_EXPAND_SETTINGS_PANEL:I = 0x6

.field public static final TYPE_GET_CLIPBOARD:I = 0x8

.field public static final TYPE_INJECT_KEYCODE:I = 0x0

.field public static final TYPE_INJECT_SCROLL_EVENT:I = 0x3

.field public static final TYPE_INJECT_TEXT:I = 0x1

.field public static final TYPE_INJECT_TOUCH_EVENT:I = 0x2

.field public static final TYPE_PUSH_FILE:I = 0x66

.field public static final TYPE_ROTATE_DEVICE:I = 0xb

.field public static final TYPE_SET_CLIPBOARD:I = 0x9

.field public static final TYPE_SET_SCREEN_POWER_MODE:I = 0xa


# instance fields
.field private action:I

.field private buttons:I

.field private bytes:[B

.field private fileName:Ljava/lang/String;

.field private fileSize:I

.field private hScroll:I

.field private keycode:I

.field private metaState:I

.field private paste:Z

.field private pointerId:J

.field private position:Lcom/genymobile/scrcpy/Position;

.field private pressure:F

.field private pushChunk:[B

.field private pushChunkSize:I

.field private pushId:S

.field private pushState:I

.field private repeat:I

.field private text:Ljava/lang/String;

.field private type:I

.field private vScroll:I

.field private videoSettings:Lcom/genymobile/scrcpy/VideoSettings;


# direct methods
.method private constructor <init>()V
    .registers 1

    .line 54
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method public static createBackOrScreenOn(I)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 3

    .line 95
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    const/4 v1, 0x4

    .line 96
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 97
    iput p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->action:I

    return-object v0
.end method

.method public static createChangeSteamParameters([B)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 3

    .line 120
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    const/16 v1, 0x65

    .line 121
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 122
    invoke-static {p0}, Lcom/genymobile/scrcpy/VideoSettings;->fromByteArray([B)Lcom/genymobile/scrcpy/VideoSettings;

    move-result-object p0

    iput-object p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    return-object v0
.end method

.method public static createEmpty(I)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 2

    .line 164
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 165
    iput p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    return-object v0
.end method

.method public static createFilePush([B)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 7

    .line 127
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    const/16 v1, 0x66

    .line 128
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 129
    invoke-static {p0}, Ljava/nio/ByteBuffer;->wrap([B)Ljava/nio/ByteBuffer;

    move-result-object p0

    .line 130
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v1

    iput-short v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushId:S

    .line 131
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->get()B

    move-result v1

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushState:I

    if-eqz v1, :cond_6f

    const/4 v2, 0x1

    const/4 v3, 0x0

    if-eq v1, v2, :cond_57

    const/4 v2, 0x2

    const/4 v4, 0x4

    if-eq v1, v2, :cond_40

    const/4 p0, 0x3

    if-eq v1, p0, :cond_6f

    if-eq v1, v4, :cond_6f

    .line 157
    new-instance p0, Ljava/lang/StringBuilder;

    invoke-direct {p0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Unknown push event state: "

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    iget v0, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushState:I

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    const/4 p0, 0x0

    return-object p0

    .line 141
    :cond_40
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    .line 142
    new-array v2, v1, [B

    .line 143
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v5

    if-lt v5, v1, :cond_54

    .line 144
    invoke-virtual {p0, v2, v3, v1}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 145
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushChunkSize:I

    .line 146
    iput-object v2, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushChunk:[B

    goto :goto_6f

    .line 148
    :cond_54
    iput v4, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushState:I

    goto :goto_6f

    .line 134
    :cond_57
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->fileSize:I

    .line 135
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v1

    .line 136
    new-array v2, v1, [B

    .line 137
    invoke-virtual {p0, v2, v3, v1}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 138
    new-instance p0, Ljava/lang/String;

    sget-object v4, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-direct {p0, v2, v3, v1, v4}, Ljava/lang/String;-><init>([BIILjava/nio/charset/Charset;)V

    iput-object p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->fileName:Ljava/lang/String;

    :cond_6f
    :goto_6f
    return-object v0
.end method

.method public static createInjectKeycode(IIII)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 6

    .line 58
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    const/4 v1, 0x0

    .line 59
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 60
    iput p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->action:I

    .line 61
    iput p1, v0, Lcom/genymobile/scrcpy/ControlMessage;->keycode:I

    .line 62
    iput p2, v0, Lcom/genymobile/scrcpy/ControlMessage;->repeat:I

    .line 63
    iput p3, v0, Lcom/genymobile/scrcpy/ControlMessage;->metaState:I

    return-object v0
.end method

.method public static createInjectScrollEvent(Lcom/genymobile/scrcpy/Position;II)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 5

    .line 86
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    const/4 v1, 0x3

    .line 87
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 88
    iput-object p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->position:Lcom/genymobile/scrcpy/Position;

    .line 89
    iput p1, v0, Lcom/genymobile/scrcpy/ControlMessage;->hScroll:I

    .line 90
    iput p2, v0, Lcom/genymobile/scrcpy/ControlMessage;->vScroll:I

    return-object v0
.end method

.method public static createInjectText(Ljava/lang/String;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 3

    .line 68
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    const/4 v1, 0x1

    .line 69
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 70
    iput-object p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->text:Ljava/lang/String;

    return-object v0
.end method

.method public static createInjectTouchEvent(IJLcom/genymobile/scrcpy/Position;FI)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 8

    .line 75
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    const/4 v1, 0x2

    .line 76
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 77
    iput p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->action:I

    .line 78
    iput-wide p1, v0, Lcom/genymobile/scrcpy/ControlMessage;->pointerId:J

    .line 79
    iput p4, v0, Lcom/genymobile/scrcpy/ControlMessage;->pressure:F

    .line 80
    iput-object p3, v0, Lcom/genymobile/scrcpy/ControlMessage;->position:Lcom/genymobile/scrcpy/Position;

    .line 81
    iput p5, v0, Lcom/genymobile/scrcpy/ControlMessage;->buttons:I

    return-object v0
.end method

.method public static createSetClipboard(Ljava/lang/String;Z)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 4

    .line 102
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    const/16 v1, 0x9

    .line 103
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 104
    iput-object p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->text:Ljava/lang/String;

    .line 105
    iput-boolean p1, v0, Lcom/genymobile/scrcpy/ControlMessage;->paste:Z

    return-object v0
.end method

.method public static createSetScreenPowerMode(I)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 3

    .line 113
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    const/16 v1, 0xa

    .line 114
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 115
    iput p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->action:I

    return-object v0
.end method


# virtual methods
.method public getAction()I
    .registers 2

    .line 182
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->action:I

    return v0
.end method

.method public getButtons()I
    .registers 2

    .line 190
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->buttons:I

    return v0
.end method

.method public getBytes()[B
    .registers 2

    .line 222
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->bytes:[B

    return-object v0
.end method

.method public getFileName()Ljava/lang/String;
    .registers 2

    .line 242
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->fileName:Ljava/lang/String;

    return-object v0
.end method

.method public getFileSize()I
    .registers 2

    .line 246
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->fileSize:I

    return v0
.end method

.method public getHScroll()I
    .registers 2

    .line 206
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->hScroll:I

    return v0
.end method

.method public getKeycode()I
    .registers 2

    .line 186
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->keycode:I

    return v0
.end method

.method public getMetaState()I
    .registers 2

    .line 178
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->metaState:I

    return v0
.end method

.method public getPaste()Z
    .registers 2

    .line 214
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->paste:Z

    return v0
.end method

.method public getPointerId()J
    .registers 3

    .line 194
    iget-wide v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pointerId:J

    return-wide v0
.end method

.method public getPosition()Lcom/genymobile/scrcpy/Position;
    .registers 2

    .line 202
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->position:Lcom/genymobile/scrcpy/Position;

    return-object v0
.end method

.method public getPressure()F
    .registers 2

    .line 198
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pressure:F

    return v0
.end method

.method public getPushChunk()[B
    .registers 2

    .line 234
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pushChunk:[B

    return-object v0
.end method

.method public getPushChunkSize()I
    .registers 2

    .line 238
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pushChunkSize:I

    return v0
.end method

.method public getPushId()S
    .registers 2

    .line 226
    iget-short v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pushId:S

    return v0
.end method

.method public getPushState()I
    .registers 2

    .line 230
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pushState:I

    return v0
.end method

.method public getRepeat()I
    .registers 2

    .line 218
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->repeat:I

    return v0
.end method

.method public getText()Ljava/lang/String;
    .registers 2

    .line 174
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->text:Ljava/lang/String;

    return-object v0
.end method

.method public getType()I
    .registers 2

    .line 170
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    return v0
.end method

.method public getVScroll()I
    .registers 2

    .line 210
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->vScroll:I

    return v0
.end method

.method public getVideoSettings()Lcom/genymobile/scrcpy/VideoSettings;
    .registers 2

    .line 250
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    return-object v0
.end method
