.class final Luk/uuid/slf4j/android/CallerStackTrace;
.super Ljava/lang/Throwable;
.source "CallerStackTrace.java"


# static fields
.field private static final UNKNOWN:Ljava/lang/StackTraceElement;

.field private static final serialVersionUID:J = 0x1L


# instance fields
.field private final stackFrame:Ljava/lang/StackTraceElement;


# direct methods
.method static constructor <clinit>()V
    .locals 5

    .line 27
    new-instance v0, Ljava/lang/StackTraceElement;

    const-string v1, "<unknown class>"

    const-string v2, "<unknown method>"

    const/4 v3, 0x0

    const/4 v4, -0x1

    invoke-direct {v0, v1, v2, v3, v4}, Ljava/lang/StackTraceElement;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;I)V

    sput-object v0, Luk/uuid/slf4j/android/CallerStackTrace;->UNKNOWN:Ljava/lang/StackTraceElement;

    return-void
.end method

.method public constructor <init>(I)V
    .locals 1

    .line 30
    invoke-direct {p0}, Ljava/lang/Throwable;-><init>()V

    .line 33
    :try_start_0
    invoke-virtual {p0}, Luk/uuid/slf4j/android/CallerStackTrace;->getStackTrace()[Ljava/lang/StackTraceElement;

    move-result-object v0

    aget-object p1, v0, p1
    :try_end_0
    .catch Ljava/lang/ArrayIndexOutOfBoundsException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    .line 35
    :catch_0
    sget-object p1, Luk/uuid/slf4j/android/CallerStackTrace;->UNKNOWN:Ljava/lang/StackTraceElement;

    .line 37
    :goto_0
    iput-object p1, p0, Luk/uuid/slf4j/android/CallerStackTrace;->stackFrame:Ljava/lang/StackTraceElement;

    return-void
.end method


# virtual methods
.method public final get()Ljava/lang/StackTraceElement;
    .locals 1

    .line 41
    iget-object v0, p0, Luk/uuid/slf4j/android/CallerStackTrace;->stackFrame:Ljava/lang/StackTraceElement;

    return-object v0
.end method

.method public final toString()Ljava/lang/String;
    .locals 1

    .line 46
    iget-object v0, p0, Luk/uuid/slf4j/android/CallerStackTrace;->stackFrame:Ljava/lang/StackTraceElement;

    invoke-virtual {v0}, Ljava/lang/StackTraceElement;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
