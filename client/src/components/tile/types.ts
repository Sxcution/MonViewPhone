import type { StreamConfig, StreamMode } from '@/lib/config';
import type { DeviceAccountData } from '@/lib/deviceAccountVault';

export type StreamReloadOptions = {
    silent?: boolean;
    restart?: boolean;
};

export type ConnectionMode = 'adb' | 'wifi';
export type ConnectionState = ConnectionMode | 'unknown';

/**
 * Minimal props for a single device tile (stream + basic actions).
 */
export type TileProps = {
    udid: string;
    deviceParam: string | null;
    streamUdid?: string;
    connectionMode?: ConnectionState;
    wsServer: string;
    streamConfig: StreamConfig;
    streamMode?: StreamMode;
    order?: number;
    isViewing?: boolean;
    selected?: boolean;
    showTileInfo?: boolean;
    isDisconnected?: boolean;
    visualAlertActive?: boolean;
    onClearVisualAlert?: (udid: string) => void;
    onRegisterReload?: (udid: string, reload: (opts?: StreamReloadOptions) => void) => void;
    onUnregisterReload?: (udid: string) => void;
    onViewDevice?: (udid: string) => void;
    onMove?: (udid: string, toIndex: number) => void;
    onChangeOrderNumber?: (udid: string, nextNumber: number) => void;
    onDragStart?: (udid: string) => void;
    onDragEnd?: () => void;
    showAccountOverlay?: boolean;
    orderMap?: Map<string, number>;
    accountData?: DeviceAccountData;
    isFilteredOut?: boolean;
    activeFilter?: string;
    highlightFilterMatched?: 'blue' | 'orange' | 'red' | 'yellow' | 'white' | 'green' | boolean;
    onOpenDeviceViewer?: (udid: string) => void;
};
