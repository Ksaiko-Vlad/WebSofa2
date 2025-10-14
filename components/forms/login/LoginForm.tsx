'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import s from './LoginPage.module.css';

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      email: fd.get('email')?.toString() ?? '',
      password: fd.get('password')?.toString() ?? '',
      phone: fd.get('phone')?.toString() || undefined,
    };

    if (!payload.email || !payload.password) {
      setError('Введите email и пароль');
      setLoading(false);
      return;
    }

    try {
      const r = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || 'Ошибка входа');

      router.push(data.redirect ?? '/account');
      router.refresh();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={s.wrapper}>
      <div className={s.card}>
        <h1 className={s.title}>Вход</h1>

        <form className={s.form} id="logForm" onSubmit={onSubmit}>
          <label className={s.field}>
            <span className={s.label}>E-mail</span>
            <input
              className={s.input}
              name="email"
              type="email"
              required
              placeholder="you@example.com"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Телефон</span>
            <input
              className={s.input}
              name="phone"
              type="tel"
              placeholder="+375…"
            />
          </label>

          <label className={s.field}>
            <span className={s.label}>Пароль</span>
            <input
              className={s.input}
              name="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </label>
        </form>
      </div>

      <div className={s.actions} style={{ marginTop: 16 }}>
        <button
          className="btn btn-primary"
          form="logForm"
          type="submit"
          style={{ marginRight: 16 }}
          disabled={loading}
        >
          {loading ? 'Входим…' : 'Войти'}
        </button>
        <a className="btn btn-ghost" href="/register">
          Создать аккаунт
        </a>
      </div>

      {error && <p className="text-error" style={{ marginTop: 8 }}>{error}</p>}
    </section>
  );
};

export default LoginForm;
