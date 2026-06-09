import React, { useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { RotateCw } from 'lucide-react'
import { createPortal } from 'react-dom'

type Props = {
  wsServer: string
}

export function HeaderBar ({ wsServer }: Props) {
  const { t } = useI18n()
  const [restarting, setRestarting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const performRestart = async () => {
    setShowConfirm(false)
    setRestarting(true)
    const host = wsServer.replace('ws://', '').replace('wss://', '').split('/')[0]
    const baseUrl = `http://${host}`

    try {
      await fetch(`${baseUrl}/api/server/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch {
      // Bỏ qua lỗi vì server sẽ shutdown ngay sau đó
    }

    // Polling /health mỗi 1 giây trong tối đa 20 giây
    let attempts = 0
    const maxAttempts = 20
    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`${baseUrl}/health`)
        if (res.ok) {
          clearInterval(interval)
          setRestarting(false)
          // Đợi thêm 1 chút cho các service khác (WS) sẵn sàng rồi reload
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      } catch {
        // Server vẫn đang down
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        setRestarting(false)
        setErrorText(t('Restart thất bại hoặc server không phản hồi sau 20 giây.'))
      }
    }, 1000)
  }

  const handleRestartClick = () => {
    if (restarting) return
    setShowConfirm(true)
  }

  return (
    <div id='header'>
      <div className='headerLeft'>
        <div className='headerBrand' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src='/favicon.png' alt='MonViewPhone Logo' style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
          <h1 className='headerGradientTitle'>MonViewPhone</h1>
        </div>
      </div>

      <div className='headerRight'>
        {/* Nút Restart Server */}
        <button
          className={`headerRestartBtn ${restarting ? 'restarting' : ''}`}
          title={restarting ? 'Đang restart...' : 'Restart Server'}
          onClick={handleRestartClick}
          disabled={restarting}
        >
          <RotateCw
            size={14}
            strokeWidth={2}
            className={restarting ? 'spin' : ''}
          />
          <span>{restarting ? 'Restarting...' : 'Restart'}</span>
        </button>
      </div>

      {showConfirm && createPortal(
        <div className="confirmOverlay" onMouseDown={() => setShowConfirm(false)}>
          <div className="confirmPanel compact" onMouseDown={e => e.stopPropagation()}>
            <div className="confirmTitle">Restart Server?</div>
            <div className="confirmText">
              {t('Restart server? Các stream đang chạy sẽ tự kết nối lại.')}
            </div>
            <div className="confirmActions center">
              <button className="modalBtn" onClick={() => setShowConfirm(false)}>Huỷ</button>
              <button className="modalBtnDanger" onClick={performRestart}>Xác Nhận</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {errorText && createPortal(
        <div className="confirmOverlay" onMouseDown={() => setErrorText(null)}>
          <div className="confirmPanel compact" onMouseDown={e => e.stopPropagation()}>
            <div className="confirmTitle">Cảnh Báo</div>
            <div className="confirmText">{errorText}</div>
            <div className="confirmActions center">
              <button className="modalBtnPrimary" onClick={() => setErrorText(null)}>OK</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
