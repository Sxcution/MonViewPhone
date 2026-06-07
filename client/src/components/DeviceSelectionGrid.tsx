import type React from 'react';

export type DeviceSelectionGridItem = {
  udid: string;
  label: string;
  title?: string;
  className?: string;
};

type DeviceSelectionGridProps = {
  devices: DeviceSelectionGridItem[];
  selectedUdids: ReadonlySet<string>;
  className?: string;
  emptyText?: string;
  onToggleDevice: (udid: string, checked: boolean) => void;
  onDeviceContextMenu?: (event: React.MouseEvent<HTMLLabelElement>, udid: string) => void;
};

export function DeviceSelectionGrid({
  devices,
  selectedUdids,
  className = '',
  emptyText,
  onToggleDevice,
  onDeviceContextMenu,
}: DeviceSelectionGridProps) {
  return (
    <div className={`rcpGrid rcpGridCompact${className ? ` ${className}` : ''}`}>
      {devices.map(device => (
        <label
          key={device.udid}
          className={`rcpGridItem${selectedUdids.has(device.udid) ? ' on' : ''}${device.className ? ` ${device.className}` : ''}`}
          title={device.title ?? device.udid}
          onContextMenu={event => onDeviceContextMenu?.(event, device.udid)}
        >
          <input
            type='checkbox'
            className='sr-only'
            checked={selectedUdids.has(device.udid)}
            onChange={event => onToggleDevice(device.udid, event.target.checked)}
          />
          <span>{device.label}</span>
        </label>
      ))}
      {!devices.length && emptyText ? <div className='automationEmpty'>{emptyText}</div> : null}
    </div>
  );
}
