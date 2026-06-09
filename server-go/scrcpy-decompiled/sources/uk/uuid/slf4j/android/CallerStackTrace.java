package uk.uuid.slf4j.android;

/* JADX INFO: loaded from: classes.dex */
final class CallerStackTrace extends Throwable {
    private static final StackTraceElement UNKNOWN = new StackTraceElement("<unknown class>", "<unknown method>", null, -1);
    private static final long serialVersionUID = 1;
    private final StackTraceElement stackFrame;

    public CallerStackTrace(int i) {
        StackTraceElement stackTraceElement;
        try {
            stackTraceElement = getStackTrace()[i];
        } catch (ArrayIndexOutOfBoundsException unused) {
            stackTraceElement = UNKNOWN;
        }
        this.stackFrame = stackTraceElement;
    }

    public final StackTraceElement get() {
        return this.stackFrame;
    }

    @Override // java.lang.Throwable
    public final String toString() {
        return this.stackFrame.toString();
    }
}
