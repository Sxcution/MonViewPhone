package android.content;

import android.os.Binder;
import android.os.IBinder;
import android.os.IInterface;
import android.os.Parcel;
import android.os.RemoteException;

/* JADX INFO: loaded from: classes.dex */
public interface IOnPrimaryClipChangedListener extends IInterface {

    public static class Default implements IOnPrimaryClipChangedListener {
        @Override // android.os.IInterface
        public IBinder asBinder() {
            return null;
        }

        @Override // android.content.IOnPrimaryClipChangedListener
        public void dispatchPrimaryClipChanged() throws RemoteException {
        }
    }

    void dispatchPrimaryClipChanged() throws RemoteException;

    public static abstract class Stub extends Binder implements IOnPrimaryClipChangedListener {
        private static final String DESCRIPTOR = "android.content.IOnPrimaryClipChangedListener";
        static final int TRANSACTION_dispatchPrimaryClipChanged = 1;

        @Override // android.os.IInterface
        public IBinder asBinder() {
            return this;
        }

        public Stub() {
            attachInterface(this, DESCRIPTOR);
        }

        public static IOnPrimaryClipChangedListener asInterface(IBinder iBinder) {
            if (iBinder == null) {
                return null;
            }
            IInterface iInterfaceQueryLocalInterface = iBinder.queryLocalInterface(DESCRIPTOR);
            if (iInterfaceQueryLocalInterface != null && (iInterfaceQueryLocalInterface instanceof IOnPrimaryClipChangedListener)) {
                return (IOnPrimaryClipChangedListener) iInterfaceQueryLocalInterface;
            }
            return new Proxy(iBinder);
        }

        @Override // android.os.Binder
        public boolean onTransact(int i, Parcel parcel, Parcel parcel2, int i2) throws RemoteException {
            if (i == 1) {
                parcel.enforceInterface(DESCRIPTOR);
                dispatchPrimaryClipChanged();
                return true;
            }
            if (i == 1598968902) {
                parcel2.writeString(DESCRIPTOR);
                return true;
            }
            return super.onTransact(i, parcel, parcel2, i2);
        }

        private static class Proxy implements IOnPrimaryClipChangedListener {
            public static IOnPrimaryClipChangedListener sDefaultImpl;
            private IBinder mRemote;

            public String getInterfaceDescriptor() {
                return Stub.DESCRIPTOR;
            }

            Proxy(IBinder iBinder) {
                this.mRemote = iBinder;
            }

            @Override // android.os.IInterface
            public IBinder asBinder() {
                return this.mRemote;
            }

            @Override // android.content.IOnPrimaryClipChangedListener
            public void dispatchPrimaryClipChanged() throws RemoteException {
                Parcel parcelObtain = Parcel.obtain();
                try {
                    parcelObtain.writeInterfaceToken(Stub.DESCRIPTOR);
                    if (this.mRemote.transact(1, parcelObtain, null, 1) || Stub.getDefaultImpl() == null) {
                        return;
                    }
                    Stub.getDefaultImpl().dispatchPrimaryClipChanged();
                } finally {
                    parcelObtain.recycle();
                }
            }
        }

        public static boolean setDefaultImpl(IOnPrimaryClipChangedListener iOnPrimaryClipChangedListener) {
            if (Proxy.sDefaultImpl != null || iOnPrimaryClipChangedListener == null) {
                return false;
            }
            Proxy.sDefaultImpl = iOnPrimaryClipChangedListener;
            return true;
        }

        public static IOnPrimaryClipChangedListener getDefaultImpl() {
            return Proxy.sDefaultImpl;
        }
    }
}
