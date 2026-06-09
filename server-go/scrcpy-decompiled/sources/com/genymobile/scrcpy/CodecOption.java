package com.genymobile.scrcpy;

import java.util.ArrayList;
import java.util.List;

/* JADX INFO: loaded from: classes.dex */
public class CodecOption {
    private String key;
    private Object value;

    public CodecOption(String str, Object obj) {
        this.key = str;
        this.value = obj;
    }

    public String getKey() {
        return this.key;
    }

    public Object getValue() {
        return this.value;
    }

    public static List<CodecOption> parse(String str) {
        if ("-".equals(str)) {
            return null;
        }
        ArrayList arrayList = new ArrayList();
        StringBuilder sb = new StringBuilder();
        boolean z = false;
        for (char c : str.toCharArray()) {
            if (c != ',') {
                if (c != '\\') {
                    sb.append(c);
                } else if (z) {
                    sb.append('\\');
                    z = false;
                } else {
                    z = true;
                }
            } else if (z) {
                sb.append(',');
                z = false;
            } else {
                arrayList.add(parseOption(sb.toString()));
                sb.setLength(0);
            }
        }
        if (sb.length() > 0) {
            arrayList.add(parseOption(sb.toString()));
        }
        return arrayList;
    }

    /* JADX WARN: Failed to restore switch over string. Please report as a decompilation issue */
    /* JADX WARN: Multi-variable type inference failed */
    /* JADX WARN: Type inference failed for: r9v3, types: [java.lang.String] */
    /* JADX WARN: Type inference failed for: r9v5, types: [java.lang.Integer] */
    /* JADX WARN: Type inference failed for: r9v7, types: [java.lang.Long] */
    /* JADX WARN: Type inference failed for: r9v9, types: [java.lang.Float] */
    private static CodecOption parseOption(String str) {
        String strSubstring;
        String strSubstring2;
        int iIndexOf = str.indexOf(61);
        byte b = -1;
        if (iIndexOf == -1) {
            throw new IllegalArgumentException("'=' expected");
        }
        String strSubstring3 = str.substring(0, iIndexOf);
        if (strSubstring3.length() == 0) {
            throw new IllegalArgumentException("Key may not be null");
        }
        int iIndexOf2 = strSubstring3.indexOf(58);
        if (iIndexOf2 != -1) {
            strSubstring = strSubstring3.substring(0, iIndexOf2);
            strSubstring2 = strSubstring3.substring(iIndexOf2 + 1);
        } else {
            strSubstring = strSubstring3;
            strSubstring2 = "int";
        }
        String strVal = str.substring(iIndexOf + 1);
        Object objSubstring;
        switch (strSubstring2.hashCode()) {
            case -891985903:
                if (strSubstring2.equals("string")) {
                    b = 3;
                }
                break;
            case 104431:
                if (strSubstring2.equals("int")) {
                    b = 0;
                }
                break;
            case 3327612:
                if (strSubstring2.equals("long")) {
                    b = 1;
                }
                break;
            case 97526364:
                if (strSubstring2.equals("float")) {
                    b = 2;
                }
                break;
        }
        if (b == 0) {
            objSubstring = Integer.valueOf(Integer.parseInt(strVal));
        } else if (b == 1) {
            objSubstring = Long.valueOf(Long.parseLong(strVal));
        } else if (b == 2) {
            objSubstring = Float.valueOf(Float.parseFloat(strVal));
        } else if (b == 3) {
            objSubstring = strVal;
        } else {
            throw new IllegalArgumentException("Invalid codec option type (int, long, float, str): " + strSubstring2);
        }
        return new CodecOption(strSubstring, objSubstring);
    }
}
