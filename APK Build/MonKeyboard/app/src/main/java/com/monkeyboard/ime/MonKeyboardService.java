package com.monkeyboard.ime;

import android.inputmethodservice.InputMethodService;
import android.view.View;

public class MonKeyboardService extends InputMethodService {

    @Override
    public View onCreateInputView() {
        return getLayoutInflater().inflate(R.layout.keyboard_view, null);
    }

    @Override
    public boolean onEvaluateFullscreenMode() {
        // Không chiếm toàn màn hình
        return false;
    }

    @Override
    public boolean onEvaluateInputViewShown() {
        // Luôn hiển thị thanh nhỏ (không ẩn hoàn toàn)
        return true;
    }

    @Override
    public boolean onShowInputRequested(int flags, boolean configChange) {
        return true;
    }
}
