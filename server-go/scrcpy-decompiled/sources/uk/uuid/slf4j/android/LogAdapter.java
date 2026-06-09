package uk.uuid.slf4j.android;

import android.util.Log;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.slf4j.Logger;
import org.slf4j.Marker;
import org.slf4j.helpers.FormattingTuple;
import org.slf4j.helpers.MessageFormatter;
import uk.uuid.slf4j.android.LoggerConfig;

/* JADX INFO: loaded from: classes.dex */
final class LogAdapter implements Logger {
    private static final int DIRECT_FRAMES = 2;
    private static final int FORMAT_FRAMES = 3;
    private static final ConcurrentMap<String, LogLevel> nativeLevelMap = new ConcurrentHashMap();
    private final boolean DEBUG;
    private final boolean ERROR;
    private final boolean INFO;
    private final boolean TRACE;
    private final boolean WARN;
    private final boolean complexRewriteMsg;
    private final String name;
    private final String prefixName;
    private final boolean showCaller;
    private final boolean showThread;
    private final String tag;

    LogAdapter(String str, LoggerConfig loggerConfig) {
        this.name = str;
        this.tag = loggerConfig.tag;
        if (loggerConfig.level == LogLevel.NATIVE) {
            loggerConfig.level = getNativeLogLevel();
        }
        boolean z = true;
        boolean z2 = loggerConfig.level == LogLevel.VERBOSE;
        this.TRACE = z2;
        boolean z3 = z2 || loggerConfig.level == LogLevel.DEBUG;
        this.DEBUG = z3;
        boolean z4 = z3 || loggerConfig.level == LogLevel.INFO;
        this.INFO = z4;
        boolean z5 = z4 || loggerConfig.level == LogLevel.WARN;
        this.WARN = z5;
        this.ERROR = z5 || loggerConfig.level == LogLevel.ERROR;
        int i = AnonymousClass1.$SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName[loggerConfig.showName.ordinal()];
        if (i == 1) {
            this.prefixName = null;
            this.showCaller = true;
        } else if (i == 2) {
            this.prefixName = str.concat(": ");
            this.showCaller = false;
        } else if (i == 3) {
            this.prefixName = getCompactName().concat(": ");
            this.showCaller = false;
        } else if (i == 4) {
            this.prefixName = str.substring(str.lastIndexOf(46) + 1).concat(": ");
            this.showCaller = false;
        } else {
            this.showCaller = false;
            this.prefixName = null;
        }
        boolean zBooleanValue = loggerConfig.showThread.booleanValue();
        this.showThread = zBooleanValue;
        if (!zBooleanValue && !this.showCaller) {
            z = false;
        }
        this.complexRewriteMsg = z;
    }

    /* JADX INFO: renamed from: uk.uuid.slf4j.android.LogAdapter$1, reason: invalid class name */
    static /* synthetic */ class AnonymousClass1 {
        static final /* synthetic */ int[] $SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName;

        static {
            int[] iArr = new int[LoggerConfig.ShowName.values().length];
            $SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName = iArr;
            try {
                iArr[LoggerConfig.ShowName.CALLER.ordinal()] = 1;
            } catch (NoSuchFieldError unused) {
            }
            try {
                $SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName[LoggerConfig.ShowName.LONG.ordinal()] = 2;
            } catch (NoSuchFieldError unused2) {
            }
            try {
                $SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName[LoggerConfig.ShowName.COMPACT.ordinal()] = 3;
            } catch (NoSuchFieldError unused3) {
            }
            try {
                $SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName[LoggerConfig.ShowName.SHORT.ordinal()] = 4;
            } catch (NoSuchFieldError unused4) {
            }
            try {
                $SwitchMap$uk$uuid$slf4j$android$LoggerConfig$ShowName[LoggerConfig.ShowName.FALSE.ordinal()] = 5;
            } catch (NoSuchFieldError unused5) {
            }
        }
    }

    private final LogLevel getNativeLogLevel() {
        LogLevel logLevel;
        LogLevel logLevel2 = nativeLevelMap.get(this.tag);
        if (logLevel2 != null) {
            return logLevel2;
        }
        if (Log.isLoggable(this.tag, 4)) {
            if (Log.isLoggable(this.tag, 3)) {
                if (Log.isLoggable(this.tag, 2)) {
                    logLevel = LogLevel.VERBOSE;
                } else {
                    logLevel = LogLevel.DEBUG;
                }
            } else {
                logLevel = LogLevel.INFO;
            }
        } else if (Log.isLoggable(this.tag, 5)) {
            logLevel = LogLevel.WARN;
        } else if (Log.isLoggable(this.tag, 6)) {
            logLevel = LogLevel.ERROR;
        } else {
            logLevel = LogLevel.SUPPRESS;
        }
        nativeLevelMap.put(this.tag, logLevel);
        return logLevel;
    }

    private final String getCompactName() {
        char[] charArray = this.name.toCharArray();
        int length = charArray.length;
        int i = 0;
        int i2 = 0;
        int i3 = 0;
        while (i < length) {
            if (charArray[i] == '.') {
                if (charArray[i3] != '.') {
                    i3++;
                }
                i2 = i3;
                int i4 = i + 1;
                i3 = (i4 >= length || charArray[i4] == '.') ? i2 : i2 + 1;
            }
            charArray[i2] = charArray[i];
            i++;
            i2++;
        }
        return new String(charArray, 0, i2);
    }

    @Override // org.slf4j.Logger
    public final String getName() {
        return this.name;
    }

    private final String rewriteMsg(String str, int i) {
        if (str == null) {
            str = "null";
        }
        if (this.complexRewriteMsg) {
            StringBuilder sb = new StringBuilder(str.length() + 64);
            if (this.showThread) {
                sb.append('[');
                sb.append(Thread.currentThread().getName());
                sb.append("] ");
            }
            if (this.showCaller) {
                sb.append(new CallerStackTrace(i).toString());
                sb.append(": ");
            } else {
                String str2 = this.prefixName;
                if (str2 != null) {
                    sb.append(str2);
                }
            }
            sb.append(str);
            return sb.toString();
        }
        String str3 = this.prefixName;
        return str3 != null ? str3.concat(str) : str;
    }

    @Override // org.slf4j.Logger
    public final boolean isTraceEnabled() {
        return this.TRACE;
    }

    private final void __trace(String str, Throwable th) {
        if (th == null) {
            Log.v(this.tag, str);
        } else {
            Log.v(this.tag, str, th);
        }
    }

    private final void __traceFormat(String str, Object... objArr) {
        FormattingTuple formattingTupleArrayFormat = MessageFormatter.arrayFormat(str, objArr);
        __trace(rewriteMsg(formattingTupleArrayFormat.getMessage(), 3), formattingTupleArrayFormat.getThrowable());
    }

    @Override // org.slf4j.Logger
    public final void trace(String str) {
        if (this.TRACE) {
            Log.v(this.tag, rewriteMsg(str, 2));
        }
    }

    @Override // org.slf4j.Logger
    public final void trace(String str, Object obj) {
        if (this.TRACE) {
            __traceFormat(str, obj);
        }
    }

    @Override // org.slf4j.Logger
    public final void trace(String str, Object obj, Object obj2) {
        if (this.TRACE) {
            __traceFormat(str, obj, obj2);
        }
    }

    @Override // org.slf4j.Logger
    public final void trace(String str, Object... objArr) {
        if (this.TRACE) {
            __traceFormat(str, objArr);
        }
    }

    @Override // org.slf4j.Logger
    public final void trace(String str, Throwable th) {
        if (this.TRACE) {
            __trace(rewriteMsg(str, 2), th);
        }
    }

    @Override // org.slf4j.Logger
    public final boolean isTraceEnabled(Marker marker) {
        return this.TRACE;
    }

    @Override // org.slf4j.Logger
    public final void trace(Marker marker, String str) {
        if (this.TRACE) {
            Log.v(this.tag, rewriteMsg(str, 2));
        }
    }

    @Override // org.slf4j.Logger
    public final void trace(Marker marker, String str, Object obj) {
        if (this.TRACE) {
            __traceFormat(str, obj);
        }
    }

    @Override // org.slf4j.Logger
    public final void trace(Marker marker, String str, Object obj, Object obj2) {
        if (this.TRACE) {
            __traceFormat(str, obj, obj2);
        }
    }

    @Override // org.slf4j.Logger
    public final void trace(Marker marker, String str, Object... objArr) {
        if (this.TRACE) {
            __traceFormat(str, objArr);
        }
    }

    @Override // org.slf4j.Logger
    public final void trace(Marker marker, String str, Throwable th) {
        if (this.TRACE) {
            __trace(rewriteMsg(str, 2), th);
        }
    }

    @Override // org.slf4j.Logger
    public final boolean isDebugEnabled() {
        return this.DEBUG;
    }

    private final void __debug(String str, Throwable th) {
        if (th == null) {
            Log.d(this.tag, str);
        } else {
            Log.d(this.tag, str, th);
        }
    }

    private final void __debugFormat(String str, Object... objArr) {
        FormattingTuple formattingTupleArrayFormat = MessageFormatter.arrayFormat(str, objArr);
        __debug(rewriteMsg(formattingTupleArrayFormat.getMessage(), 3), formattingTupleArrayFormat.getThrowable());
    }

    @Override // org.slf4j.Logger
    public final void debug(String str) {
        if (this.DEBUG) {
            Log.d(this.tag, rewriteMsg(str, 2));
        }
    }

    @Override // org.slf4j.Logger
    public final void debug(String str, Object obj) {
        if (this.DEBUG) {
            __debugFormat(str, obj);
        }
    }

    @Override // org.slf4j.Logger
    public final void debug(String str, Object obj, Object obj2) {
        if (this.DEBUG) {
            __debugFormat(str, obj, obj2);
        }
    }

    @Override // org.slf4j.Logger
    public final void debug(String str, Object... objArr) {
        if (this.DEBUG) {
            __debugFormat(str, objArr);
        }
    }

    @Override // org.slf4j.Logger
    public final void debug(String str, Throwable th) {
        if (this.DEBUG) {
            __debug(rewriteMsg(str, 2), th);
        }
    }

    @Override // org.slf4j.Logger
    public final boolean isDebugEnabled(Marker marker) {
        return this.DEBUG;
    }

    @Override // org.slf4j.Logger
    public final void debug(Marker marker, String str) {
        if (this.DEBUG) {
            Log.d(this.tag, rewriteMsg(str, 2));
        }
    }

    @Override // org.slf4j.Logger
    public final void debug(Marker marker, String str, Object obj) {
        if (this.DEBUG) {
            __debugFormat(str, obj);
        }
    }

    @Override // org.slf4j.Logger
    public final void debug(Marker marker, String str, Object obj, Object obj2) {
        if (this.DEBUG) {
            __debugFormat(str, obj, obj2);
        }
    }

    @Override // org.slf4j.Logger
    public final void debug(Marker marker, String str, Object... objArr) {
        if (this.DEBUG) {
            __debugFormat(str, objArr);
        }
    }

    @Override // org.slf4j.Logger
    public final void debug(Marker marker, String str, Throwable th) {
        if (this.DEBUG) {
            __debug(rewriteMsg(str, 2), th);
        }
    }

    @Override // org.slf4j.Logger
    public final boolean isInfoEnabled() {
        return this.INFO;
    }

    private final void __info(String str, Throwable th) {
        if (th == null) {
            Log.i(this.tag, str);
        } else {
            Log.i(this.tag, str, th);
        }
    }

    private final void __infoFormat(String str, Object... objArr) {
        FormattingTuple formattingTupleArrayFormat = MessageFormatter.arrayFormat(str, objArr);
        __info(rewriteMsg(formattingTupleArrayFormat.getMessage(), 3), formattingTupleArrayFormat.getThrowable());
    }

    @Override // org.slf4j.Logger
    public final void info(String str) {
        if (this.INFO) {
            Log.i(this.tag, rewriteMsg(str, 2));
        }
    }

    @Override // org.slf4j.Logger
    public final void info(String str, Object obj) {
        if (this.INFO) {
            __infoFormat(str, obj);
        }
    }

    @Override // org.slf4j.Logger
    public final void info(String str, Object obj, Object obj2) {
        if (this.INFO) {
            __infoFormat(str, obj, obj2);
        }
    }

    @Override // org.slf4j.Logger
    public final void info(String str, Object... objArr) {
        if (this.INFO) {
            __infoFormat(str, objArr);
        }
    }

    @Override // org.slf4j.Logger
    public final void info(String str, Throwable th) {
        if (this.INFO) {
            __info(rewriteMsg(str, 2), th);
        }
    }

    @Override // org.slf4j.Logger
    public final boolean isInfoEnabled(Marker marker) {
        return this.INFO;
    }

    @Override // org.slf4j.Logger
    public final void info(Marker marker, String str) {
        if (this.INFO) {
            Log.i(this.tag, rewriteMsg(str, 2));
        }
    }

    @Override // org.slf4j.Logger
    public final void info(Marker marker, String str, Object obj) {
        if (this.INFO) {
            __infoFormat(str, obj);
        }
    }

    @Override // org.slf4j.Logger
    public final void info(Marker marker, String str, Object obj, Object obj2) {
        if (this.INFO) {
            __infoFormat(str, obj, obj2);
        }
    }

    @Override // org.slf4j.Logger
    public final void info(Marker marker, String str, Object... objArr) {
        if (this.INFO) {
            __infoFormat(str, objArr);
        }
    }

    @Override // org.slf4j.Logger
    public final void info(Marker marker, String str, Throwable th) {
        if (this.INFO) {
            __info(rewriteMsg(str, 2), th);
        }
    }

    @Override // org.slf4j.Logger
    public final boolean isWarnEnabled() {
        return this.WARN;
    }

    private final void __warn(String str, Throwable th) {
        if (th == null) {
            Log.w(this.tag, str);
        } else {
            Log.w(this.tag, str, th);
        }
    }

    private final void __warnFormat(String str, Object... objArr) {
        FormattingTuple formattingTupleArrayFormat = MessageFormatter.arrayFormat(str, objArr);
        __warn(rewriteMsg(formattingTupleArrayFormat.getMessage(), 3), formattingTupleArrayFormat.getThrowable());
    }

    @Override // org.slf4j.Logger
    public final void warn(String str) {
        if (this.WARN) {
            Log.w(this.tag, rewriteMsg(str, 2));
        }
    }

    @Override // org.slf4j.Logger
    public final void warn(String str, Object obj) {
        if (this.WARN) {
            __warnFormat(str, obj);
        }
    }

    @Override // org.slf4j.Logger
    public final void warn(String str, Object obj, Object obj2) {
        if (this.WARN) {
            __warnFormat(str, obj, obj2);
        }
    }

    @Override // org.slf4j.Logger
    public final void warn(String str, Object... objArr) {
        if (this.WARN) {
            __warnFormat(str, objArr);
        }
    }

    @Override // org.slf4j.Logger
    public final void warn(String str, Throwable th) {
        if (this.WARN) {
            __warn(rewriteMsg(str, 2), th);
        }
    }

    @Override // org.slf4j.Logger
    public final boolean isWarnEnabled(Marker marker) {
        return this.WARN;
    }

    @Override // org.slf4j.Logger
    public final void warn(Marker marker, String str) {
        if (this.WARN) {
            Log.w(this.tag, rewriteMsg(str, 2));
        }
    }

    @Override // org.slf4j.Logger
    public final void warn(Marker marker, String str, Object obj) {
        if (this.WARN) {
            __warnFormat(str, obj);
        }
    }

    @Override // org.slf4j.Logger
    public final void warn(Marker marker, String str, Object obj, Object obj2) {
        if (this.WARN) {
            __warnFormat(str, obj, obj2);
        }
    }

    @Override // org.slf4j.Logger
    public final void warn(Marker marker, String str, Object... objArr) {
        if (this.WARN) {
            __warnFormat(str, objArr);
        }
    }

    @Override // org.slf4j.Logger
    public final void warn(Marker marker, String str, Throwable th) {
        if (this.WARN) {
            __warn(rewriteMsg(str, 2), th);
        }
    }

    @Override // org.slf4j.Logger
    public final boolean isErrorEnabled() {
        return this.ERROR;
    }

    private final void __error(String str, Throwable th) {
        if (th == null) {
            Log.e(this.tag, str);
        } else {
            Log.e(this.tag, str, th);
        }
    }

    private final void __errorFormat(String str, Object... objArr) {
        FormattingTuple formattingTupleArrayFormat = MessageFormatter.arrayFormat(str, objArr);
        __error(rewriteMsg(formattingTupleArrayFormat.getMessage(), 3), formattingTupleArrayFormat.getThrowable());
    }

    @Override // org.slf4j.Logger
    public final void error(String str) {
        if (this.ERROR) {
            Log.e(this.tag, rewriteMsg(str, 2));
        }
    }

    @Override // org.slf4j.Logger
    public final void error(String str, Object obj) {
        if (this.ERROR) {
            __errorFormat(str, obj);
        }
    }

    @Override // org.slf4j.Logger
    public final void error(String str, Object obj, Object obj2) {
        if (this.ERROR) {
            __errorFormat(str, obj, obj2);
        }
    }

    @Override // org.slf4j.Logger
    public final void error(String str, Object... objArr) {
        if (this.ERROR) {
            __errorFormat(str, objArr);
        }
    }

    @Override // org.slf4j.Logger
    public final void error(String str, Throwable th) {
        if (this.ERROR) {
            __error(rewriteMsg(str, 2), th);
        }
    }

    @Override // org.slf4j.Logger
    public final boolean isErrorEnabled(Marker marker) {
        return this.ERROR;
    }

    @Override // org.slf4j.Logger
    public final void error(Marker marker, String str) {
        if (this.ERROR) {
            Log.e(this.tag, rewriteMsg(str, 2));
        }
    }

    @Override // org.slf4j.Logger
    public final void error(Marker marker, String str, Object obj) {
        if (this.ERROR) {
            __errorFormat(str, obj);
        }
    }

    @Override // org.slf4j.Logger
    public final void error(Marker marker, String str, Object obj, Object obj2) {
        if (this.ERROR) {
            __errorFormat(str, obj, obj2);
        }
    }

    @Override // org.slf4j.Logger
    public final void error(Marker marker, String str, Object... objArr) {
        if (this.ERROR) {
            __errorFormat(str, objArr);
        }
    }

    @Override // org.slf4j.Logger
    public final void error(Marker marker, String str, Throwable th) {
        if (this.ERROR) {
            __error(rewriteMsg(str, 2), th);
        }
    }
}
