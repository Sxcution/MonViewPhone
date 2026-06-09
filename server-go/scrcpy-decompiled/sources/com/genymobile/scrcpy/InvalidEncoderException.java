package com.genymobile.scrcpy;

import android.media.MediaCodecInfo;

/* JADX INFO: loaded from: classes.dex */
public class InvalidEncoderException extends RuntimeException {
    private final MediaCodecInfo[] availableEncoders;
    private final String name;

    public InvalidEncoderException(String str, MediaCodecInfo[] mediaCodecInfoArr) {
        super("There is no encoder having name '" + str + '\"');
        this.name = str;
        this.availableEncoders = mediaCodecInfoArr;
    }

    public String getName() {
        return this.name;
    }

    public MediaCodecInfo[] getAvailableEncoders() {
        return this.availableEncoders;
    }
}
