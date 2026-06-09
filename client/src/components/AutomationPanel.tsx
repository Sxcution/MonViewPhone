import React, { useState, useEffect, useRef } from 'react';
import { Settings, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { loadAppActions, type AutomationAppId } from '@/lib/automationData';

const AUTOMATION_APPS: Array<{ id: AutomationAppId; label: string; icon: string }> = [
  { id: 'wechat', label: 'Wechat', icon: '/automation-icons/WechatIcon.png' },
  { id: 'line', label: 'Line', icon: '/automation-icons/LINE_New_App_Icon_(2020-12).png' },
  { id: 'tantan', label: 'Tantan', icon: '/automation-icons/TantanIcon.png' },
  { id: 'setting', label: 'Setting', icon: '/automation-icons/setting.png' },
];

export function AutomationPanel({
  onOpenSettings,
  playAppAction,
}: {
  onOpenSettings: () => void;
  playAppAction: (appId: string, actionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem('rightPanel.automationOpen') !== 'false';
    } catch {
      return true;
    }
  });

  const [quickActions, setQuickActions] = useState<Array<{ appId: string; actionId: string } | null>>(() => {
    try {
      const raw = localStorage.getItem('automationQuickSlotsV1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [null];
  });

  const [activeDropdownIdx, setActiveDropdownIdx] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ idx: number; x: number; y: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('rightPanel.automationOpen', String(expanded));
    } catch {}
  }, [expanded]);

  useEffect(() => {
    try {
      localStorage.setItem('automationQuickSlotsV1', JSON.stringify(quickActions));
    } catch {}
  }, [quickActions]);

  // Click outside to close dropdown / context menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (activeDropdownIdx !== null && dropdownRef.current && !dropdownRef.current.contains(target)) {
        setActiveDropdownIdx(null);
      }
      if (contextMenu !== null && !target.closest('.automationContextMenuPanel')) {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [activeDropdownIdx, contextMenu]);

  // Load available actions from localStorage
  const getAvailableActions = () => {
    try {
      const appActions = loadAppActions();
      return Object.entries(appActions).flatMap(([appId, actions]) =>
        actions.map(action => ({
          appId: appId as AutomationAppId,
          actionId: action.id,
          actionName: action.name,
          appIcon: AUTOMATION_APPS.find(app => app.id === appId)?.icon || '',
        }))
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const handleSelectAction = (idx: number, appId: string, actionId: string) => {
    setQuickActions(prev => {
      const next = [...prev];
      next[idx] = { appId, actionId };
      if (idx === prev.length - 1) {
        next.push(null);
      }
      return next;
    });
    setActiveDropdownIdx(null);
  };

  const handleRemoveAction = (idx: number) => {
    setQuickActions(prev => {
      let next = prev.filter((_, i) => i !== idx);
      if (next.length === 0 || next[next.length - 1] !== null) {
        next.push(null);
      }
      return next;
    });
    setContextMenu(null);
  };

  const availableActions = getAvailableActions();

  return (
    <div className={`rcpSection${expanded ? '' : ' rcpSectionCollapsed'}`}>
      <div className='rcpTitleBar'>
        <div className='rcpTitle'>Automation</div>
        <div className='rcpTitleActions'>
          <button
            type='button'
            className='rcpIconBtn'
            title='Setting'
            onClick={onOpenSettings}
            style={{ marginRight: 4 }}
          >
            <Settings size={14} strokeWidth={2} />
          </button>
          <button
            type='button'
            className='rcpIconBtn'
            title={expanded ? 'Collapse' : 'Expand'}
            onClick={() => setExpanded(prev => !prev)}
          >
            {expanded ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div className={`rcpAutomationGrid${expanded ? '' : ' rcpCollapsedBody'}`}>
        {quickActions.map((slot, idx) => {
          if (!slot) {
            const isDropdownOpen = activeDropdownIdx === idx;
            return (
              <div key={`slot-empty-${idx}`} style={{ position: 'relative' }}>
                <button
                  type='button'
                  className='rcpAutomationBtn empty'
                  onClick={() => setActiveDropdownIdx(isDropdownOpen ? null : idx)}
                >
                  <Plus size={16} />
                </button>
                {isDropdownOpen && (
                  <div className='rcpAutomationSelectDropdown' ref={dropdownRef}>
                    {availableActions.map(act => (
                      <button
                        key={`${act.appId}-${act.actionId}`}
                        type='button'
                        className='rcpAutomationSelectOption'
                        onClick={() => handleSelectAction(idx, act.appId, act.actionId)}
                      >
                        <img src={act.appIcon} alt='' />
                        <span>{act.actionName}</span>
                      </button>
                    ))}
                    {!availableActions.length && (
                      <div style={{ padding: '8px', fontSize: '11px', color: '#888', textAlign: 'center' }}>
                        Chưa có hành động con
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          const app = AUTOMATION_APPS.find(a => a.id === slot.appId);
          let actionName = slot.actionId;
          try {
            const appActions = loadAppActions();
            const action = appActions[slot.appId as AutomationAppId]?.find((a: any) => a.id === slot.actionId);
            if (action) actionName = action.name;
          } catch {}

          return (
            <div key={`slot-filled-${idx}`} style={{ position: 'relative' }}>
              <button
                type='button'
                className='rcpAutomationBtn'
                onClick={() => playAppAction(slot.appId, slot.actionId)}
                onContextMenu={e => {
                  e.preventDefault();
                  setContextMenu({ idx, x: e.clientX, y: e.clientY });
                }}
                title={actionName}
              >
                {app && <img src={app.icon} alt='' />}
                <span>{actionName}</span>
              </button>
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <div
          className='automationContextMenuPanel contextMenuPanel dropdown-menu show'
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 30000 }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            type='button'
            className='automationContextMenuItem dropdown-item'
            onClick={() => {
              const slot = quickActions[contextMenu.idx];
              if (slot) playAppAction(slot.appId, slot.actionId);
              setContextMenu(null);
            }}
          >
            <span>Chạy hành động</span>
          </button>
          <div className='automationContextMenuDivider' />
          <button
            type='button'
            className='automationContextMenuItem automationContextMenuDanger dropdown-item'
            onClick={() => handleRemoveAction(contextMenu.idx)}
          >
            <span>Gỡ khỏi panel</span>
          </button>
        </div>
      )}
    </div>
  );
}
