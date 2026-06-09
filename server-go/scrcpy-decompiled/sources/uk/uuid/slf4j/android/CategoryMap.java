package uk.uuid.slf4j.android;

import java.util.HashMap;
import java.util.Map;

/* JADX INFO: loaded from: classes.dex */
final class CategoryMap {
    private final Map<String, LoggerConfig> categories = new HashMap();

    CategoryMap() {
    }

    final LoggerConfig get(String str) {
        LoggerConfig loggerConfig = new LoggerConfig();
        if (this.categories.isEmpty()) {
            loggerConfig.merge(LoggerConfig.DEFAULT);
            return loggerConfig;
        }
        if (str == null) {
            str = "";
        }
        while (true) {
            int iLastIndexOf = str.lastIndexOf(46);
            if (loggerConfig.merge(this.categories.get(str))) {
                return loggerConfig;
            }
            if (iLastIndexOf != -1) {
                str = str.substring(0, iLastIndexOf);
            } else {
                if (!loggerConfig.merge(this.categories.get(""))) {
                    loggerConfig.merge(LoggerConfig.DEFAULT);
                }
                return loggerConfig;
            }
        }
    }

    final void put(String str, LoggerConfig loggerConfig) {
        LoggerConfig loggerConfig2 = this.categories.get(str);
        if (loggerConfig2 != null) {
            loggerConfig2.merge(loggerConfig);
        } else {
            this.categories.put(str, loggerConfig);
        }
    }
}
