.class final enum Lcom/genymobile/scrcpy/Ln$Level;
.super Ljava/lang/Enum;
.source "Ln.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/genymobile/scrcpy/Ln;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x4018
    name = "Level"
.end annotation

.annotation system Ldalvik/annotation/Signature;
    value = {
        "Ljava/lang/Enum<",
        "Lcom/genymobile/scrcpy/Ln$Level;",
        ">;"
    }
.end annotation


# static fields
.field private static final synthetic $VALUES:[Lcom/genymobile/scrcpy/Ln$Level;

.field public static final enum DEBUG:Lcom/genymobile/scrcpy/Ln$Level;

.field public static final enum ERROR:Lcom/genymobile/scrcpy/Ln$Level;

.field public static final enum INFO:Lcom/genymobile/scrcpy/Ln$Level;

.field public static final enum VERBOSE:Lcom/genymobile/scrcpy/Ln$Level;

.field public static final enum WARN:Lcom/genymobile/scrcpy/Ln$Level;


# direct methods
.method private static synthetic $values()[Lcom/genymobile/scrcpy/Ln$Level;
    .registers 3

    .line 11
    const/4 v0, 0x5

    new-array v0, v0, [Lcom/genymobile/scrcpy/Ln$Level;

    sget-object v1, Lcom/genymobile/scrcpy/Ln$Level;->VERBOSE:Lcom/genymobile/scrcpy/Ln$Level;

    const/4 v2, 0x0

    aput-object v1, v0, v2

    sget-object v1, Lcom/genymobile/scrcpy/Ln$Level;->DEBUG:Lcom/genymobile/scrcpy/Ln$Level;

    const/4 v2, 0x1

    aput-object v1, v0, v2

    sget-object v1, Lcom/genymobile/scrcpy/Ln$Level;->INFO:Lcom/genymobile/scrcpy/Ln$Level;

    const/4 v2, 0x2

    aput-object v1, v0, v2

    sget-object v1, Lcom/genymobile/scrcpy/Ln$Level;->WARN:Lcom/genymobile/scrcpy/Ln$Level;

    const/4 v2, 0x3

    aput-object v1, v0, v2

    sget-object v1, Lcom/genymobile/scrcpy/Ln$Level;->ERROR:Lcom/genymobile/scrcpy/Ln$Level;

    const/4 v2, 0x4

    aput-object v1, v0, v2

    return-object v0
.end method

.method static constructor <clinit>()V
    .registers 3

    .line 12
    new-instance v0, Lcom/genymobile/scrcpy/Ln$Level;

    const-string v1, "VERBOSE"

    const/4 v2, 0x0

    invoke-direct {v0, v1, v2}, Lcom/genymobile/scrcpy/Ln$Level;-><init>(Ljava/lang/String;I)V

    sput-object v0, Lcom/genymobile/scrcpy/Ln$Level;->VERBOSE:Lcom/genymobile/scrcpy/Ln$Level;

    .line 13
    new-instance v0, Lcom/genymobile/scrcpy/Ln$Level;

    const-string v1, "DEBUG"

    const/4 v2, 0x1

    invoke-direct {v0, v1, v2}, Lcom/genymobile/scrcpy/Ln$Level;-><init>(Ljava/lang/String;I)V

    sput-object v0, Lcom/genymobile/scrcpy/Ln$Level;->DEBUG:Lcom/genymobile/scrcpy/Ln$Level;

    .line 14
    new-instance v0, Lcom/genymobile/scrcpy/Ln$Level;

    const-string v1, "INFO"

    const/4 v2, 0x2

    invoke-direct {v0, v1, v2}, Lcom/genymobile/scrcpy/Ln$Level;-><init>(Ljava/lang/String;I)V

    sput-object v0, Lcom/genymobile/scrcpy/Ln$Level;->INFO:Lcom/genymobile/scrcpy/Ln$Level;

    .line 15
    new-instance v0, Lcom/genymobile/scrcpy/Ln$Level;

    const-string v1, "WARN"

    const/4 v2, 0x3

    invoke-direct {v0, v1, v2}, Lcom/genymobile/scrcpy/Ln$Level;-><init>(Ljava/lang/String;I)V

    sput-object v0, Lcom/genymobile/scrcpy/Ln$Level;->WARN:Lcom/genymobile/scrcpy/Ln$Level;

    .line 16
    new-instance v0, Lcom/genymobile/scrcpy/Ln$Level;

    const-string v1, "ERROR"

    const/4 v2, 0x4

    invoke-direct {v0, v1, v2}, Lcom/genymobile/scrcpy/Ln$Level;-><init>(Ljava/lang/String;I)V

    sput-object v0, Lcom/genymobile/scrcpy/Ln$Level;->ERROR:Lcom/genymobile/scrcpy/Ln$Level;

    .line 11
    invoke-static {}, Lcom/genymobile/scrcpy/Ln$Level;->$values()[Lcom/genymobile/scrcpy/Ln$Level;

    move-result-object v0

    sput-object v0, Lcom/genymobile/scrcpy/Ln$Level;->$VALUES:[Lcom/genymobile/scrcpy/Ln$Level;

    return-void
.end method

.method private constructor <init>(Ljava/lang/String;I)V
    .registers 3
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 11
    invoke-direct {p0, p1, p2}, Ljava/lang/Enum;-><init>(Ljava/lang/String;I)V

    return-void
.end method

.method public static valueOf(Ljava/lang/String;)Lcom/genymobile/scrcpy/Ln$Level;
    .registers 2

    .line 11
    const-class v0, Lcom/genymobile/scrcpy/Ln$Level;

    invoke-static {v0, p0}, Ljava/lang/Enum;->valueOf(Ljava/lang/Class;Ljava/lang/String;)Ljava/lang/Enum;

    move-result-object p0

    check-cast p0, Lcom/genymobile/scrcpy/Ln$Level;

    return-object p0
.end method

.method public static values()[Lcom/genymobile/scrcpy/Ln$Level;
    .registers 1

    .line 11
    sget-object v0, Lcom/genymobile/scrcpy/Ln$Level;->$VALUES:[Lcom/genymobile/scrcpy/Ln$Level;

    invoke-virtual {v0}, [Lcom/genymobile/scrcpy/Ln$Level;->clone()Ljava/lang/Object;

    move-result-object v0

    check-cast v0, [Lcom/genymobile/scrcpy/Ln$Level;

    return-object v0
.end method
