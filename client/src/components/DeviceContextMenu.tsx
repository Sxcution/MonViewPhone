import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { ContextMenuLayer, ModalLayer } from '@/components/ui'
import { Plus, Trash2, Users } from 'lucide-react'
import {
  loadDeviceProfiles,
  saveDeviceProfiles,
  type AutomationDeviceProfile,
} from '@/lib/automationData'
import {
  getDeviceAccountData,
  loadDeviceAccountVault,
  saveDeviceAccountData,
} from '@/lib/deviceAccountVault'
import type { GoogDeviceDescriptor } from '@/lib/serverApi'

type ContextMenuTarget = {
  x: number
  y: number
  udid: string
  groupIdx?: number
  sourceGrid?: 'main' | 'group'
}

type SavedDeviceGroup = {
  name: string
  udids: string[]
  selectedAccounts?: Record<string, string>
}

type ConfirmRequest = {
  title: string
  message: string
  danger?: boolean
  onConfirm: () => void
}

type CtxSubState = 'profileList' | 'setAccountList' | null

type InputState = {
  key: string
  title: string
  label?: string
  placeholder?: string
  defaultValue?: string
  onConfirm: (value: string) => void
} | null

type DeviceContextMenuProps = {
  target: ContextMenuTarget
  initialOrder: number
  selectedUdids: Set<string>
  setSelectedUdids: Dispatch<SetStateAction<Set<string>>>
  androidDeviceMap: Record<string, GoogDeviceDescriptor>
  savedGroups: SavedDeviceGroup[]
  setSavedGroups: Dispatch<SetStateAction<SavedDeviceGroup[]>>
  activeGroupIdx: number | null
  focusGroupIdx: number | null
  onSetTileNumber: (udid: string, order: number) => void
  onRemoveDevices: (udids: string[]) => void
  requestConfirm: (request: ConfirmRequest) => void
  onVaultReload: () => void
  onClose: () => void
}

export function DeviceContextMenu({
  target,
  initialOrder,
  selectedUdids,
  setSelectedUdids,
  androidDeviceMap,
  savedGroups,
  setSavedGroups,
  activeGroupIdx,
  focusGroupIdx,
  onSetTileNumber,
  onRemoveDevices,
  requestConfirm,
  onVaultReload,
  onClose,
}: DeviceContextMenuProps) {
  const [ctxSub, setCtxSub] = useState<CtxSubState>(null)
  const [inputState, setInputState] = useState<InputState>(null)
  const [deviceProfiles, setDeviceProfiles] = useState<AutomationDeviceProfile[]>(loadDeviceProfiles)
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const [contextMenuInput, setContextMenuInput] = useState(String(initialOrder))

  // /* assignDevicesToProfile : Gán các thiết bị vào profile */
  const assignDevicesToProfile = useCallback((profileId: string, targetUdids: string[]) => {
    setDeviceProfiles(prev => {
      const next = prev.map(p => ({
        ...p,
        udids: p.id === profileId
          ? [...new Set([...p.udids, ...targetUdids])]
          : p.udids.filter(u => !targetUdids.includes(u)),
        updatedAt: p.id === profileId ? Date.now() : p.updatedAt,
      }));
      saveDeviceProfiles(next);
      return next;
    });
  }, []);

  return (
    <>
      <ContextMenuLayer
        isOpen={true}
        x={target.x}
        y={target.y}
        onClose={() => {
          onClose()
          setSubMenuOpen(false)
        }}
        className={`uiMenuSurface${target.x >= window.innerWidth / 2 ? ' uiMenuSurfaceOpenLeft' : ''}`}
      >
        {/* Header: Device # + input số inline trong suốt */}
        <div className="uiMenuHeader">
          <span className="uiMenuHeaderLabel">Device</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={contextMenuInput}
            onChange={e => {
              // Chỉ cho nhập số
              const val = e.target.value.replace(/[^0-9]/g, '')
              setContextMenuInput(val)
            }}
            className="uiMenuNumberInput"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const n = Math.max(1, parseInt(contextMenuInput, 10))
                if (!isNaN(n)) onSetTileNumber(target!.udid, n)
                onClose()
              }
            }}
            onBlur={() => {
              const n = Math.max(1, parseInt(contextMenuInput, 10))
              if (!isNaN(n)) onSetTileNumber(target!.udid, n)
            }}
            data-inspector-id="deviceContext.numberInput"
            data-inspector-label="Device tile numbering input field"
            data-inspector-component="client/src/components/DeviceContextMenu.tsx"
          />
        </div>

        {/* === Device Profile section === */}
        <div className="uiMenuBranch" onMouseEnter={() => setCtxSub('profileList')} onMouseLeave={() => setCtxSub(null)}>
          <button
            className="uiMenuItem uiMenuItemAccent"
            data-inspector-id="deviceContext.profileSubmenu"
            data-inspector-label="Device context menu item: Select profile submenu trigger"
            data-inspector-component="client/src/components/DeviceContextMenu.tsx"
          >
              <span className="uiMenuItemMain">
                <Users size={14} className="uiMenuItemIcon" />
              <span className="uiMenuItemLabel">Chọn profile</span>
            </span>
            <span className="uiMenuArrow">▶</span>
          </button>

          {/* Level 2 Submenu: Profile list */}
          {ctxSub === 'profileList' && (
            <div
              className="uiMenuSubmenu uiMenuSubmenuWide"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              {deviceProfiles.map(profile => {
                const clickedUdid = target!.udid;
                const ctxTargets = selectedUdids.size > 0 && selectedUdids.has(clickedUdid)
                  ? Array.from(selectedUdids)
                  : [clickedUdid];
                const isCurrentProfile = profile.udids.includes(clickedUdid);

                return (
                  <button
                    key={profile.id}
                    type="button"
                    className={`uiMenuItem${isCurrentProfile ? ' uiMenuItemActive' : ''}`}
                    onPointerDown={e => {
                      e.preventDefault(); e.stopPropagation();
                      if (isCurrentProfile) return;
                      assignDevicesToProfile(profile.id, ctxTargets);
                      onClose();
                    }}
                    data-inspector-id="deviceContext.profileItem"
                    data-inspector-label={`Device context menu item: Assign to profile ${profile.name}`}
                    data-inspector-component="client/src/components/DeviceContextMenu.tsx"
                  >
                    <span className="uiMenuItemLabel">{profile.name}</span>
                    {isCurrentProfile ? <span className="uiMenuMeta uiMenuMetaAccent">Đang dùng</span> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* === Thêm vào nhóm (submenu) — hiện khi có nhóm đã tạo === */}
        {savedGroups.length > 0 && (
          <div className="uiMenuBranch" onMouseEnter={() => setSubMenuOpen(true)} onMouseLeave={() => setSubMenuOpen(false)}>
            <button
              className="uiMenuItem uiMenuItemAccent"
            >
              <span>Thêm vào nhóm</span>
              <span className="uiMenuArrow">▶</span>
            </button>
            {/* Submenu nhóm */}
            {subMenuOpen && (
              <div className="uiMenuSubmenu uiMenuSubmenuNarrow">
                {savedGroups.map((grp, gIdx) => {
                  const alreadyIn = grp.udids.includes(target.udid)
                  return (
                    <button
                      key={gIdx}
                      className="uiMenuItem"
                      disabled={alreadyIn}
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (alreadyIn) return

                        // Lấy tất cả device đang được chọn (selectedUdids)
                        // Nếu device click chuột phải không nằm trong selection → chỉ thêm 1 device đó
                        // Nếu device click chuột phải nằm trong selection → thêm tất cả device đang chọn
                        const clickedUdid = target!.udid
                        const targetUdids = selectedUdids.size > 0 && selectedUdids.has(clickedUdid)
                          ? Array.from(selectedUdids)
                          : [clickedUdid]

                        setSavedGroups(prev => prev.map((g, i) => {
                          if (i !== gIdx) return g
                          // Gộp, loại trùng
                          const existingSet = new Set(g.udids)
                          const toAdd = targetUdids.filter(u => !existingSet.has(u))
                          return { ...g, udids: [...g.udids, ...toAdd] }
                        }))

                        onClose()
                      }}
                    >
                      <span>{grp.name}</span>
                      <span className="uiMenuMeta">
                        {(() => {
                          const clickedUdid = target!.udid
                          const targetUdids = selectedUdids.size > 0 && selectedUdids.has(clickedUdid)
                            ? Array.from(selectedUdids)
                            : [clickedUdid]
                          const existingSet = new Set(grp.udids)
                          const countToAdd = targetUdids.filter(u => !existingSet.has(u)).length
                          if (alreadyIn && countToAdd === 0) return '✓ Đã có'
                          return countToAdd > 1 ? `+${countToAdd} device` : alreadyIn ? '✓ Đã có' : `+1`
                        })()}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* === Set WeChat Account (ONLY shown when sourceGrid === 'group') === */}
        {target.sourceGrid === 'group' && (
          <div
            className="uiMenuBranch"
            onMouseEnter={() => setCtxSub('setAccountList')}
            onMouseLeave={() => setCtxSub(null)}
          >
            <button
              className="uiMenuItem uiMenuItemWarning"
            >
              <span className="uiMenuItemMain">
                <Plus size={14} className="uiMenuItemIcon" />
                <span className="uiMenuItemLabel">
                  Set
                </span>
              </span>
              <span className="uiMenuArrow">▶</span>
            </button>

            {ctxSub === 'setAccountList' && (() => {
              const clickedUdid = target!.udid;
              const devData = getDeviceAccountData(clickedUdid);
              const accounts = devData?.platforms?.['wechat'] || [];
              const groupIdx = target!.groupIdx;
              const group = groupIdx !== undefined ? savedGroups[groupIdx] : null;
              const groupSelectedAccounts = group?.selectedAccounts || {};
              const selectedId = groupSelectedAccounts[clickedUdid];

              return (
                <div
                  className="uiMenuSubmenu uiMenuSubmenuWide"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  {accounts.length === 0 ? (
                    <div className="uiMenuEmpty">
                      Không có tài khoản
                    </div>
                  ) : (
                    accounts.map(account => {
                      const isCurrent = selectedId === account.id;
                      return (
                        <button
                          key={account.id}
                          type='button'
                          className={`uiMenuItem${isCurrent ? ' uiMenuItemWarning' : ''}`}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const isDeselect = selectedId === account.id;

                            if (!isDeselect) {
                              const today = Date.now();
                              const date = new Date(today);
                              const todayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                              
                              const updatedPlatforms = { ...devData.platforms };
                              if (updatedPlatforms['wechat']) {
                                updatedPlatforms['wechat'] = updatedPlatforms['wechat'].map(acc => {
                                  if (acc.id === account.id) {
                                    const history = acc.history || [];
                                    const alreadyLoggedInToday = history.some(
                                      h => h.action === 'Login' && (
                                        (() => {
                                          const hd = new Date(h.timestamp);
                                          const hdStr = `${hd.getFullYear()}-${String(hd.getMonth() + 1).padStart(2, '0')}-${String(hd.getDate()).padStart(2, '0')}`;
                                          return hdStr === todayStr;
                                        })()
                                      )
                                    );
                                    if (!alreadyLoggedInToday) {
                                      return {
                                        ...acc,
                                        history: [
                                          ...history,
                                          { id: Math.random().toString(36).substr(2, 9), action: 'Login', timestamp: today }
                                        ]
                                      };
                                    }
                                  }
                                  return acc;
                                });
                              }
                              
                              const newData = {
                                ...devData,
                                platforms: updatedPlatforms,
                              };
                              saveDeviceAccountData(clickedUdid, newData);
                            }
                            
                            // Update group selection
                            setSavedGroups(prev => prev.map((g, i) => {
                              if (i !== groupIdx) return g;
                              const selAcc = { ...(g.selectedAccounts || {}) };
                              if (isDeselect) {
                                delete selAcc[clickedUdid];
                              } else {
                                selAcc[clickedUdid] = account.id;
                              }
                              return { ...g, selectedAccounts: selAcc };
                            }));
                            
                            // Trigger state refresh in App.tsx
                            onVaultReload();
                            
                            // Dispatch event to refresh tiles and overlays
                            window.dispatchEvent(new CustomEvent('monviewphone:dav-hide-settings-changed'));
                            
                            onClose();
                          }}
                        >
                          <span className="uiMenuItemLabel">
                            {account.name || account.phone || account.nickname || 'Không tên'}
                          </span>
                          {isCurrent ? <span className="uiMenuMeta uiMenuMetaWarning">✓ Đang chọn</span> : null}
                        </button>
                      );
                    })
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {target.groupIdx === undefined ? (
          <button
            className="uiMenuItem uiMenuItemDanger"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();

              const { udid } = target!;
              requestConfirm({
                title: 'Xoá thiết bị?',
                message: 'Bạn có chắc chắn muốn xoá thiết bị này hoàn toàn khỏi hệ thống không?',
                danger: true,
                onConfirm: () => {
                  onRemoveDevices([udid]);
                }
              });

              onClose();
              setSubMenuOpen(false);
            }}
          >
            <Trash2 size={14} />
            <span>Xoá Máy</span>
          </button>
        ) : null}

        {/* === Xoá khỏi nhóm — hiện khi click từ grid dropdown nhóm, HOẶC khi đang load nhóm và click từ grid tổng === */}
        {target.groupIdx !== undefined && (() => {
          const grp = savedGroups[target.groupIdx]
          const isInGroup = grp?.udids.includes(target.udid)
          if (!isInGroup) return null
          return (
            <button
              className="uiMenuItem uiMenuItemDanger"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();

                const { udid, groupIdx } = target!;
                if (groupIdx === undefined) return;
                const groupName = savedGroups[groupIdx]?.name || '';

                requestConfirm({
                  title: 'Xoá khỏi nhóm?',
                  message: `Bạn có chắc chắn muốn xoá device này khỏi nhóm "${groupName}" không?`,
                  danger: true,
                  onConfirm: () => {
                    setSavedGroups(prev =>
                      prev.map((g, i) =>
                        i === groupIdx
                          ? { ...g, udids: g.udids.filter(u => u !== udid) }
                          : g
                      )
                    );

                    if (activeGroupIdx === groupIdx || focusGroupIdx === groupIdx) {
                      setSelectedUdids(prev => {
                        const next = new Set(prev);
                        next.delete(udid);
                        return next;
                      });
                    }
                  }
                });

                onClose();
                setSubMenuOpen(false);
              }}
            >
              <Trash2 size={14} />
              <span>Xoá khỏi nhóm <strong className="uiMenuMeta uiMenuMetaDanger">"{savedGroups[target.groupIdx!]?.name}"</strong></span>
            </button>
          );
        })()}
      </ContextMenuLayer>
      {inputState && (
        <InputModalOverlay state={inputState} onClose={() => setInputState(null)} />
      )}
    </>
  )
}

interface InputModalOverlayProps {
  state: {
    key: string;
    title: string;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    onConfirm: (val: string) => void;
  } | null;
  onClose: () => void;
}

function InputModalOverlay({ state, onClose }: InputModalOverlayProps) {
  if (!state) return null;
  return <InputModalOverlayInner key={state.key} state={state} onClose={onClose} />;
}

function InputModalOverlayInner({ state, onClose }: { state: NonNullable<InputModalOverlayProps['state']>; onClose: () => void }) {
  const [value, setValue] = useState(state.defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    const v = value.trim();
    if (!v) return;
    state.onConfirm(v);
  };

  return (
    <ModalLayer isOpen={true} onClose={onClose} level="confirm">
      <div 
        className="confirmPanel" 
        style={{ minWidth: 380, maxWidth: 480 }} 
        data-inspector-id="genericInput.panel"
        data-inspector-label="Generic input modal card panel"
        data-inspector-component="client/src/components/DeviceContextMenu.tsx"
      >
        <div 
          className="confirmTitle"
          data-inspector-id="genericInput.title"
          data-inspector-label="Generic input modal title"
          data-inspector-component="client/src/components/DeviceContextMenu.tsx"
        >
          {state.title}
        </div>
        <div className="confirmText">
          {state.label ? <label className="modalLabelSmall" style={{ display: 'block', marginBottom: 8 }}>{state.label}</label> : null}
          <input
            ref={inputRef}
            type='text'
            className="modalInput"
            placeholder={state.placeholder ?? ''}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmit();
            }}
            data-inspector-id="genericInput.field"
            data-inspector-label="Generic input text field"
            data-inspector-component="client/src/components/DeviceContextMenu.tsx"
          />
        </div>
        <div className="confirmActions">
          <button 
            type='button' 
            className="modalBtn" 
            onClick={onClose}
            data-inspector-id="genericInput.cancelButton"
            data-inspector-label="Generic input modal cancel button"
            data-inspector-component="client/src/components/DeviceContextMenu.tsx"
          >
            Huỷ
          </button>
          <button
            type='button'
            className="modalBtnPrimary"
            style={{
              opacity: value.trim() ? 1 : 0.5,
              cursor: value.trim() ? 'pointer' : 'not-allowed'
            }}
            disabled={!value.trim()}
            onClick={handleSubmit}
            data-inspector-id="genericInput.confirmButton"
            data-inspector-label="Generic input modal confirm button"
            data-inspector-component="client/src/components/DeviceContextMenu.tsx"
          >
            Xác Nhận
          </button>
        </div>
      </div>
    </ModalLayer>
  );
}
