package uk.uuid.slf4j.android;

/* JADX INFO: loaded from: classes.dex */
final class LoggerConfig {
    static final LoggerConfig DEFAULT;
    LogLevel level;
    ShowName showName;
    Boolean showThread;
    String tag;

    enum ShowName {
        FALSE,
        SHORT,
        COMPACT,
        LONG,
        CALLER
    }

    static {
        LoggerConfig loggerConfig = new LoggerConfig();
        DEFAULT = loggerConfig;
        loggerConfig.tag = "";
        loggerConfig.level = LogLevel.NATIVE;
        DEFAULT.showName = ShowName.FALSE;
        DEFAULT.showThread = false;
    }

    LoggerConfig() {
    }

    LoggerConfig(String str) {
        this.tag = str;
    }

    LoggerConfig(LogLevel logLevel) {
        this.level = logLevel;
    }

    LoggerConfig(ShowName showName) {
        this.showName = showName;
    }

    final boolean isComplete() {
        return (this.tag == null || this.level == null || this.showName == null || this.showThread == null) ? false : true;
    }

    final boolean merge(LoggerConfig loggerConfig) {
        if (loggerConfig == null) {
            return isComplete();
        }
        boolean z = true;
        if (this.tag == null) {
            this.tag = loggerConfig.tag;
            z = false;
        }
        if (this.level == null) {
            this.level = loggerConfig.level;
            z = false;
        }
        if (this.showName == null) {
            this.showName = loggerConfig.showName;
            z = false;
        }
        if (this.showThread != null) {
            return z;
        }
        this.showThread = loggerConfig.showThread;
        return false;
    }
}
