package com.genymobile.scrcpy.wrappers;

import android.os.IInterface;
import android.view.InputEvent;
import com.genymobile.scrcpy.Ln;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/* JADX INFO: loaded from: classes.dex */
public final class InputManager {
    public static final int INJECT_INPUT_EVENT_MODE_ASYNC = 0;
    public static final int INJECT_INPUT_EVENT_MODE_WAIT_FOR_FINISH = 2;
    public static final int INJECT_INPUT_EVENT_MODE_WAIT_FOR_RESULT = 1;
    private static Method setDisplayIdMethod;
    private Method injectInputEventMethod;
    private final IInterface manager;

    public InputManager(IInterface iInterface) {
        this.manager = iInterface;
    }

    private Method getInjectInputEventMethod() throws NoSuchMethodException {
        if (this.injectInputEventMethod == null) {
            this.injectInputEventMethod = this.manager.getClass().getMethod("injectInputEvent", InputEvent.class, Integer.TYPE);
        }
        return this.injectInputEventMethod;
    }

    public boolean injectInputEvent(InputEvent inputEvent, int i) {
        try {
            return ((Boolean) getInjectInputEventMethod().invoke(this.manager, inputEvent, Integer.valueOf(i))).booleanValue();
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Could not invoke method", e);
            return false;
        }
    }

    private static Method getSetDisplayIdMethod() throws NoSuchMethodException {
        if (setDisplayIdMethod == null) {
            setDisplayIdMethod = InputEvent.class.getMethod("setDisplayId", Integer.TYPE);
        }
        return setDisplayIdMethod;
    }

    public static boolean setDisplayId(InputEvent inputEvent, int i) {
        try {
            getSetDisplayIdMethod().invoke(inputEvent, Integer.valueOf(i));
            return true;
        } catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException e) {
            Ln.e("Cannot associate a display id to the input event", e);
            return false;
        }
    }
}
