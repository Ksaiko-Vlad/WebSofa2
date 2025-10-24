'use client'

import s from './YandexMap.module.css'

const HOURS = 'Пн–Сб 10:00–20:00, Вс 10:00–18:00'

// вставь сюда ID из конструктора карт
const IFRAME_SRC =
  'https://yandex.ru/map-widget/v1/?um=constructor%3AВАШ_ID&source=constructor'

export default function AboutUs() {
  return (
    <div className={s.wrapper}>
      {/* Контакты */}
      <div className={s.card}>
        <h2 className={s.title}>Timber&Grain</h2>
        <p className={s.muted}>
          Собственное производство мягкой мебели и сеть магазинов по стране.
        </p>

        <div className={s.infoList}>
          <div><b>Телефон:</b> +375 (29) 123-45-67</div>
          <div><b>E-mail:</b> info@timbergrain.by</div>
          <div><b>График:</b> {HOURS}</div>
          <div><b>Юр. адрес:</b> Минск, ул. Примерная, 1</div>
        </div>
      </div>

      <div className={s.mapCard}>
        <iframe
          className={s.iframe}
          src={IFRAME_SRC}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Карта магазинов Timber&Grain"
        />
      </div>
    </div>
  )
}
