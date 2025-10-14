import Image from 'next/image';
import Link from 'next/link';
import type { FC } from 'react';
import PromoCard from '@/components/forms/home/PromoCard';

const HomePage: FC = () => {
  return (
    <section className="hero">
      <div className="card hero-card">
        <div className="hero-text">
          <h1>Мебель под ваш интерьер</h1>
          <p>
            Выбирайте ткань и цвет — мы изготовим и доставим. Можно забрать в удобном магазине.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/products">
              Перейти в каталог
            </Link>
            <Link className="btn btn-ghost" href="/contacts">
              Контакты
            </Link>
          </div>
        </div>

        <div className="hero-image">
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
  );
};

export default HomePage;
