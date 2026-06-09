package com.genymobile.scrcpy;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import org.java_websocket.WebSocket;

/* JADX INFO: loaded from: classes.dex */
public final class FilePushHandler {
    private static final int ERROR_FAILED_TO_CREATE = -4;
    private static final int ERROR_FAILED_TO_DELETE = -3;
    private static final int ERROR_FAILED_TO_WRITE = -6;
    private static final int ERROR_FILE_IS_BUSY = -7;
    private static final int ERROR_FILE_NOT_FOUND = -5;
    private static final int ERROR_INCORRECT_SIZE = -11;
    private static final int ERROR_INVALID_NAME = -1;
    private static final int ERROR_INVALID_STATE = -8;
    private static final int ERROR_NO_FREE_ID = -10;
    private static final int ERROR_NO_SPACE = -2;
    private static final int ERROR_UNKNOWN_ID = -9;
    private static final int NEW_PUSH_ID = 1;
    private static final int NO_ERROR = 0;
    private static final String PUSH_PATH = "/data/local/tmp";

    private FilePushHandler() {
    }

    private static final class FilePush {
        private final WebSocket conn;
        private final String fileName;
        private final long fileSize;
        private long processedBytes = 0;
        private final short pushId;
        private final FileOutputStream stream;
        private static final HashMap<String, FilePush> INSTANCES_BY_NAME = new HashMap<>();
        private static final HashMap<Short, FilePush> INSTANCES_BY_ID = new HashMap<>();
        private static short nextPushId = 0;

        FilePush(short s, long j, String str, FileOutputStream fileOutputStream, WebSocket webSocket) {
            this.pushId = s;
            this.fileSize = j;
            this.fileName = str;
            this.stream = fileOutputStream;
            this.conn = webSocket;
            INSTANCES_BY_ID.put(Short.valueOf(s), this);
            INSTANCES_BY_NAME.put(str, this);
        }

        public static FilePush getInstance(String str) {
            return INSTANCES_BY_NAME.get(str);
        }

        public static FilePush getInstance(short s) {
            return INSTANCES_BY_ID.get(Short.valueOf(s));
        }

        public static short getNextPushId() {
            short s = nextPushId;
            do {
                HashMap<Short, FilePush> map = INSTANCES_BY_ID;
                short s2 = (short) (nextPushId + 1);
                nextPushId = s2;
                if (map.containsKey(Short.valueOf(s2))) {
                    if (nextPushId == Short.MAX_VALUE) {
                        nextPushId = (short) 0;
                    }
                } else {
                    return nextPushId;
                }
            } while (nextPushId != s);
            return (short) -1;
        }

        public static void releaseByConnection(WebSocket webSocket) {
            ArrayList<FilePush> arrayList = new ArrayList();
            for (FilePush filePush : INSTANCES_BY_ID.values()) {
                if (filePush.conn.equals(webSocket)) {
                    arrayList.add(filePush);
                }
            }
            for (FilePush filePush2 : arrayList) {
                try {
                    filePush2.release();
                } catch (IOException unused) {
                    Ln.w("Failed to release stream for file: \"" + filePush2.getFileName() + "\"");
                }
            }
        }

        public void write(byte[] bArr, int i) throws IOException {
            this.processedBytes += (long) i;
            this.stream.write(bArr, 0, i);
        }

        public String getFileName() {
            return this.fileName;
        }

        public boolean isComplete() {
            return this.processedBytes == this.fileSize;
        }

        public void release() throws IOException {
            INSTANCES_BY_ID.remove(Short.valueOf(this.pushId));
            INSTANCES_BY_NAME.remove(this.fileName);
            this.stream.close();
        }
    }

    private static ByteBuffer pushFilePushResponse(short s, int i) {
        return WebSocketConnection.deviceMessageToByteBuffer(DeviceMessage.createPushResponse(s, i));
    }

    private static FilePush checkPushId(WebSocket webSocket, ControlMessage controlMessage) {
        short pushId = controlMessage.getPushId();
        FilePush filePush = FilePush.getInstance(pushId);
        if (filePush == null) {
            webSocket.send(pushFilePushResponse(pushId, ERROR_UNKNOWN_ID));
        }
        return filePush;
    }

    private static void handleNew(WebSocket webSocket) {
        short nextPushId = FilePush.getNextPushId();
        if (nextPushId == -1) {
            webSocket.send(pushFilePushResponse(nextPushId, ERROR_NO_FREE_ID));
        } else {
            webSocket.send(pushFilePushResponse(nextPushId, 1));
        }
    }

    private static void handleStart(WebSocket webSocket, ControlMessage controlMessage) {
        short pushId = controlMessage.getPushId();
        String fileName = controlMessage.getFileName();
        int fileSize = controlMessage.getFileSize();
        if (FilePush.getInstance(fileName) != null) {
            webSocket.send(pushFilePushResponse(pushId, ERROR_FILE_IS_BUSY));
            return;
        }
        if (fileName.contains("/")) {
            webSocket.send(pushFilePushResponse(pushId, -1));
            return;
        }
        File file = new File(PUSH_PATH, fileName);
        try {
            if (!file.createNewFile() && !file.delete()) {
                webSocket.send(pushFilePushResponse(pushId, -3));
                return;
            }
            try {
                new FilePush(pushId, fileSize, fileName, new FileOutputStream(file), webSocket);
                webSocket.send(pushFilePushResponse(pushId, 0));
            } catch (FileNotFoundException unused) {
                webSocket.send(pushFilePushResponse(pushId, ERROR_FILE_NOT_FOUND));
            }
        } catch (IOException unused2) {
            webSocket.send(pushFilePushResponse(pushId, ERROR_FAILED_TO_CREATE));
        }
    }

    private static void handleAppend(WebSocket webSocket, ControlMessage controlMessage) {
        FilePush filePushCheckPushId = checkPushId(webSocket, controlMessage);
        if (filePushCheckPushId == null) {
            return;
        }
        short pushId = controlMessage.getPushId();
        try {
            filePushCheckPushId.write(controlMessage.getPushChunk(), controlMessage.getPushChunkSize());
            webSocket.send(pushFilePushResponse(pushId, 0));
        } catch (IOException unused) {
            webSocket.send(pushFilePushResponse(pushId, ERROR_FAILED_TO_WRITE));
            try {
                filePushCheckPushId.release();
            } catch (IOException unused2) {
                Ln.w("Failed to release stream for file: \"" + filePushCheckPushId.getFileName() + "\"");
            }
        }
    }

    private static void handleFinish(WebSocket webSocket, ControlMessage controlMessage) {
        FilePush filePushCheckPushId = checkPushId(webSocket, controlMessage);
        if (filePushCheckPushId == null) {
            return;
        }
        short pushId = controlMessage.getPushId();
        if (filePushCheckPushId.isComplete()) {
            try {
                filePushCheckPushId.release();
                webSocket.send(pushFilePushResponse(pushId, 0));
                return;
            } catch (IOException unused) {
                webSocket.send(pushFilePushResponse(pushId, ERROR_FAILED_TO_WRITE));
                return;
            }
        }
        webSocket.send(pushFilePushResponse(pushId, ERROR_INCORRECT_SIZE));
    }

    private static void handleCancel(WebSocket webSocket, ControlMessage controlMessage) {
        FilePush filePushCheckPushId = checkPushId(webSocket, controlMessage);
        if (filePushCheckPushId == null) {
            return;
        }
        short pushId = controlMessage.getPushId();
        try {
            filePushCheckPushId.release();
            webSocket.send(pushFilePushResponse(pushId, 0));
        } catch (IOException unused) {
            webSocket.send(pushFilePushResponse(pushId, ERROR_FAILED_TO_WRITE));
        }
    }

    public static void cancelAllForConnection(WebSocket webSocket) {
        FilePush.releaseByConnection(webSocket);
    }

    public static void handlePush(WebSocket webSocket, ControlMessage controlMessage) {
        int pushState = controlMessage.getPushState();
        if (pushState == 0) {
            handleNew(webSocket);
            return;
        }
        if (pushState == 1) {
            handleStart(webSocket, controlMessage);
            return;
        }
        if (pushState == 2) {
            handleAppend(webSocket, controlMessage);
            return;
        }
        if (pushState == 3) {
            handleFinish(webSocket, controlMessage);
        } else if (pushState == 4) {
            handleCancel(webSocket, controlMessage);
        } else {
            webSocket.send(pushFilePushResponse(controlMessage.getPushId(), ERROR_INVALID_STATE));
        }
    }
}
