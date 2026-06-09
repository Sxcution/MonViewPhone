package com.genymobile.scrcpy;

import android.graphics.Rect;
import android.hardware.display.VirtualDisplay;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaCodecList;
import android.media.MediaCrypto;
import android.media.MediaFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Surface;
import com.genymobile.scrcpy.Connection;
import com.genymobile.scrcpy.wrappers.ServiceManager;
import com.genymobile.scrcpy.wrappers.SurfaceControl;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/* JADX INFO: loaded from: classes.dex */
public class ScreenEncoder implements Connection.StreamInvalidateListener, Runnable {
    private static final int DEFAULT_I_FRAME_INTERVAL = 10;
    private static final String KEY_MAX_FPS_TO_ENCODER = "max-fps-to-encoder";
    private static final int NO_PTS = -1;
    private static final int REPEAT_FRAME_DELAY_US = 100000;
    private Connection connection;
    private Device device;
    private IBinder display;
    private MediaFormat format;
    private long ptsOrigin;
    private Thread selectorThread;
    private VideoSettings videoSettings;
    private VirtualDisplay virtualDisplay;
    private final AtomicBoolean streamIsInvalide = new AtomicBoolean();
    private final ByteBuffer headerBuffer = ByteBuffer.allocate(12);
    private int timeout = -1;

    public ScreenEncoder(VideoSettings videoSettings) {
        this.videoSettings = videoSettings;
        updateFormat();
    }

    private void updateFormat() {
        this.format = createFormat(this.videoSettings);
        int maxFps = this.videoSettings.getMaxFps();
        if (maxFps > 0) {
            this.timeout = 1000000 / maxFps;
        } else {
            this.timeout = -1;
        }
    }

    public void setConnection(Connection connection) {
        this.connection = connection;
    }

    public void setDevice(Device device) {
        this.device = device;
    }

    @Override // com.genymobile.scrcpy.Connection.StreamInvalidateListener
    public void onStreamInvalidate() {
        Ln.d("invalidate stream");
        this.streamIsInvalide.set(true);
        updateFormat();
    }

    public boolean consumeStreamInvalidation() {
        return this.streamIsInvalide.getAndSet(false);
    }

    public boolean isAlive() {
        Thread thread = this.selectorThread;
        return thread != null && thread.isAlive();
    }

    public void streamScreen() throws IOException {
        Workarounds.prepareMainLooper();
        try {
            internalStreamScreen();
        } catch (NullPointerException unused) {
            Ln.d("Applying workarounds to avoid NullPointerException");
            Workarounds.fillAppInfo();
            internalStreamScreen();
        }
    }

    /* JADX WARN: Multi-variable type inference failed */
    /* JADX WARN: Type inference fix 'apply assigned field type' failed
    java.lang.UnsupportedOperationException: ArgType.getObject(), call class: class jadx.core.dex.instructions.args.ArgType$UnknownArg
    	at jadx.core.dex.instructions.args.ArgType.getObject(ArgType.java:593)
    	at jadx.core.dex.attributes.nodes.ClassTypeVarsAttr.getTypeVarsMapFor(ClassTypeVarsAttr.java:35)
    	at jadx.core.dex.nodes.utils.TypeUtils.replaceClassGenerics(TypeUtils.java:177)
    	at jadx.core.dex.visitors.typeinference.FixTypesVisitor.insertExplicitUseCast(FixTypesVisitor.java:397)
    	at jadx.core.dex.visitors.typeinference.FixTypesVisitor.tryFieldTypeWithNewCasts(FixTypesVisitor.java:359)
    	at jadx.core.dex.visitors.typeinference.FixTypesVisitor.applyFieldType(FixTypesVisitor.java:309)
    	at jadx.core.dex.visitors.typeinference.FixTypesVisitor.visit(FixTypesVisitor.java:94)
     */
    private void internalStreamScreen() throws IOException {
        boolean zEncode;
        updateFormat();
        this.connection.setStreamInvalidateListener(this);
        do {
            try {
                MediaCodec mediaCodecCreateCodec = createCodec(this.videoSettings.getEncoderName());
                if (this.display != null) {
                    destroyDisplay(this.display);
                    this.display = null;
                }
                if (this.virtualDisplay != null) {
                    this.virtualDisplay.release();
                    this.virtualDisplay = null;
                }
                ScreenInfo screenInfo = this.device.getScreenInfo();
                Rect contentRect = screenInfo.getContentRect();
                Rect rect = screenInfo.getVideoSize().toRect();
                Rect rect2 = screenInfo.getUnlockedVideoSize().toRect();
                int videoRotation = screenInfo.getVideoRotation();
                int layerStack = this.device.getLayerStack();
                setSize(this.format, rect.width(), rect.height());
                configure(mediaCodecCreateCodec, this.format);
                Surface surfaceCreateInputSurface = mediaCodecCreateCodec.createInputSurface();
                try {
                    this.virtualDisplay = new ServiceManager().getDisplayManager().createVirtualDisplay("scrcpy", rect.width(), rect.height(), this.device.getDisplayId(), surfaceCreateInputSurface);
                    Ln.d("Display: using DisplayManager API");
                } catch (Exception e) {
                    try {
                        IBinder iBinderCreateDisplay = createDisplay();
                        this.display = iBinderCreateDisplay;
                        setDisplaySurface(iBinderCreateDisplay, surfaceCreateInputSurface, videoRotation, contentRect, rect2, layerStack);
                        Ln.d("Display: using SurfaceControl API");
                    } catch (Exception e2) {
                        Ln.e("Could not create display using DisplayManager", e);
                        Ln.e("Could not create display using SurfaceControl", e2);
                        throw new AssertionError("Could not create display");
                    }
                }
                mediaCodecCreateCodec.start();
                try {
                    zEncode = encode(mediaCodecCreateCodec);
                    mediaCodecCreateCodec.stop();
                } finally {
                    if (this.display != null) {
                        destroyDisplay(this.display);
                        this.display = null;
                    }
                    if (this.virtualDisplay != null) {
                        this.virtualDisplay.release();
                        this.virtualDisplay = null;
                    }
                    mediaCodecCreateCodec.release();
                    surfaceCreateInputSurface.release();
                }
            } finally {
                this.connection.setStreamInvalidateListener(null);
            }
        } while (zEncode);
    }

    private boolean encode(MediaCodec mediaCodec) throws IOException {
        MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();
        boolean z = false;
        while (true) {
            if (consumeStreamInvalidation() || z || !this.connection.hasConnections()) {
                break;
            }
            int iDequeueOutputBuffer = mediaCodec.dequeueOutputBuffer(bufferInfo, this.timeout);
            boolean z2 = (bufferInfo.flags & 4) != 0;
            try {
                if (consumeStreamInvalidation()) {
                    z = z2;
                } else {
                    if (iDequeueOutputBuffer >= 0) {
                        ByteBuffer outputBuffer = mediaCodec.getOutputBuffer(iDequeueOutputBuffer);
                        if (this.videoSettings.getSendFrameMeta()) {
                            writeFrameMeta(bufferInfo, outputBuffer.remaining());
                        }
                        this.connection.send(outputBuffer);
                    }
                    if (iDequeueOutputBuffer >= 0) {
                        mediaCodec.releaseOutputBuffer(iDequeueOutputBuffer, false);
                    }
                    z = z2;
                }
            } finally {
                if (iDequeueOutputBuffer >= 0) {
                    mediaCodec.releaseOutputBuffer(iDequeueOutputBuffer, false);
                }
            }
        }
        return !z && this.connection.hasConnections();
    }

    private void writeFrameMeta(MediaCodec.BufferInfo bufferInfo, int i) throws IOException {
        long j;
        this.headerBuffer.clear();
        if ((bufferInfo.flags & 2) != 0) {
            j = -1;
        } else {
            if (this.ptsOrigin == 0) {
                this.ptsOrigin = bufferInfo.presentationTimeUs;
            }
            j = bufferInfo.presentationTimeUs - this.ptsOrigin;
        }
        this.headerBuffer.putLong(j);
        this.headerBuffer.putInt(i);
        this.headerBuffer.flip();
        this.connection.send(this.headerBuffer);
    }

    public static MediaCodecInfo[] listEncoders() {
        ArrayList arrayList = new ArrayList();
        for (MediaCodecInfo mediaCodecInfo : new MediaCodecList(0).getCodecInfos()) {
            if (mediaCodecInfo.isEncoder() && Arrays.asList(mediaCodecInfo.getSupportedTypes()).contains("video/avc")) {
                arrayList.add(mediaCodecInfo);
            }
        }
        return (MediaCodecInfo[]) arrayList.toArray(new MediaCodecInfo[arrayList.size()]);
    }

    private static MediaCodec createCodec(String str) throws IOException {
        if (str != null) {
            Ln.d("Creating encoder by name: '" + str + "'");
            try {
                return MediaCodec.createByCodecName(str);
            } catch (IllegalArgumentException unused) {
                throw new InvalidEncoderException(str, listEncoders());
            }
        }
        MediaCodec mediaCodecCreateEncoderByType = MediaCodec.createEncoderByType("video/avc");
        Ln.d("Using encoder: '" + mediaCodecCreateEncoderByType.getName() + "'");
        return mediaCodecCreateEncoderByType;
    }

    private static void setCodecOption(MediaFormat mediaFormat, CodecOption codecOption) {
        String key = codecOption.getKey();
        Object value = codecOption.getValue();
        if (value instanceof Integer) {
            mediaFormat.setInteger(key, ((Integer) value).intValue());
        } else if (value instanceof Long) {
            mediaFormat.setLong(key, ((Long) value).longValue());
        } else if (value instanceof Float) {
            mediaFormat.setFloat(key, ((Float) value).floatValue());
        } else if (value instanceof String) {
            mediaFormat.setString(key, (String) value);
        }
        Ln.d("Codec option set: " + key + " (" + value.getClass().getSimpleName() + ") = " + value);
    }

    private static MediaFormat createFormat(VideoSettings videoSettings) {
        int bitRate = videoSettings.getBitRate();
        int maxFps = videoSettings.getMaxFps();
        int iFrameInterval = videoSettings.getIFrameInterval();
        List<CodecOption> codecOptions = videoSettings.getCodecOptions();
        MediaFormat mediaFormat = new MediaFormat();
        mediaFormat.setString("mime", "video/avc");
        mediaFormat.setInteger("bitrate", bitRate);
        mediaFormat.setInteger("frame-rate", 60);
        mediaFormat.setInteger("color-format", 2130708361);
        mediaFormat.setInteger("i-frame-interval", iFrameInterval);
        mediaFormat.setLong("repeat-previous-frame-after", 100000L);
        if (maxFps > 0) {
            mediaFormat.setFloat(KEY_MAX_FPS_TO_ENCODER, maxFps);
        }
        if (codecOptions != null) {
            Iterator<CodecOption> it = codecOptions.iterator();
            while (it.hasNext()) {
                setCodecOption(mediaFormat, it.next());
            }
        }
        return mediaFormat;
    }

    private static IBinder createDisplay() throws Exception {
        return SurfaceControl.createDisplay("scrcpy", Build.VERSION.SDK_INT < 30 || (Build.VERSION.SDK_INT == 30 && !"S".equals(Build.VERSION.CODENAME)));
    }

    private static void configure(MediaCodec mediaCodec, MediaFormat mediaFormat) {
        mediaCodec.configure(mediaFormat, (Surface) null, (MediaCrypto) null, 1);
    }

    private static void setSize(MediaFormat mediaFormat, int i, int i2) {
        mediaFormat.setInteger("width", i);
        mediaFormat.setInteger("height", i2);
    }

    private static void setDisplaySurface(IBinder iBinder, Surface surface, int i, Rect rect, Rect rect2, int i2) {
        SurfaceControl.openTransaction();
        try {
            SurfaceControl.setDisplaySurface(iBinder, surface);
            SurfaceControl.setDisplayProjection(iBinder, i, rect, rect2);
            SurfaceControl.setDisplayLayerStack(iBinder, i2);
        } finally {
            SurfaceControl.closeTransaction();
        }
    }

    private static void destroyDisplay(IBinder iBinder) {
        SurfaceControl.destroyDisplay(iBinder);
    }

    @Override // java.lang.Runnable
    public void run() {
        synchronized (this) {
            if (this.selectorThread != null && this.selectorThread.isAlive()) {
                throw new IllegalStateException(getClass().getName() + " can only be started once.");
            }
            this.selectorThread = Thread.currentThread();
        }
        try {
            streamScreen();
        } catch (IOException e) {
            Ln.e("Failed to start screen recorder", e);
        }
    }

    public void start(Device device, Connection connection) {
        this.device = device;
        this.connection = connection;
        Thread thread = this.selectorThread;
        if (thread != null && thread.isAlive()) {
            throw new IllegalStateException(getClass().getName() + " can only be started once.");
        }
        new Thread(this).start();
    }
}
