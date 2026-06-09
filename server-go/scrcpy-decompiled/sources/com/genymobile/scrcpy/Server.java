package com.genymobile.scrcpy;

import android.graphics.Rect;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.os.Build;
import com.genymobile.scrcpy.Ln;
import java.lang.Thread;
import java.util.Locale;

/* JADX INFO: loaded from: classes.dex */
public final class Server {
    private Server() {
    }

    private static void parseArguments(Options options, VideoSettings videoSettings, String... strArr) {
        if (strArr.length < 1) {
            throw new IllegalArgumentException("Missing client version");
        }
        String str = strArr[0];
        if (!str.equals(BuildConfig.VERSION_NAME)) {
            throw new IllegalArgumentException("The server version (1.19-ws6) does not match the client (" + str + ")");
        }
        if (strArr[1].toLowerCase().equals("web")) {
            options.setServerType(2);
            if (strArr.length > 2) {
                options.setLogLevel(Ln.Level.valueOf(strArr[2].toUpperCase(Locale.ENGLISH)));
            }
            if (strArr.length > 3) {
                options.setPortNumber(Integer.parseInt(strArr[3]));
            }
            if (strArr.length > 4) {
                options.setListenOnAllInterfaces(Boolean.parseBoolean(strArr[4]));
                return;
            }
            return;
        }
        if (strArr.length != 16) {
            throw new IllegalArgumentException("Expecting 16 parameters");
        }
        options.setLogLevel(Ln.Level.valueOf(strArr[1].toUpperCase(Locale.ENGLISH)));
        int i = Integer.parseInt(strArr[2]);
        if (i != 0) {
            videoSettings.setBounds(i, i);
        }
        videoSettings.setBitRate(Integer.parseInt(strArr[3]));
        videoSettings.setMaxFps(Integer.parseInt(strArr[4]));
        videoSettings.setLockedVideoOrientation(Integer.parseInt(strArr[5]));
        options.setTunnelForward(Boolean.parseBoolean(strArr[6]));
        videoSettings.setCrop(parseCrop(strArr[7]));
        videoSettings.setSendFrameMeta(Boolean.parseBoolean(strArr[8]));
        options.setControl(Boolean.parseBoolean(strArr[9]));
        videoSettings.setDisplayId(Integer.parseInt(strArr[10]));
        options.setShowTouches(Boolean.parseBoolean(strArr[11]));
        options.setStayAwake(Boolean.parseBoolean(strArr[12]));
        String str2 = strArr[13];
        options.setCodecOptions(str2);
        videoSettings.setCodecOptions(str2);
        videoSettings.setEncoderName("-".equals(strArr[14]) ? null : strArr[14]);
        options.setPowerOffScreenOnClose(Boolean.parseBoolean(strArr[15]));
    }

    private static Rect parseCrop(String str) {
        if ("-".equals(str)) {
            return null;
        }
        String[] strArrSplit = str.split(":");
        if (strArrSplit.length != 4) {
            throw new IllegalArgumentException("Crop must contains 4 values separated by colons: \"" + str + "\"");
        }
        int i = Integer.parseInt(strArrSplit[0]);
        int i2 = Integer.parseInt(strArrSplit[1]);
        int i3 = Integer.parseInt(strArrSplit[2]);
        int i4 = Integer.parseInt(strArrSplit[3]);
        return new Rect(i3, i4, i + i3, i2 + i4);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public static void suggestFix(Throwable th) {
        MediaCodecInfo[] availableEncoders;
        if (Build.VERSION.SDK_INT >= 23 && (th instanceof MediaCodec.CodecException) && ((MediaCodec.CodecException) th).getErrorCode() == -1010) {
            Ln.e("The hardware encoder is not able to encode at the given definition.");
            Ln.e("Try with a lower definition:");
            Ln.e("    scrcpy -m 1024");
        }
        int i = 0;
        if (th instanceof InvalidDisplayIdException) {
            int[] availableDisplayIds = ((InvalidDisplayIdException) th).getAvailableDisplayIds();
            if (availableDisplayIds == null || availableDisplayIds.length <= 0) {
                return;
            }
            Ln.e("Try to use one of the available display ids:");
            int length = availableDisplayIds.length;
            while (i < length) {
                Ln.e("    scrcpy --display " + availableDisplayIds[i]);
                i++;
            }
            return;
        }
        if (!(th instanceof InvalidEncoderException) || (availableEncoders = ((InvalidEncoderException) th).getAvailableEncoders()) == null || availableEncoders.length <= 0) {
            return;
        }
        Ln.e("Try to use one of the available encoders:");
        int length2 = availableEncoders.length;
        while (i < length2) {
            Ln.e("    scrcpy --encoder '" + availableEncoders[i].getName() + "'");
            i++;
        }
    }

    public static void main(String... strArr) throws Exception {
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() { // from class: com.genymobile.scrcpy.Server.1
            @Override // java.lang.Thread.UncaughtExceptionHandler
            public void uncaughtException(Thread thread, Throwable th) {
                Ln.e("Exception on thread " + thread, th);
                Server.suggestFix(th);
            }
        });
        Options options = new Options();
        VideoSettings videoSettings = new VideoSettings();
        parseArguments(options, videoSettings, strArr);
        Ln.initLogLevel(options.getLogLevel());
        if (options.getServerType() == 1) {
            new DesktopConnection(options, videoSettings);
        } else if (options.getServerType() == 2) {
            WSServer wSServer = new WSServer(options);
            wSServer.setReuseAddr(true);
            wSServer.run();
        }
    }
}
