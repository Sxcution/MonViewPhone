package uk.uuid.slf4j.android;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.TimeUnit;
import org.slf4j.ILoggerFactory;
import org.slf4j.Logger;

/* JADX INFO: loaded from: classes.dex */
public final class LoggerFactory implements ILoggerFactory {
    private static final Logger LOG;
    static final int MAX_TAG_LEN = 23;
    private static final boolean TRACE;
    private final ConcurrentMap<String, Logger> loggerMap = new ConcurrentHashMap();
    private final LoggingConfig loggingConfig = new LoggingConfig(LoggingConfig.DEFAULT_FILENAME, LOG);

    static {
        LoggerConfig loggerConfig = new LoggerConfig("slf4j-android");
        loggerConfig.showThread = true;
        loggerConfig.merge(LoggerConfig.DEFAULT);
        LogAdapter logAdapter = new LogAdapter("uk.uuid.slf4j.android", loggerConfig);
        LOG = logAdapter;
        TRACE = logAdapter.isTraceEnabled();
    }

    @Override // org.slf4j.ILoggerFactory
    public final Logger getLogger(String str) {
        long jNanoTime = TRACE ? System.nanoTime() : 0L;
        Logger logger = this.loggerMap.get(str);
        if (logger != null) {
            if (TRACE) {
                LOG.trace("Found logger {} in {}µs", str, Long.valueOf(TimeUnit.NANOSECONDS.toMicros(System.nanoTime() - jNanoTime)));
            }
            return logger;
        }
        LogAdapter logAdapter = new LogAdapter(str, getConfig(str));
        Logger loggerPutIfAbsent = this.loggerMap.putIfAbsent(str, logAdapter);
        if (TRACE) {
            long jNanoTime2 = System.nanoTime();
            if (loggerPutIfAbsent == null) {
                LOG.trace("Created logger {} in {}µs", str, Long.valueOf(TimeUnit.NANOSECONDS.toMicros(jNanoTime2 - jNanoTime)));
            } else {
                LOG.trace("Found existing logger {} in {}µs", str, Long.valueOf(TimeUnit.NANOSECONDS.toMicros(jNanoTime2 - jNanoTime)));
            }
        }
        return loggerPutIfAbsent == null ? logAdapter : loggerPutIfAbsent;
    }

    static final String createTag(String str) {
        int length = str.length();
        int i = MAX_TAG_LEN;
        if (length <= MAX_TAG_LEN) {
            return str;
        }
        char[] charArray = str.toCharArray();
        int length2 = charArray.length;
        int i2 = 0;
        int i3 = 0;
        int i4 = 0;
        while (i2 < length2) {
            if (charArray[i2] == '.') {
                if (charArray[i4] != '.') {
                    i4++;
                }
                i3 = i4;
                int i5 = i2 + 1;
                i4 = (i5 >= length2 || charArray[i5] == '.') ? i3 : i3 + 1;
            }
            charArray[i3] = charArray[i2];
            i2++;
            i3++;
        }
        if (i3 > MAX_TAG_LEN) {
            int i6 = i4 - 1;
            int i7 = 0;
            for (int i8 = 0; i8 < i3; i8++) {
                if (charArray[i8] != '.' || (i8 == i6 && i7 < 22)) {
                    charArray[i7] = charArray[i8];
                    i7++;
                }
            }
            if (i7 <= MAX_TAG_LEN) {
                i = i7;
            }
        } else {
            i = i3;
        }
        return new String(charArray, 0, i);
    }

    private final LoggerConfig getConfig(String str) {
        long jNanoTime = TRACE ? System.nanoTime() : 0L;
        LoggerConfig loggerConfig = this.loggingConfig.get(str);
        if (loggerConfig.tag.length() == 0) {
            loggerConfig.tag = createTag(str);
            if (TRACE) {
                LOG.trace("Created tag {} for {}", loggerConfig.tag, str);
            }
        }
        if (TRACE) {
            LOG.trace("Retrieved config for {} in {}µs", str, Long.valueOf(TimeUnit.NANOSECONDS.toMicros(System.nanoTime() - jNanoTime)));
        }
        return loggerConfig;
    }
}
