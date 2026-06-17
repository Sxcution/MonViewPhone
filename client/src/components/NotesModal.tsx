import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Notebook, 
  Plus, 
  Search, 
  Bell, 
  Trash2, 
  X, 
  Type, 
  Calendar,
  Check
} from 'lucide-react';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  reminderTime?: string; // ISO DateTime string
  fontSize?: number; // in pixels
}

interface NotesModalProps {
  initialNoteId?: string | null;
  onClose: () => void;
}

export function NotesModal({ initialNoteId, onClose }: NotesModalProps) {
  // ===== STATE =====
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('monviewphone:notes');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load notes from localStorage', err);
    }
    
    // Seed with a default note if empty
    return [
      {
        id: 'welcome-note',
        title: 'Chào mừng bạn đến với Ghi chú',
        content: 'Đây là nơi bạn có thể lưu trữ các thông tin quan trọng, đặt nhắc nhở và tùy chỉnh font chữ hiển thị.\n\nHãy nhấn nút "+" ở trên cùng bên trái để tạo ghi chú mới!',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        fontSize: 14
      }
    ];
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    if (initialNoteId) return initialNoteId;
    return notes.length > 0 ? notes[0].id : null;
  });

  const [searchQuery, setSearchQuery] = useState('');
  
  // Popover toggles
  const [reminderPopoverOpen, setReminderPopoverOpen] = useState(false);
  const [fontSizePopoverOpen, setFontSizePopoverOpen] = useState(false);

  // Mode: 'date' | 'countdown'
  const [reminderMode, setReminderMode] = useState<'date' | 'countdown'>('date');

  // Custom reminder input states
  const [reminderHour, setReminderHour] = useState('');
  const [reminderMinute, setReminderMinute] = useState('');
  const [reminderDay, setReminderDay] = useState('');
  const [reminderMonth, setReminderMonth] = useState('');
  
  // Countdown inputs
  const [countdownHours, setCountdownHours] = useState('');
  const [countdownMinutes, setCountdownMinutes] = useState('');

  // Refs for click outside
  const reminderRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);

  // Initialize inputs when active note changes or popover opens
  useEffect(() => {
    if (activeNote && activeNote.reminderTime) {
      const d = new Date(activeNote.reminderTime);
      setReminderHour(String(d.getHours()).padStart(2, '0'));
      setReminderMinute(String(d.getMinutes()).padStart(2, '0'));
      setReminderDay(String(d.getDate()).padStart(2, '0'));
      setReminderMonth(String(d.getMonth() + 1).padStart(2, '0'));
    } else {
      const now = new Date();
      setReminderHour('');
      setReminderMinute('');
      setReminderDay(String(now.getDate()).padStart(2, '0'));
      setReminderMonth(String(now.getMonth() + 1).padStart(2, '0'));
    }
    setCountdownHours('');
    setCountdownMinutes('');
  }, [activeNoteId, reminderPopoverOpen]);

  // ===== PERSISTENCE =====
  useEffect(() => {
    localStorage.setItem('monviewphone:notes', JSON.stringify(notes));
    // Trigger custom event to notify other parts of the app if needed
    window.dispatchEvent(new CustomEvent('monviewphone:notes-updated', { detail: notes }));
  }, [notes]);

  // Listen for external updates (e.g. background reminder clearing)
  useEffect(() => {
    const handleExternalUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Note[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        const newNotesStr = JSON.stringify(customEvent.detail);
        if (newNotesStr !== JSON.stringify(notes)) {
          setNotes(customEvent.detail);
        }
      }
    };
    window.addEventListener('monviewphone:notes-updated-internal', handleExternalUpdate);
    return () => window.removeEventListener('monviewphone:notes-updated-internal', handleExternalUpdate);
  }, [notes]);

  // Sync active note selection if initialNoteId changes externally
  useEffect(() => {
    if (initialNoteId) {
      setActiveNoteId(initialNoteId);
    }
  }, [initialNoteId]);

  // Click outside to close popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (reminderRef.current && !reminderRef.current.contains(target)) {
        setReminderPopoverOpen(false);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(target)) {
        setFontSizePopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== COMPUTED STATE =====
  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);



  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return notes
      .filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, searchQuery]);

  // ===== ACTIONS =====
  const handleAddNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Ghi chú mới',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fontSize: 14
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setSearchQuery('');
  };

  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setNotes(prev => {
      const nextNotes = prev.filter(n => n.id !== id);
      if (activeNoteId === id) {
        setActiveNoteId(nextNotes.length > 0 ? nextNotes[0].id : null);
      }
      return nextNotes;
    });
  };

  const handleUpdateNote = (fields: Partial<Note>) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          ...fields,
          updatedAt: Date.now()
        };
      }
      return n;
    }));
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${mins} ${date}/${month}/${year}`;
  };

  const fontSizes = [12, 14, 16, 18, 20, 24];

  // Render Portal Modal overlay
  return createPortal(
    <div 
      className="notesOverlay"
      data-inspector-id="notes.overlay"
      data-inspector-label="Notes modal overlay backdrop"
      data-inspector-component="client/src/components/NotesModal.tsx"
      onMouseDown={onClose}
    >
      <div 
        className="notesPanel"
        data-inspector-id="notes.panel"
        data-inspector-label="Notes modal card panel"
        data-inspector-component="client/src/components/NotesModal.tsx"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* ===== LEFT SIDEBAR: NOTE LIST ===== */}
        <div 
          className="notesSidebar"
          data-inspector-id="notes.sidebar"
          data-inspector-label="Notes list sidebar panel"
          data-inspector-component="client/src/components/NotesModal.tsx"
        >
          <div className="notesSidebarHeader">
            <div 
              style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}
              data-inspector-id="notes.searchWrapper"
              data-inspector-label="Notes search input container"
              data-inspector-component="client/src/components/NotesModal.tsx"
            >
              <Search 
                size={14} 
                style={{ position: 'absolute', left: 10, color: 'var(--md-muted)' }} 
              />
              <input
                type="text"
                className="notesSearchInput"
                style={{ paddingLeft: 30 }}
                placeholder="Tìm ghi chú..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                data-inspector-id="notes.searchInput"
                data-inspector-label="Notes search text input"
                data-inspector-component="client/src/components/NotesModal.tsx"
              />
            </div>
            <button
              className="notesToolbarBtn"
              style={{ padding: '0 12px' }}
              onClick={handleAddNote}
              data-inspector-id="notes.addBtn"
              data-inspector-label="Notes add new note button"
              data-inspector-component="client/src/components/NotesModal.tsx"
            >
              <Plus size={15} />
              <span>Thêm</span>
            </button>
          </div>

          <div 
            className="notesList"
            data-inspector-id="notes.list"
            data-inspector-label="Notes scrollable list container"
            data-inspector-component="client/src/components/NotesModal.tsx"
          >
            {filteredNotes.length === 0 ? (
              <div 
                style={{ padding: '24px', textAlign: 'center', color: 'var(--md-muted)', fontSize: '13px' }}
                data-inspector-id="notes.listEmpty"
                data-inspector-label="Notes list empty placeholder"
                data-inspector-component="client/src/components/NotesModal.tsx"
              >
                Không tìm thấy ghi chú
              </div>
            ) : (
              filteredNotes.map(n => {
                const isActive = n.id === activeNoteId;
                const hasReminder = !!n.reminderTime;
                
                return (
                  <div
                    key={n.id}
                    className={`notesListItem${isActive ? ' active' : ''}`}
                    onClick={() => setActiveNoteId(n.id)}
                    data-inspector-id="notes.listItem"
                    data-inspector-label={`Notes list item: ${n.title}`}
                    data-inspector-component="client/src/components/NotesModal.tsx"
                  >
                    <div className="notesListItemTitle">
                      {n.title.trim() || 'Ghi chú không có tiêu đề'}
                    </div>
                    <div className="notesListItemPreview">
                      {n.content.trim() ? n.content.substring(0, 50) : 'Trống...'}
                    </div>
                    <div className="notesListItemMeta">
                      <span className="notesListItemDate">{formatDate(n.updatedAt)}</span>
                      {hasReminder && (
                        <span title={`Có nhắc nhở lúc: ${formatDate(new Date(n.reminderTime!).getTime())}`}>
                          <Bell 
                            size={11} 
                            style={{ color: 'var(--md-warning)' }} 
                          />
                        </span>
                      )}
                    </div>
                    <button
                      className="notesListItemDelete"
                      onClick={(e) => {
                        if (confirm('Bạn có chắc chắn muốn xóa ghi chú này không?')) {
                          handleDeleteNote(n.id, e);
                        } else {
                          e.stopPropagation();
                        }
                      }}
                      title="Xóa ghi chú"
                      data-inspector-id="notes.listItemDeleteBtn"
                      data-inspector-label={`Notes delete button for item: ${n.title}`}
                      data-inspector-component="client/src/components/NotesModal.tsx"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ===== RIGHT SIDE: EDITOR PANEL ===== */}
        <div 
          className="notesContent"
          data-inspector-id="notes.content"
          data-inspector-label="Notes editor area"
          data-inspector-component="client/src/components/NotesModal.tsx"
        >
          {activeNote ? (
            <>
              {/* Top Editor Toolbar Header */}
              <div className="notesContentHeader">
                <span 
                  style={{ fontSize: '13px', fontWeight: 600, color: 'var(--md-muted)' }}
                  data-inspector-id="notes.headerLabel"
                  data-inspector-label="Active note detail label"
                  data-inspector-component="client/src/components/NotesModal.tsx"
                >
                  Chi tiết ghi chú
                </span>

                <div className="notesToolbar">
                  {/* Reminder Bell Trigger */}
                  <div ref={reminderRef} style={{ position: 'relative' }}>
                    <button
                      className={`notesToolbarBtn${activeNote.reminderTime ? ' active' : ''}`}
                      onClick={() => {
                        setReminderPopoverOpen(!reminderPopoverOpen);
                        setFontSizePopoverOpen(false);
                      }}
                      title="Hẹn giờ nhắc nhở"
                      data-inspector-id="notes.reminderToolbarBtn"
                      data-inspector-label="Active note reminder toggle button"
                      data-inspector-component="client/src/components/NotesModal.tsx"
                    >
                      <Bell size={15} />
                      <span>Thông báo</span>
                    </button>

                    {reminderPopoverOpen && (() => {
                      const isSaveDisabled = reminderMode === 'date' 
                        ? (!reminderHour || !reminderMinute || !reminderDay || !reminderMonth)
                        : (!countdownHours && !countdownMinutes);
                      
                      return (
                        <div 
                          className="notesPopoverOverlay"
                          data-inspector-id="notes.reminderPopover"
                          data-inspector-label="Notes reminder configuration card"
                          data-inspector-component="client/src/components/NotesModal.tsx"
                        >
                          {/* Tabs Header */}
                          <div style={{ display: 'flex', gap: 6, marginBottom: 8, borderBottom: '1px solid var(--md-border)', paddingBottom: 6 }}>
                            <button
                              type="button"
                              className={`notesToolbarBtn${reminderMode === 'date' ? ' active' : ''}`}
                              style={{ height: 26, fontSize: 11, flex: 1, padding: 0 }}
                              onClick={() => setReminderMode('date')}
                              data-inspector-id="notes.reminderModeDateBtn"
                              data-inspector-label="Notes reminder mode date-time button"
                              data-inspector-component="client/src/components/NotesModal.tsx"
                            >
                              Báo thức
                            </button>
                            <button
                              type="button"
                              className={`notesToolbarBtn${reminderMode === 'countdown' ? ' active' : ''}`}
                              style={{ height: 26, fontSize: 11, flex: 1, padding: 0 }}
                              onClick={() => setReminderMode('countdown')}
                              data-inspector-id="notes.reminderModeCountdownBtn"
                              data-inspector-label="Notes reminder mode countdown button"
                              data-inspector-component="client/src/components/NotesModal.tsx"
                            >
                              Hẹn Giờ
                            </button>
                          </div>

                          {reminderMode === 'date' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div className="notesPopoverTitle">Thời gian báo thức</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                                <input
                                  type="number"
                                  placeholder="Giờ"
                                  value={reminderHour}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 23)) {
                                      setReminderHour(v.slice(0, 2));
                                    }
                                  }}
                                  style={{ width: 44, textAlign: 'center', padding: '4px 0' }}
                                  data-inspector-id="notes.reminderHourInput"
                                  data-inspector-label="Notes reminder hour text field"
                                  data-inspector-component="client/src/components/NotesModal.tsx"
                                />
                                <span>:</span>
                                <input
                                  type="number"
                                  placeholder="Phút"
                                  value={reminderMinute}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 59)) {
                                      setReminderMinute(v.slice(0, 2));
                                    }
                                  }}
                                  style={{ width: 44, textAlign: 'center', padding: '4px 0' }}
                                  data-inspector-id="notes.reminderMinuteInput"
                                  data-inspector-label="Notes reminder minute text field"
                                  data-inspector-component="client/src/components/NotesModal.tsx"
                                />
                                <span style={{ margin: '0 4px', color: 'var(--md-muted)' }}>ngày</span>
                                <input
                                  type="number"
                                  placeholder="Ngày"
                                  value={reminderDay}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (v === '' || (parseInt(v) >= 1 && parseInt(v) <= 31)) {
                                      setReminderDay(v.slice(0, 2));
                                    }
                                  }}
                                  style={{ width: 44, textAlign: 'center', padding: '4px 0' }}
                                  data-inspector-id="notes.reminderDayInput"
                                  data-inspector-label="Notes reminder day text field"
                                  data-inspector-component="client/src/components/NotesModal.tsx"
                                />
                                <span>/</span>
                                <input
                                  type="number"
                                  placeholder="Tháng"
                                  value={reminderMonth}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (v === '' || (parseInt(v) >= 1 && parseInt(v) <= 12)) {
                                      setReminderMonth(v.slice(0, 2));
                                    }
                                  }}
                                  style={{ width: 44, textAlign: 'center', padding: '4px 0' }}
                                  data-inspector-id="notes.reminderMonthInput"
                                  data-inspector-label="Notes reminder month text field"
                                  data-inspector-component="client/src/components/NotesModal.tsx"
                                />
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div className="notesPopoverTitle">Đếm ngược thời gian</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                                <input
                                  type="number"
                                  placeholder="Giờ"
                                  value={countdownHours}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (v === '' || parseInt(v) >= 0) {
                                      setCountdownHours(v);
                                    }
                                  }}
                                  style={{ width: 60, textAlign: 'center', padding: '4px 0' }}
                                  data-inspector-id="notes.countdownHoursInput"
                                  data-inspector-label="Notes countdown hours input"
                                  data-inspector-component="client/src/components/NotesModal.tsx"
                                />
                                <span style={{ fontSize: '12px', color: 'var(--md-muted)' }}>giờ</span>
                                <input
                                  type="number"
                                  placeholder="Phút"
                                  value={countdownMinutes}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 59)) {
                                      setCountdownMinutes(v);
                                    }
                                  }}
                                  style={{ width: 60, textAlign: 'center', padding: '4px 0' }}
                                  data-inspector-id="notes.countdownMinutesInput"
                                  data-inspector-label="Notes countdown minutes input"
                                  data-inspector-component="client/src/components/NotesModal.tsx"
                                />
                                <span style={{ fontSize: '12px', color: 'var(--md-muted)' }}>phút</span>
                              </div>
                            </div>
                          )}

                          <div className="notesPopoverActions">
                            <button
                              className="notesToolbarBtn"
                              style={{ height: '28px', fontSize: '11px', background: 'transparent', borderColor: 'transparent' }}
                              onClick={() => {
                                handleUpdateNote({ reminderTime: undefined });
                                setReminderHour('');
                                setReminderMinute('');
                                setCountdownHours('');
                                setCountdownMinutes('');
                                setReminderPopoverOpen(false);
                              }}
                              data-inspector-id="notes.reminderClearBtn"
                              data-inspector-label="Notes reminder clear action button"
                              data-inspector-component="client/src/components/NotesModal.tsx"
                            >
                              Xóa hẹn giờ
                            </button>
                            <button
                              className="notesToolbarBtn"
                              style={{ 
                                height: '28px', 
                                fontSize: '11px', 
                                padding: '0 10px',
                                opacity: isSaveDisabled ? 0.5 : 1,
                                cursor: isSaveDisabled ? 'not-allowed' : 'pointer'
                              }}
                              disabled={isSaveDisabled}
                              onClick={() => {
                                if (reminderMode === 'date') {
                                  const year = new Date().getFullYear();
                                  const hh = parseInt(reminderHour) || 0;
                                  const mm = parseInt(reminderMinute) || 0;
                                  const dd = parseInt(reminderDay) || 1;
                                  const mo = parseInt(reminderMonth) || 1;
                                  
                                  const targetDate = new Date(year, mo - 1, dd, hh, mm, 0);
                                  handleUpdateNote({ reminderTime: targetDate.toISOString() });
                                } else {
                                  const h = parseInt(countdownHours) || 0;
                                  const m = parseInt(countdownMinutes) || 0;
                                  const totalMs = (h * 3600 + m * 60) * 1000;
                                  if (totalMs > 0) {
                                    const targetDate = new Date(Date.now() + totalMs);
                                    handleUpdateNote({ reminderTime: targetDate.toISOString() });
                                  }
                                }
                                setReminderPopoverOpen(false);
                              }}
                              data-inspector-id="notes.reminderSaveBtn"
                              data-inspector-label="Notes reminder save action button"
                              data-inspector-component="client/src/components/NotesModal.tsx"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Font Size Selector Trigger */}
                  <div ref={fontSizeRef} style={{ position: 'relative' }}>
                    <button
                      className="notesToolbarBtn"
                      onClick={() => {
                        setFontSizePopoverOpen(!fontSizePopoverOpen);
                        setReminderPopoverOpen(false);
                      }}
                      title="Cỡ chữ"
                      data-inspector-id="notes.fontSizeToolbarBtn"
                      data-inspector-label="Active note font size config button"
                      data-inspector-component="client/src/components/NotesModal.tsx"
                    >
                      <Type size={15} />
                      <span>Cỡ chữ: {activeNote.fontSize || 14}</span>
                    </button>

                    {fontSizePopoverOpen && (
                      <div 
                        className="notesFontSizeMenu"
                        data-inspector-id="notes.fontSizePopover"
                        data-inspector-label="Notes font size choice panel"
                        data-inspector-component="client/src/components/NotesModal.tsx"
                      >
                        {fontSizes.map(sz => (
                          <div
                            key={sz}
                            className={`notesFontSizeItem${(activeNote.fontSize || 14) === sz ? ' active' : ''}`}
                            onClick={() => {
                              handleUpdateNote({ fontSize: sz });
                              setFontSizePopoverOpen(false);
                            }}
                            data-inspector-id="notes.fontSizeItem"
                            data-inspector-label={`Notes font size option: ${sz}px`}
                            data-inspector-component="client/src/components/NotesModal.tsx"
                          >
                            <span>{sz}px</span>
                            {(activeNote.fontSize || 14) === sz && <Check size={12} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Close Modal button */}
                  <button
                    className="notesCloseBtn"
                    onClick={onClose}
                    title="Đóng ghi chú"
                    data-inspector-id="notes.closeBtn"
                    data-inspector-label="Notes modal close button"
                    data-inspector-component="client/src/components/NotesModal.tsx"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Main Note Text Editor */}
              <div 
                className="notesEditorBody"
                data-inspector-id="notes.editorBody"
                data-inspector-label="Notes active content text container"
                data-inspector-component="client/src/components/NotesModal.tsx"
                style={{ '--note-font-size': `${activeNote.fontSize || 14}px` } as React.CSSProperties}
              >
                <textarea
                  className="notesTextarea"
                  value={activeNote.content}
                  onChange={e => {
                    const newContent = e.target.value;
                    const lines = newContent.split('\n');
                    const derivedTitle = lines[0].trim() || 'Ghi chú mới';
                    handleUpdateNote({
                      content: newContent,
                      title: derivedTitle
                    });
                  }}
                  placeholder="Nhập nội dung ghi chú ở đây..."
                  data-inspector-id="notes.textarea"
                  data-inspector-label="Active note content textarea editor"
                  data-inspector-component="client/src/components/NotesModal.tsx"
                />
              </div>
            </>
          ) : (
            <div 
              className="notesEmptyState"
              data-inspector-id="notes.emptyState"
              data-inspector-label="Notes empty state panel placeholder"
              data-inspector-component="client/src/components/NotesModal.tsx"
            >
              <Notebook size={48} style={{ opacity: 0.2, color: 'var(--md-info)' }} />
              <div>Hãy chọn một ghi chú hoặc tạo mới để bắt đầu.</div>
              <button
                className="notesToolbarBtn"
                style={{ padding: '0 12px' }}
                onClick={handleAddNote}
                data-inspector-id="notes.emptyStateAddBtn"
                data-inspector-label="Notes empty state add button"
                data-inspector-component="client/src/components/NotesModal.tsx"
              >
                <Plus size={15} />
                <span>Tạo ghi chú đầu tiên</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
