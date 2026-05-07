import React from 'react';
import { useI18n } from '@/context/I18nContext';
import { useSyncStore } from '@/store/useSyncStore';

type Props = {
  orderedUdids?: string[];
};

export function SyncPanel({ orderedUdids }: Props) {
  const { t } = useI18n();
  const {
    syncAll,
    setSyncAll,
    syncMain,
    setSyncMain,
    syncTargets,
    toggleSyncTarget,
    followerCandidates,
    allFollowersChecked,
    toggleAllFollowers,
    stopSync,
    orderedUdids: sortedUdids,
  } = useSyncStore(orderedUdids);

  const idToNumber = React.useMemo(() => {
    const map = new Map<string, number>();
    sortedUdids.forEach((id, idx) => map.set(id, idx + 1));
    return map;
  }, [sortedUdids]);

  return (
    <div className='rcpSection'>
      <div className='rcpDeviceHeader'>
        <span className='rcpDeviceTitle'>{t('Nhóm thiết bị')}</span>
        <label className={`rcpSelectPill${allFollowersChecked ? ' on' : ''}`}>
          <input
            type='checkbox'
            checked={allFollowersChecked}
            onChange={(e) => toggleAllFollowers(e.target.checked)}
          />
          <span className='rcpSelectIcon'>{allFollowersChecked ? '✔' : ''}</span>
          <span className='rcpSelectText'>
            {allFollowersChecked ? t('Bỏ tất cả') : t('Chọn tất cả')}
          </span>
          <span className='rcpSelectCount'>({sortedUdids.length})</span>
        </label>
      </div>
      <div className='rcpGridWrap'>
        <div className='rcpGrid rcpGridCompact'>
          {sortedUdids.map((id) => (
            <label key={id} className={`rcpGridItem${syncTargets.includes(id) ? ' on' : ''}`}>
              <input type='checkbox' checked={syncTargets.includes(id)} onChange={() => toggleSyncTarget(id)} />
              <span>{String(idToNumber.get(id) || 0).padStart(2, '0')}</span>
            </label>
          ))}
        </div>
        {!sortedUdids.length ? <div className='rcpHint'>{t('Chưa có device')}</div> : null}
      </div>
    </div>
  );
}
