import Image from 'next/image'
import Link from 'next/link'
import type { FC } from 'react'
import PromoCard from '@/components/forms/home/PromoCard'
import s from './HomePage.module.css'

const HomePage: FC = () => {
  return (
    <section className={s.hero}>
      <div className={`card ${s.heroCard}`}>
        <div className={s.heroText}>
          <h1>Мебель под ваш интерьер</h1>
          <p>
            Выбирайте ткань и цвет - мы изготовим и доставим. Можно забрать в удобном магазине.
          </p>
          <div className={s.heroActions}>
            <Link className="btn btn-primary" href="/products">
              Перейти в каталог
            </Link>
            <Link className="btn btn-ghost" href="/about">
              Контакты
            </Link>
          </div>
        </div>

        <div className={s.heroImage}>
          <Image
            src="/hero.jpg"
            alt="Диван в современном интерьере"
            width={640}
            height={420}
            priority
            style={{ width: '100%', height: 'auto', borderRadius: 12 }}
          />
        </div>
      </div>

      <PromoCard />
    </section>
  )
}

export default HomePage
