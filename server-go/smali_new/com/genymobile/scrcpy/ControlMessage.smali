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

    .line 49
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 50
    return-void
.end method

.method public static createBackOrScreenOn(I)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 3

    .line 90
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 91
    const/4 v1, 0x4

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 92
    iput p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->action:I

    .line 93
    return-object v0
.end method

.method public static createChangeSteamParameters([B)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 3

    .line 112
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 113
    const/16 v1, 0x65

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 114
    invoke-static {p0}, Lcom/genymobile/scrcpy/VideoSettings;->fromByteArray([B)Lcom/genymobile/scrcpy/VideoSettings;

    move-result-object p0

    iput-object p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    .line 115
    return-object v0
.end method

.method public static createEmpty(I)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 2

    .line 151
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 152
    iput p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 153
    return-object v0
.end method

.method public static createFilePush([B)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 7

    .line 119
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 120
    const/16 v1, 0x66

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 121
    invoke-static {p0}, Ljava/nio/ByteBuffer;->wrap([B)Ljava/nio/ByteBuffer;

    move-result-object p0

    .line 122
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v1

    iput-short v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushId:S

    .line 123
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->get()B

    move-result v1

    .line 124
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushState:I

    .line 125
    if-eqz v1, :cond_73

    .line 126
    const/4 v2, 0x1

    const/4 v3, 0x0

    if-ne v1, v2, :cond_38

    .line 127
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->fileSize:I

    .line 128
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getShort()S

    move-result v1

    .line 129
    new-array v2, v1, [B

    .line 130
    invoke-virtual {p0, v2, v3, v1}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 131
    new-instance p0, Ljava/lang/String;

    sget-object v4, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-direct {p0, v2, v3, v1, v4}, Ljava/lang/String;-><init>([BIILjava/nio/charset/Charset;)V

    iput-object p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->fileName:Ljava/lang/String;

    .line 132
    goto :goto_73

    :cond_38
    const/4 v2, 0x2

    const/4 v4, 0x4

    if-ne v1, v2, :cond_53

    .line 133
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->getInt()I

    move-result v1

    .line 134
    new-array v2, v1, [B

    .line 135
    invoke-virtual {p0}, Ljava/nio/ByteBuffer;->remaining()I

    move-result v5

    if-lt v5, v1, :cond_50

    .line 136
    invoke-virtual {p0, v2, v3, v1}, Ljava/nio/ByteBuffer;->get([BII)Ljava/nio/ByteBuffer;

    .line 137
    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushChunkSize:I

    .line 138
    iput-object v2, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushChunk:[B

    goto :goto_72

    .line 140
    :cond_50
    iput v4, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushState:I

    goto :goto_72

    .line 142
    :cond_53
    const/4 p0, 0x3

    if-eq v1, p0, :cond_72

    if-eq v1, v4, :cond_72

    .line 143
    new-instance p0, Ljava/lang/StringBuilder;

    invoke-direct {p0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "Unknown push event state: "

    invoke-virtual {p0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p0

    iget v0, v0, Lcom/genymobile/scrcpy/ControlMessage;->pushState:I

    invoke-virtual {p0, v0}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-static {p0}, Lcom/genymobile/scrcpy/Ln;->w(Ljava/lang/String;)V

    .line 144
    const/4 p0, 0x0

    return-object p0

    .line 142
    :cond_72
    :goto_72
    nop

    .line 147
    :cond_73
    :goto_73
    return-object v0
.end method

.method public static createInjectKeycode(IIII)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 6

    .line 53
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 54
    const/4 v1, 0x0

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 55
    iput p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->action:I

    .line 56
    iput p1, v0, Lcom/genymobile/scrcpy/ControlMessage;->keycode:I

    .line 57
    iput p2, v0, Lcom/genymobile/scrcpy/ControlMessage;->repeat:I

    .line 58
    iput p3, v0, Lcom/genymobile/scrcpy/ControlMessage;->metaState:I

    .line 59
    return-object v0
.end method

.method public static createInjectScrollEvent(Lcom/genymobile/scrcpy/Position;II)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 5

    .line 81
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 82
    const/4 v1, 0x3

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 83
    iput-object p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->position:Lcom/genymobile/scrcpy/Position;

    .line 84
    iput p1, v0, Lcom/genymobile/scrcpy/ControlMessage;->hScroll:I

    .line 85
    iput p2, v0, Lcom/genymobile/scrcpy/ControlMessage;->vScroll:I

    .line 86
    return-object v0
.end method

.method public static createInjectText(Ljava/lang/String;)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 3

    .line 63
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 64
    const/4 v1, 0x1

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 65
    iput-object p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->text:Ljava/lang/String;

    .line 66
    return-object v0
.end method

.method public static createInjectTouchEvent(IJLcom/genymobile/scrcpy/Position;FI)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 8

    .line 70
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 71
    const/4 v1, 0x2

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 72
    iput p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->action:I

    .line 73
    iput-wide p1, v0, Lcom/genymobile/scrcpy/ControlMessage;->pointerId:J

    .line 74
    iput p4, v0, Lcom/genymobile/scrcpy/ControlMessage;->pressure:F

    .line 75
    iput-object p3, v0, Lcom/genymobile/scrcpy/ControlMessage;->position:Lcom/genymobile/scrcpy/Position;

    .line 76
    iput p5, v0, Lcom/genymobile/scrcpy/ControlMessage;->buttons:I

    .line 77
    return-object v0
.end method

.method public static createSetClipboard(Ljava/lang/String;Z)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 4

    .line 97
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 98
    const/16 v1, 0x9

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 99
    iput-object p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->text:Ljava/lang/String;

    .line 100
    iput-boolean p1, v0, Lcom/genymobile/scrcpy/ControlMessage;->paste:Z

    .line 101
    return-object v0
.end method

.method public static createSetScreenPowerMode(I)Lcom/genymobile/scrcpy/ControlMessage;
    .registers 3

    .line 105
    new-instance v0, Lcom/genymobile/scrcpy/ControlMessage;

    invoke-direct {v0}, Lcom/genymobile/scrcpy/ControlMessage;-><init>()V

    .line 106
    const/16 v1, 0xa

    iput v1, v0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    .line 107
    iput p0, v0, Lcom/genymobile/scrcpy/ControlMessage;->action:I

    .line 108
    return-object v0
.end method


# virtual methods
.method public getAction()I
    .registers 2

    .line 169
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->action:I

    return v0
.end method

.method public getButtons()I
    .registers 2

    .line 177
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->buttons:I

    return v0
.end method

.method public getBytes()[B
    .registers 2

    .line 209
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->bytes:[B

    return-object v0
.end method

.method public getFileName()Ljava/lang/String;
    .registers 2

    .line 229
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->fileName:Ljava/lang/String;

    return-object v0
.end method

.method public getFileSize()I
    .registers 2

    .line 233
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->fileSize:I

    return v0
.end method

.method public getHScroll()I
    .registers 2

    .line 193
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->hScroll:I

    return v0
.end method

.method public getKeycode()I
    .registers 2

    .line 173
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->keycode:I

    return v0
.end method

.method public getMetaState()I
    .registers 2

    .line 165
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->metaState:I

    return v0
.end method

.method public getPaste()Z
    .registers 2

    .line 201
    iget-boolean v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->paste:Z

    return v0
.end method

.method public getPointerId()J
    .registers 3

    .line 181
    iget-wide v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pointerId:J

    return-wide v0
.end method

.method public getPosition()Lcom/genymobile/scrcpy/Position;
    .registers 2

    .line 189
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->position:Lcom/genymobile/scrcpy/Position;

    return-object v0
.end method

.method public getPressure()F
    .registers 2

    .line 185
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pressure:F

    return v0
.end method

.method public getPushChunk()[B
    .registers 2

    .line 221
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pushChunk:[B

    return-object v0
.end method

.method public getPushChunkSize()I
    .registers 2

    .line 225
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pushChunkSize:I

    return v0
.end method

.method public getPushId()S
    .registers 2

    .line 213
    iget-short v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pushId:S

    return v0
.end method

.method public getPushState()I
    .registers 2

    .line 217
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->pushState:I

    return v0
.end method

.method public getRepeat()I
    .registers 2

    .line 205
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->repeat:I

    return v0
.end method

.method public getText()Ljava/lang/String;
    .registers 2

    .line 161
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->text:Ljava/lang/String;

    return-object v0
.end method

.method public getType()I
    .registers 2

    .line 157
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->type:I

    return v0
.end method

.method public getVScroll()I
    .registers 2

    .line 197
    iget v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->vScroll:I

    return v0
.end method

.method public getVideoSettings()Lcom/genymobile/scrcpy/VideoSettings;
    .registers 2

    .line 237
    iget-object v0, p0, Lcom/genymobile/scrcpy/ControlMessage;->videoSettings:Lcom/genymobile/scrcpy/VideoSettings;

    return-object v0
.end method
