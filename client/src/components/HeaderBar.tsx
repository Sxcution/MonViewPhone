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
    const confirmed = window.confirm('Restart server? Các stream đang chạy sẽ tự kết nối lại.')
    if (!confirmed) return

    setRestarting(true)
    try {
      await fetch(`http://${wsServer.replace('ws://', '').replace('wss://', '').split('/')[0]}/api/server/restart`, {
        method: 'POST'
      })
    } catch {
      // Bỏ qua lỗi vì server đang tắt nên fetch sẽ bị interrupt
    }

    // Sau 3 giây thử reload page để kết nối lại
    setTimeout(() => {
      setRestarting(false)
    }, 5000)
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
