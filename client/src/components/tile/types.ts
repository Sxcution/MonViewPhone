import type { StreamConfig } from '@/lib/config';

export type StreamReloadOptions = {
    silent?: boolean;
    restart?: boolean;
};

/**
 * Minimal props for a single device tile (stream + basic actions).
 */
export type TileProps = {
    udid: string;
    deviceParam: string | null;
    wsServer: string;
    streamConfig: StreamConfig;
    order?: number;
    isViewing?: boolean;
    selected?: boolean;
    showTileInfo?: boolean;
    isDisconnected?: boolean;
    visualAlertActive?: boolean;
    onClearVisualAlert?: () => void;
    onRegisterReload?: (udid: string, reload: (opts?: StreamReloadOptions) => void) => void;
    onUnregisterReload?: (udid: string) => void;
    onViewDevice?: (udid: string) => void;
    onMove?: (udid: string, toIndex: number) => void;
    onChangeOrderNumber?: (udid: string, nextNumber: number) => void;
    onDragStart?: (udid: string) => void;
    onDragEnd?: () => void;
};
