import React from 'react'
import { useI18n } from '@/context/I18nContext'

type Props = {
  wsServer: string
}

export function HeaderBar ({ wsServer }: Props) {
  const { t } = useI18n()
  const logoSrc = 'https://solumate.vn/logo_gold.png'

  return (
    <div id='header'>
      <div className='headerLeft'>
        <div className='headerBrand'>
          <img src={logoSrc} alt='Solumate' className='headerLogo' />
          <h1 className='headerGradientTitle'>Solumate</h1>
        </div>
      </div>

      <div className='headerRight'>
      </div>
    </div>
  )
}


