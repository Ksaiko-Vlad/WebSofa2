'use client';

import { useState, FormEvent } from 'react';
import s from './RegisterForm.module.css';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const router = useRouter();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setOk(false);

    const fd = new FormData(e.currentTarget);
    const payload = {
      first_name: fd.get('first_name')?.toString() ?? '',
      last_name: fd.get('last_name')?.toString() ?? '',
      second_name: fd.get('second_name')?.toString() ?? '',
      email: fd.get('email')?.toString() ?? '',
      phone: fd.get('phone')?.toString() ?? '',
      password: fd.get('password')?.toString() ?? '',
    };

    if (!payload.email || !payload.password) {
      setError('Введите email и пароль');
      return;
    }

    setLoading(true);

    try {
      const r = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || 'Ошибка регистрации');
      setOk(true);
      router.push('/account');
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
        <h1 className={s.title}>Регистрация</h1>

        <form className={s.form} id="regForm" onSubmit={onSubmit}>
          <label className={s.field}>
            <span className={s.label}>Имя</span>
            <input className={s.input} name="first_name" type="text" required placeholder="Иван" />
          </label>

          <label className={s.field}>
            <span className={s.label}>Фамилия</span>
            <input className={s.input} name="last_name" type="text" required placeholder="Иванов" />
          </label>

          <label className={s.field}>
            <span className={s.label}>Отчество</span>
            <input className={s.input} name="second_name" type="text" required placeholder="Иванович" />
          </label>

          <label className={s.field}>
            <span className={s.label}>Email</span>
            <input className={s.input} name="email" type="email" required placeholder="you@example.com" />
          </label>

          <label className={s.field}>
            <span className={s.label}>Телефон</span>
            <input className={s.input} name="phone" type="tel" placeholder="+375…" />
          </label>

          <label className={s.field}>
            <span className={s.label}>Пароль</span>
            <input className={s.input} name="password" type="password" required placeholder="••••••••" />
          </label>
        </form>
      </div>

      <div className={s.actions} style={{ marginTop: 16 }}>
        <button
          className="btn btn-primary"
          style={{ marginRight: 16 }}
          disabled={loading}
          form="regForm"
          type="submit"
        >
          {loading ? 'Регистрируем…' : 'Зарегистрироваться'}
        </button>
        <a className="btn btn-ghost" href="/login">
          У меня уже есть аккаунт
        </a>
      </div>

      {error && <p className="text-error" style={{ marginTop: 8 }}>{error}</p>}
      {ok && <p className="text-success" style={{ marginTop: 8 }}>Регистрация успешна!</p>}
    </section>
  );
}
