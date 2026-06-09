package com.genymobile.scrcpy;

import android.graphics.Rect;
import com.genymobile.scrcpy.Ln;

/* JADX INFO: loaded from: classes.dex */
public class Options {
    public static final int TYPE_LOCAL_SOCKET = 1;
    public static final int TYPE_WEB_SOCKET = 2;
    private int bitRate;
    private String codecOptions;
    private Rect crop;
    private int displayId;
    private String encoderName;
    private int lockedVideoOrientation;
    private int maxFps;
    private int maxSize;
    private boolean powerOffScreenOnClose;
    private boolean sendFrameMeta;
    private Ln.Level logLevel = Ln.Level.ERROR;
    private boolean tunnelForward = false;
    private boolean control = true;
    private boolean showTouches = false;
    private boolean stayAwake = false;
    private int serverType = 1;
    private int portNumber = 8886;
    private boolean listenOnAllInterfaces = true;

    public Ln.Level getLogLevel() {
        return this.logLevel;
    }

    public void setLogLevel(Ln.Level level) {
        this.logLevel = level;
    }

    public int getMaxSize() {
        return this.maxSize;
    }

    public void setMaxSize(int i) {
        this.maxSize = (i / 8) * 8;
    }

    public int getBitRate() {
        return this.bitRate;
    }

    public void setBitRate(int i) {
        this.bitRate = i;
    }

    public int getMaxFps() {
        return this.maxFps;
    }

    public void setMaxFps(int i) {
        this.maxFps = i;
    }

    public int getLockedVideoOrientation() {
        return this.lockedVideoOrientation;
    }

    public void setLockedVideoOrientation(int i) {
        this.lockedVideoOrientation = i;
    }

    public boolean isTunnelForward() {
        return this.tunnelForward;
    }

    public void setTunnelForward(boolean z) {
        this.tunnelForward = z;
    }

    public Rect getCrop() {
        return this.crop;
    }

    public void setCrop(Rect rect) {
        this.crop = rect;
    }

    public boolean getSendFrameMeta() {
        return this.sendFrameMeta;
    }

    public void setSendFrameMeta(boolean z) {
        this.sendFrameMeta = z;
    }

    public boolean getControl() {
        return this.control;
    }

    public void setControl(boolean z) {
        this.control = z;
    }

    public int getDisplayId() {
        return this.displayId;
    }

    public void setDisplayId(int i) {
        this.displayId = i;
    }

    public boolean getShowTouches() {
        return this.showTouches;
    }

    public void setShowTouches(boolean z) {
        this.showTouches = z;
    }

    public boolean getStayAwake() {
        return this.stayAwake;
    }

    public void setStayAwake(boolean z) {
        this.stayAwake = z;
    }

    public String getCodecOptions() {
        return this.codecOptions;
    }

    public void setCodecOptions(String str) {
        this.codecOptions = str;
    }

    public String getEncoderName() {
        return this.encoderName;
    }

    public void setEncoderName(String str) {
        this.encoderName = str;
    }

    public void setPowerOffScreenOnClose(boolean z) {
        this.powerOffScreenOnClose = z;
    }

    public boolean getPowerOffScreenOnClose() {
        return this.powerOffScreenOnClose;
    }

    public int getServerType() {
        return this.serverType;
    }

    public void setServerType(int i) {
        if (i == 1 || i == 2) {
            this.serverType = i;
        }
    }

    public void setPortNumber(int i) {
        this.portNumber = i;
    }

    public int getPortNumber() {
        return this.portNumber;
    }

    public boolean getListenOnAllInterfaces() {
        return this.listenOnAllInterfaces;
    }

    public void setListenOnAllInterfaces(boolean z) {
        this.listenOnAllInterfaces = z;
    }

    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Options{maxSize=");
        sb.append(this.maxSize);
        sb.append(", bitRate=");
        sb.append(this.bitRate);
        sb.append(", maxFps=");
        sb.append(this.maxFps);
        sb.append(", tunnelForward=");
        sb.append(this.tunnelForward);
        sb.append(", crop=");
        sb.append(this.crop);
        sb.append(", sendFrameMeta=");
        sb.append(this.sendFrameMeta);
        sb.append(", serverType=");
        sb.append(this.serverType == 1 ? "local" : "web");
        sb.append(", listenOnAllInterfaces=");
        sb.append(this.listenOnAllInterfaces ? "true" : "false");
        sb.append('}');
        return sb.toString();
    }
}
