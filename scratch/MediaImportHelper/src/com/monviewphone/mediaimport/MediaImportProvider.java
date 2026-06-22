package com.monviewphone.mediaimport;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.text.TextUtils;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Locale;

public final class MediaImportProvider extends ContentProvider {
    private static final String METHOD_SCAN = "scan";
    private static final String METHOD_LAST_PATH = "lastPath";
    private static volatile String lastPath;

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (mode == null || !mode.toLowerCase(Locale.US).contains("w")) {
            throw new FileNotFoundException("write mode required");
        }
        File out = resolveOutputFile(uri);
        File parent = out.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) {
            throw new FileNotFoundException("cannot create " + parent);
        }
        lastPath = out.getAbsolutePath();
        return ParcelFileDescriptor.open(
                out,
                ParcelFileDescriptor.MODE_CREATE
                        | ParcelFileDescriptor.MODE_TRUNCATE
                        | ParcelFileDescriptor.MODE_WRITE_ONLY);
    }

    @Override
    public Bundle call(String method, String arg, Bundle extras) {
        Bundle result = new Bundle();
        if (METHOD_SCAN.equals(method)) {
            File file = TextUtils.isEmpty(arg) ? null : resolveOutputFile(Uri.parse("content://x/" + arg));
            if (file == null && !TextUtils.isEmpty(lastPath)) {
                file = new File(lastPath);
            }
            if (file != null) {
                scan(file);
                result.putString("path", file.getAbsolutePath());
                result.putBoolean("exists", file.exists());
                result.putLong("length", file.exists() ? file.length() : -1L);
            }
            return result;
        }
        if (METHOD_LAST_PATH.equals(method)) {
            result.putString("path", lastPath);
            return result;
        }
        return super.call(method, arg, extras);
    }

    private File resolveOutputFile(Uri uri) throws FileNotFoundException {
        String name = uri.getLastPathSegment();
        if (TextUtils.isEmpty(name)) {
            throw new FileNotFoundException("missing filename");
        }
        name = name.replace('\\', '_').replace('/', '_');
        while (name.startsWith(".")) {
            name = name.substring(1);
        }
        if (TextUtils.isEmpty(name)) {
            throw new FileNotFoundException("invalid filename");
        }
        File dcim = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM);
        return new File(new File(dcim, "Camera"), name);
    }

    private void scan(File file) {
        Context context = getContext();
        if (context == null) {
            return;
        }
        String path = file.getAbsolutePath();
        MediaScannerConnection.scanFile(context, new String[]{path}, null, null);
        Intent intent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, Uri.fromFile(file));
        context.sendBroadcast(intent);
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, file.getName());
    }

    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) { return null; }
    @Override public String getType(Uri uri) { return null; }
    @Override public Uri insert(Uri uri, ContentValues values) { return null; }
    @Override public int delete(Uri uri, String selection, String[] selectionArgs) { return 0; }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { return 0; }
}
