'use client';

import type { FC } from 'react';
import { useToast } from '@/hooks/useToast';
import { useCooldown } from '@/hooks/useCooldown';
import s from './PromoCard.module.css';

const PromoCard: FC = () => {
  const { show } = useToast();
  const cd = useCooldown(6);

  const showPromo = (): void => {
    if (cd.active) return;

    
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText('Divan2025').catch(() => {});
    }

    show({
      title: 'Divan2025',
      description: 'Cкидка 3% при заказе у менеджера в магазине.',
      duration: 6000,
    });

    cd.start();
  };

  return (
    <section className={s.container}>
      <div className={s.card}>
        <div>
          <h2 className={s.title}>Скидка 3% при заказе у менеджера</h2>
          <p className={s.muted}>
            Покажите промокод менеджеру в магазине и получите скидку на оформление.
          </p>
          <button
            className="btn btn-primary"
            onClick={showPromo}
            disabled={cd.active}
          >
            {cd.active ? `Повторно через ${cd.left}с` : 'Показать промокод'}
          </button>
        </div>

        <div className={s.promoBox}>
          <span className="muted">Здесь может быть промо-изображение</span>
        </div>
      </div>
    </section>
  );
};

export default PromoCard;
