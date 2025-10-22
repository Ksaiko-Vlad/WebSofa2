'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/useToast'
import s from './AdminUsersPage.module.css'

interface User {
  id: number | string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role: string
  active: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { show } = useToast()

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/v1/admin/users')
        if (!res.ok) throw new Error('Ошибка при загрузке пользователей')
        const data = await res.json()
        setUsers(data)
      } catch (err) {
        console.error(err)
        show({
          title: 'Ошибка',
          description: 'Не удалось загрузить список пользователей',
          duration: 6000,
        })
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [show])

  if (loading) return <p className={s.muted}>Загрузка...</p>

  return (
    <div className={s.wrapper}>
      <div className={s.card}>
        <h2 className={s.title}>Все пользователи</h2>

        {users.length === 0 ? (
          <div className={s.placeholder}>
            <p>Пользователей пока нет</p>
          </div>
        ) : (
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Роль</th>
                  <th>Активен</th>
                  <th>Дата регистрации</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      {u.first_name || u.last_name
                        ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
                        : '—'}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone ?? '—'}</td>
                    <td>
                      <span className={s.roleBadge}>{u.role}</span>
                    </td>
                    <td>
                      <span
                        className={u.active ? s.badgeActive : s.badgeInactive}
                      >
                        {u.active ? 'Активен' : 'Выключен'}
                      </span>
                    </td>
                    <td>
                      {new Date(u.created_at).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
