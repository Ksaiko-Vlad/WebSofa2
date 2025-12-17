import s from './AdminMainPageForm.module.css'

export default async function AdminMainPage() {
  const adminCards = [
    {
      href: "/admin/products",
      icon: "📦",
      title: "Товары",
      description: "Просмотр и редактирование каталога"
    },
    {
      href: "/admin/products/add",
      icon: "➕",
      title: "Добавить товар",
      description: "Добавление нового товара"
    },
    {
      href: "/admin/users",
      icon: "👥",
      title: "Пользователи",
      description: "Просмотр и редактирование пользователей"
    },
    {
      href: "/admin/users/new",
      icon: "➕",
      title: "Добавить пользователя",
      description: "Добавление нового пользователя"
    },
    {
      href: "/admin/materials",
      icon: "➕",
      title: "Добавить материал",
      description: "Добавление нового материала"
    },
    {
      href: "/admin/factory-orders",
      icon: "",
      title: "Производство",
      description: "Наблюдение за производством"
    },
    {
      href: "/admin/orders",
      icon: "",
      title: "Заказы",
      description: "Просмотр заказов и их подробностей"
    },
    {
      href: "/admin/shipments",
      icon: "📦",
      title: "Доставки",
      description: "Контроль доставок"
    },
    {
      href: "/admin/shops",
      icon: "",
      title: "Магазины",
      description: "Просмотр и добавление магазинов"
    },
    {
      href: "/admin/shop-stock",
      icon: "",
      title: "Каталоги магазинов",
      description: "Просмотр остатков товаров в магазинах"
    },
    {
      href: "/admin/managers",
      icon: "👔",
      title: "Менеджеры",
      description: "Назначение менеджеров в магазины"
    }
  ]

  return (
    <section className={s.wrapper} aria-labelledby="admin-title">
      <h1 id="admin-title" className={s.title}>Панель администратора</h1>
      <p className={s.subtitle}>Выберите раздел для управления:</p>

      <div className={s.grid} role="grid" aria-label="Разделы админ-панели">
        {adminCards.map((card, index) => (
          <a
            key={index}
            href={card.href}
            className={s.card}
            role="gridcell"
            aria-label={`${card.title}: ${card.description}`}
          >
            <h3>
              <span aria-hidden="true">{card.icon}</span>
              {card.title}
            </h3>
            <p>{card.description}</p>
          </a>
        ))}
      </div>
    </section>
  )
}