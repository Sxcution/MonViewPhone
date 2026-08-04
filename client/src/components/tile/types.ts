import type { StreamConfig } from '@/lib/config';
import type { DeviceAccountData } from '@/lib/deviceAccountVault';
import type { ControlMode } from '@/lib/controlMode';

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
    controlMode?: ControlMode;
    streamMode?: any;
    order?: number;
    isViewing?: boolean;
    selected?: boolean;
    showTileInfo?: boolean;
    isDisconnected?: boolean;
    visualAlertActive?: boolean;
    visualAlertLabel?: string;
    visualAlertSource?: 'visual' | 'wechat';
    visualAlertTargetUserId?: number;
    visualAlertTargets?: { userId: number; label: string }[];
    onClearVisualAlert?: (udid: string) => void;
    onAcknowledgeWechatAlert?: (udid: string) => void | Promise<void>;
    onVisualAlertClick?: (udid: string, userId: number) => void | Promise<void>;
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
    search?: string;
    onSyncNovaWechat?: (udids: string[], dataByUdid?: Record<string, DeviceAccountData>, force?: boolean) => Promise<void>;
};
