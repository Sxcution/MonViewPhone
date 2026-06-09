package uk.uuid.slf4j.android;

import java.io.IOException;
import java.net.URL;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import uk.uuid.slf4j.android.LoggerConfig;

/* JADX INFO: loaded from: classes.dex */
final class LoggingConfig {
    public static final String DEFAULT_FILENAME = "config.properties";
    private final CategoryMap map = new CategoryMap();

    LoggingConfig(String str, Logger logger) {
        long jNanoTime = logger.isTraceEnabled() ? System.nanoTime() : 0L;
        Properties properties = new Properties();
        URL resource = getClass().getResource(str);
        resource = resource == null ? getClass().getResource("/eu/lp0/slf4j/android/" + str) : resource;
        if (resource != null) {
            logger.debug("Loading properties file from {}", resource);
            try {
                properties.load(resource.openStream());
            } catch (IOException e) {
                logger.error("Error loading properties file from {}", resource, e);
                properties.clear();
            }
        } else {
            logger.debug("No config file");
        }
        for (Map.Entry entry : properties.entrySet()) {
            String str2 = (String) entry.getKey();
            String str3 = (String) entry.getValue();
            String strSubstring = "";
            if (str2.startsWith("tag")) {
                if (str2.length() != 3) {
                    if (str2.charAt(3) == '.') {
                        strSubstring = str2.substring(4);
                    }
                }
                if (str3.length() > 23) {
                    if (strSubstring.length() == 0) {
                        logger.warn("Ignoring invalid default tag {}", str3);
                    } else {
                        logger.warn("Ignoring invalid tag {} for {}", str3, strSubstring);
                    }
                } else {
                    this.map.put(strSubstring, new LoggerConfig(str3));
                }
            } else if (str2.startsWith("level")) {
                if (str2.length() != 5) {
                    if (str2.charAt(5) == '.') {
                        strSubstring = str2.substring(6);
                        try {
                            this.map.put(strSubstring, new LoggerConfig(LogLevel.valueOf(str3.toUpperCase(Locale.ENGLISH))));
                        } catch (IllegalArgumentException unused) {
                            if (strSubstring.length() == 0) {
                                logger.warn("Ignoring invalid default log level {}", str3);
                            } else {
                                logger.warn("Ignoring invalid log level {} for {}", str3, strSubstring);
                            }
                        }
                    }
                } else {
                    this.map.put(strSubstring, new LoggerConfig(LogLevel.valueOf(str3.toUpperCase(Locale.ENGLISH))));
                }
            } else if (str2.startsWith("showName")) {
                if (str2.length() != 8) {
                    if (str2.charAt(8) == '.') {
                        strSubstring = str2.substring(9);
                        try {
                            this.map.put(strSubstring, new LoggerConfig(LoggerConfig.ShowName.valueOf(str3.toUpperCase(Locale.ENGLISH))));
                        } catch (IllegalArgumentException unused2) {
                            if (strSubstring.length() == 0) {
                                logger.warn("Ignoring invalid default show name setting {}", str3);
                            } else {
                                logger.warn("Ignoring invalid show name setting {} for {}", str3, strSubstring);
                            }
                        }
                    }
                } else {
                    this.map.put(strSubstring, new LoggerConfig(LoggerConfig.ShowName.valueOf(str3.toUpperCase(Locale.ENGLISH))));
                }
            } else if (str2.startsWith("showThread")) {
                if (str2.length() != 10) {
                    if (str2.charAt(10) == '.') {
                        strSubstring = str2.substring(11);
                    }
                }
                LoggerConfig loggerConfig = new LoggerConfig();
                loggerConfig.showThread = Boolean.valueOf(str3);
                this.map.put(strSubstring, loggerConfig);
            }
        }
        if (logger.isTraceEnabled()) {
            logger.trace("Config processing completed in {}µs", Long.valueOf(TimeUnit.NANOSECONDS.toMicros(System.nanoTime() - jNanoTime)));
        }
    }

    final LoggerConfig get(String str) {
        return this.map.get(str);
    }
}
