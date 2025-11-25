// app/(public)/checkout/success/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'

export default function SuccessPage() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')

  return (
    <section style={{ textAlign: 'center', marginTop: '60px' }}>
      <h2>Оплата успешно завершена ✅</h2>
      <p>Ваш заказ принят и оплачен.</p>

      {sessionId && (
        <a
          href={`/api/v1/stripe/invoice/${sessionId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '10px 18px',
            background: '#111',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
          }}
        >
          Скачать чек (PDF)
        </a>
      )}

      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#0070f3' }}>
          ← Вернуться на главную
        </a>
      </div>
    </section>
  )
}
