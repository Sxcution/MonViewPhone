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
    .registers 5

    .line 5
    new-instance v0, Ljava/lang/StackTraceElement;

    const/4 v1, 0x0

    const/4 v2, -0x1

    const-string v3, "<unknown class>"

    const-string v4, "<unknown method>"

    invoke-direct {v0, v3, v4, v1, v2}, Ljava/lang/StackTraceElement;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;I)V

    sput-object v0, Luk/uuid/slf4j/android/CallerStackTrace;->UNKNOWN:Ljava/lang/StackTraceElement;

    return-void
.end method

.method public constructor <init>(I)V
    .registers 3

    .line 9
    invoke-direct {p0}, Ljava/lang/Throwable;-><init>()V

    .line 12
    :try_start_3
    invoke-virtual {p0}, Luk/uuid/slf4j/android/CallerStackTrace;->getStackTrace()[Ljava/lang/StackTraceElement;

    move-result-object v0

    aget-object p1, v0, p1
    :try_end_9
    .catch Ljava/lang/ArrayIndexOutOfBoundsException; {:try_start_3 .. :try_end_9} :catch_a

    .line 15
    goto :goto_d

    .line 13
    :catch_a
    move-exception p1

    .line 14
    sget-object p1, Luk/uuid/slf4j/android/CallerStackTrace;->UNKNOWN:Ljava/lang/StackTraceElement;

    .line 16
    :goto_d
    iput-object p1, p0, Luk/uuid/slf4j/android/CallerStackTrace;->stackFrame:Ljava/lang/StackTraceElement;

    .line 17
    return-void
.end method


# virtual methods
.method public final get()Ljava/lang/StackTraceElement;
    .registers 2

    .line 20
    iget-object v0, p0, Luk/uuid/slf4j/android/CallerStackTrace;->stackFrame:Ljava/lang/StackTraceElement;

    return-object v0
.end method

.method public final toString()Ljava/lang/String;
    .registers 2

    .line 25
    iget-object v0, p0, Luk/uuid/slf4j/android/CallerStackTrace;->stackFrame:Ljava/lang/StackTraceElement;

    invoke-virtual {v0}, Ljava/lang/StackTraceElement;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method
