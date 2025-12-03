import s from './AdminMainPageForm.module.css'

export default async function AdminMainPage() {
  return (
    <section className={s.wrapper}>
      <h1 className={s.title}>Панель администратора</h1>
      <p className={s.subtitle}>Выберите раздел для управления:</p>

      <div className={s.grid}>
        <a href="/admin/products" className={s.card}>
          <h3>📦 Товары</h3>
          <p>Просмотр и редактирование каталога</p>
        </a>
        <a href="/admin/products/add" className={s.card}>
          <h3>➕ Добавить товар</h3>
          <p>Создание нового товара</p>
        </a>
        <a href="/admin/users" className={s.card}>
          <h3>👥 Пользователи</h3>
          <p>Список и роли пользователей</p>
        </a>
        <a href="/admin/users/new" className={s.card}>
        <h3>➕ Добавить пользователя</h3>
        <p>Создание нового пользователя</p>
        </a>
        <a href="/admin/materials" className={s.card}>
        <h3>➕ Добавить материал</h3>
        <p>Добавление нового материала</p>
        </a>
        <a href="/admin/orders" className={s.card}>
          <h3>🚚 Заказы</h3>
          <p>Контроль заказов и статусов</p>
        </a>
        <a href="/admin/shops" className={s.card}>
          <h3> Магазины</h3>
          <p>Просмотр и редактирование магазинов</p>
        </a>
      </div>
    </section>
  )
}
