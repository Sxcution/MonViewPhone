import React, { useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { RotateCw } from 'lucide-react'

type Props = {
  wsServer: string
}

export function HeaderBar ({ wsServer }: Props) {
  const { t } = useI18n()
  const logoSrc = 'https://solumate.vn/logo_gold.png'
  const [restarting, setRestarting] = useState(false)

  const handleRestart = async () => {
    if (restarting) return
    const confirmed = window.confirm(t('Restart server? Các stream đang chạy sẽ tự kết nối lại.'))
    if (!confirmed) return

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
        alert(t('Restart thất bại hoặc server không phản hồi sau 20 giây.'))
      }
    }, 1000)
  }

  return (
    <div id='header'>
      <div className='headerLeft'>
        <div className='headerBrand'>
          <img src={logoSrc} alt='Solumate' className='headerLogo' />
          <h1 className='headerGradientTitle'>Solumate</h1>
        </div>
      </div>

      <div className='headerRight'>
        {/* Nút Restart Server */}
        <button
          className={`headerRestartBtn ${restarting ? 'restarting' : ''}`}
          title={restarting ? 'Đang restart...' : 'Restart Server'}
          onClick={handleRestart}
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
    </div>
  )
}
