// app/(driver)/driver/active/page.tsx
"use client";

import { Fragment, useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import s from "./DriverActiveOrders.module.css";

type Address = {
  id: number | string;
  city: string;
  street: string;
  house_number: string | null;
  apartment: string | null;
  entrance: string | null;
  floor: string | null;
  comment: string | null;
};

type ProductVariantBrief = {
  id: number | string;
  sku: string | null;
  price: number | string | null;
  product?: { name: string | null } | null;
  material?: { name: string | null } | null;
};

type OrderItem = {
  id: number | string;
  quantity: number;
  is_from_shop_stock: boolean;
  product_variant_id: number | string;
  productVariant: ProductVariantBrief | null;
};

type Order = {
  id: number | string;
  created_at: string;
  status: string;
  delivery_type: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number | string;
  address: Address | null;
  items: OrderItem[];
};

type ShipmentOrder = {
  id: number | string;
  shipment_id: number | string;
  order_id: number | string;
  order: Order;
};

type Shipment = {
  id: number | string;
  driver_id: number | string;
  planned_at: string;
  status: "in_transit" | "delivered" | "cancelled" | string;
  route_hint: string | null;
  started_at: string;
  finished_at: string | null;
  comment: string | null;
  orders: ShipmentOrder[];
};

type ApiResponse = {
  shipments: Shipment[];
  message?: string;
};

const money = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
};

const formatStatus = (s: string) => {
  switch (s) {
    case "in_transit":
      return "В пути";
    case "delivered":
      return "Доставлен";
    case "cancelled":
      return "Отменён";
    default:
      return s;
  }
};

const formatDeliveryType = (t: string) => {
  if (t === "pickup") return "Самовывоз";
  if (t === "home_delivery") return "Доставка";
  return t || "—";
};

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ActiveShipmentsPage() {
  const toast = useToast();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [openShipments, setOpenShipments] = useState<Record<string, boolean>>({});
  const [openOrders, setOpenOrders] = useState<Record<string, boolean>>({});

  // пагинация
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  async function load() {
    try {
      setErr(null);
      setLoading(true);

      const res = await fetch("/api/v1/driver/active", {
        credentials: "include",
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(`Server returned ${res.status}: ${text.substring(0, 100)}...`);
      }

      const json: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(json.message || `Ошибка ${res.status}: ${res.statusText}`);
      }

      setShipments(Array.isArray(json.shipments) ? json.shipments : []);
      setPage(1);
    } catch (e: any) {
      const msg = e?.message ?? "Ошибка загрузки активных доставок";
      setErr(msg);
      toast.show({ 
        title: "Ошибка", 
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalShipments = shipments.length;
  const totalPages = totalShipments === 0 ? 1 : Math.ceil(totalShipments / pageSize);

  const startIndex = totalShipments === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = totalShipments === 0 ? 0 : Math.min(startIndex + pageSize, totalShipments);
  const pagedShipments = shipments.slice(startIndex, endIndex);

  async function updateShipmentStatus(shipmentId: number | string, action: "deliver" | "cancel") {
    try {
      setUpdatingId(shipmentId);
      
      const res = await fetch("/api/v1/driver/active", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          shipmentId: Number(shipmentId), 
          action 
        }),
      });

      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json?.message || `Ошибка ${res.status}: ${json?.error || 'Unknown error'}`);
      }

      toast.show({
        title: action === "deliver" ? "Заказ доставлен" : "Доставка отменена",
        description: json.message || `Shipment #${shipmentId}`,
      });

      await load();
    } catch (e: any) {
      toast.show({
        title: "Ошибка",
        description: e?.message ?? "Не удалось обновить статус доставки",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const toggleOpenShipment = (shipmentId: number | string) => {
    setOpenShipments((prev) => {
      const id = String(shipmentId);
      return { ...prev, [id]: !prev[id] };
    });
  };

  const toggleOpenOrder = (orderId: number | string) => {
    setOpenOrders((prev) => {
      const id = String(orderId);
      return { ...prev, [id]: !prev[id] };
    });
  };

  const handlePrev = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNext = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };

  const formatAddress = (address: Address | null) => {
    if (!address) return "—";
    
    const parts = [
      address.city,
      address.street,
      address.house_number && `д. ${address.house_number}`,
      address.apartment && `кв. ${address.apartment}`,
      address.entrance && `подъезд ${address.entrance}`,
      address.floor && `этаж ${address.floor}`,
    ].filter(Boolean);
    
    return parts.join(", ");
  };

  if (loading) {
    return (
      <section className={s.wrapper}>
        <div className={s.card}>
          <p className={s.muted}>Загрузка активных доставок…</p>
        </div>
      </section>
    );
  }

  if (err) {
    return (
      <section className={s.wrapper}>
        <div className={s.card}>
          <div className={s.headerRow}>
            <h1 className={s.title}>Активные доставки</h1>
            <button
              type="button"
              className={s.secondaryBtn}
              onClick={load}
            >
              Обновить
            </button>
          </div>
          <p className={s.error}>Ошибка: {err}</p>
          <button
            type="button"
            className={s.primaryBtn}
            onClick={load}
          >
            Попробовать снова
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={s.wrapper}>
      <div className={s.card}>
        <div className={s.headerRow}>
          <h1 className={s.title}>Активные доставки</h1>
          <div className={s.headerActions}>
            <button
              type="button"
              className={s.refreshBtn}
              onClick={load}
              disabled={loading}
            >
              Обновить
            </button>
          </div>
        </div>

        {/* Десктоп / планшет — таблица */}
        <div className={s.tableContainer}>
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Запланировано</th>
                  <th>Начало</th>
                  <th>Статус</th>
                  <th>Заказов</th>
                  <th>Маршрут</th>
                  <th className={s.actionsCell}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {totalShipments === 0 && (
                  <tr>
                    <td colSpan={7} className={s.placeholder}>
                      Нет активных доставок.
                    </td>
                  </tr>
                )}

                {pagedShipments.map((shipment) => {
                  const shipmentId = String(shipment.id);
                  const isShipmentOpen = !!openShipments[shipmentId];
                  const orders = Array.isArray(shipment.orders) ? shipment.orders : [];

                  return (
                    <Fragment key={shipmentId}>
                      <tr>
                        <td>
                          <span className={s.shipmentId}>{shipmentId}</span>
                        </td>
                        <td>
                          <div>{formatDate(shipment.planned_at)}</div>
                          <div className={s.time}>{formatTime(shipment.planned_at)}</div>
                        </td>
                        <td>
                          <div>{formatDate(shipment.started_at)}</div>
                          <div className={s.time}>{formatTime(shipment.started_at)}</div>
                        </td>
                        <td>
                          <span
                            className={`${s.statusBadge} ${
                              shipment.status === "in_transit"
                                ? s.statusInTransit
                                : shipment.status === "delivered"
                                ? s.statusDelivered
                                : s.statusCancelled
                            }`}
                          >
                            {formatStatus(shipment.status)}
                          </span>
                        </td>
                        <td>
                          {orders.length === 0 ? (
                            <span className={s.muted}>—</span>
                          ) : (
                            <button
                              type="button"
                              className={s.secondaryBtn}
                              onClick={() => toggleOpenShipment(shipmentId)}
                            >
                              {isShipmentOpen
                                ? "Скрыть"
                                : `Показать`}
                            </button>
                          )}
                        </td>
                        <td>
                          {shipment.route_hint ? (
                            <div className={s.routeHint}>
                              {shipment.route_hint.length > 50
                                ? `${shipment.route_hint.substring(0, 50)}…`
                                : shipment.route_hint}
                            </div>
                          ) : (
                            <span className={s.muted}>—</span>
                          )}
                        </td>
                        <td className={s.actionsCell}>
                          {shipment.status === "in_transit" ? (
                            <div className={s.actionButtons}>
                              <button
                                type="button"
                                className={`${s.primaryBtn} ${s.deliverBtn}`}
                                disabled={updatingId === shipmentId}
                                onClick={() => updateShipmentStatus(shipmentId, "deliver")}
                              >
                                {updatingId === shipmentId ? "Обновляем…" : "Доставлено"}
                              </button>
                              <button
                                type="button"
                                className={`${s.primaryBtn} ${s.cancelBtn}`}
                                disabled={updatingId === shipmentId}
                                onClick={() => updateShipmentStatus(shipmentId, "cancel")}
                              >
                                Отказ
                              </button>
                            </div>
                          ) : (
                            <span className={s.muted}>
                              {shipment.status === "delivered" ? "Завершено" : "Отменено"}
                            </span>
                          )}
                        </td>
                      </tr>

                      {isShipmentOpen && orders.length > 0 && (
                        <tr key={`${shipmentId}-orders`}>
                          <td colSpan={7} className={s.ordersCell}>
                            <div className={s.ordersList}>
                              {orders.map((shipmentOrder) => {
                                const order = shipmentOrder.order;
                                const orderId = String(order.id);
                                const isOrderOpen = !!openOrders[orderId];
                                const items = Array.isArray(order.items) ? order.items : [];

                                return (
                                  <div key={orderId} className={s.orderCard}>
                                    <div className={s.orderHeader}>
                                      <div className={s.orderTitleRow}>
                                        <h3 className={s.orderTitle}>
                                          Заказ #{orderId}
                                          <span className={s.orderStatus}>
                                            {formatStatus(order.status)}
                                          </span>
                                        </h3>
                                        <button
                                          type="button"
                                          className={s.secondaryBtn}
                                          onClick={() => toggleOpenOrder(orderId)}
                                        >
                                          {isOrderOpen ? "Скрыть детали" : "Показать детали"}
                                        </button>
                                      </div>
                                      <div className={s.orderMeta}>
                                        <span>Клиент: {order.customer_name || "—"} • {order.customer_phone || "—"}</span>
                                        <span>Создан: {formatDateTime(order.created_at)}</span>
                                        <span>Сумма: <b>{money(order.total_amount)} BYN</b></span>
                                      </div>
                                      <div className={s.orderAddress}>
                                        <strong>Адрес:</strong> {formatAddress(order.address)}
                                        {order.address?.comment && (
                                          <div className={s.addressComment}>
                                            {order.address.comment}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {isOrderOpen && items.length > 0 && (
                                      <div className={s.itemsList}>
                                        {items.map((item) => {
                                          const pv = item.productVariant;
                                          const name = pv?.product?.name ?? "";
                                          const material = pv?.material?.name
                                            ? `  ${pv.material.name}`
                                            : "";
                                          const sku = pv?.sku ?? "—";

                                          return (
                                            <div key={String(item.id)} className={s.itemRow}>
                                              <div className={s.itemTitle}>
                                                {name || "Без названия"}
                                                {material && (
                                                  <span className={s.muted}>
                                                    {material}
                                                  </span>
                                                )}
                                              </div>
                                              <div className={s.itemMeta}>
                                                <span>
                                                  SKU: <b>{sku}</b>
                                                </span>
                                                <span>
                                                  Кол-во: <b>{item.quantity}</b>
                                                </span>
                                                <span>
                                                  Цена: <b>{money(pv?.price)} BYN</b>
                                                </span>
                                                <span
                                                  className={
                                                    item.is_from_shop_stock
                                                      ? s.badgeStock
                                                      : s.badgeCustom
                                                  }
                                                >
                                                  {item.is_from_shop_stock
                                                    ? "Со склада"
                                                    : "Под заказ"}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Мобильные карточки */}
        <div className={s.mobileList}>
          {totalShipments === 0 && (
            <div className={s.placeholder}>
              Нет активных доставок.
            </div>
          )}

          {pagedShipments.map((shipment) => {
            const shipmentId = String(shipment.id);
            const orders = Array.isArray(shipment.orders) ? shipment.orders : [];

            return (
              <div key={shipmentId} className={s.shipmentCard}>
                <div className={s.shipmentHeader}>
                  <div className={s.shipmentTitle}>
                    Доставка {shipmentId}
                    <span
                      className={`${s.statusBadge} ${
                        shipment.status === "in_transit"
                          ? s.statusInTransit
                          : shipment.status === "delivered"
                          ? s.statusDelivered
                          : s.statusCancelled
                      }`}
                    >
                      {formatStatus(shipment.status)}
                    </span>
                  </div>
                  <div className={s.shipmentMeta}>
                    <div>Запланировано: {formatDateTime(shipment.planned_at)}</div>
                    <div>Начало: {formatDateTime(shipment.started_at)}</div>
                    {shipment.route_hint && (
                      <div className={s.routeHint}>
                        Маршрут: {shipment.route_hint}
                      </div>
                    )}
                  </div>
                </div>

                <div className={s.ordersBlock}>
                  <div className={s.ordersTitle}>
                  </div>
                  {orders.map((shipmentOrder) => {
                    const order = shipmentOrder.order;
                    const orderId = String(order.id);
                    const isOrderOpen = !!openOrders[orderId];
                    const items = Array.isArray(order.items) ? order.items : [];

                    return (
                      <div key={orderId} className={s.orderCardMobile}>
                        <div className={s.orderHeaderMobile}>
                          <div className={s.orderTitleMobile}>
                            Заказ #{orderId}
                          </div>
                          <div className={s.orderMetaMobile}>
                            <div>Клиент: {order.customer_name || "—"}</div>
                            <div>Телефон: {order.customer_phone || "—"}</div>
                            <div>Сумма: <b>{money(order.total_amount)} BYN</b></div>
                            <div>Адрес: {formatAddress(order.address)}</div>
                          </div>
                          <button
                            type="button"
                            className={s.secondaryBtn}
                            onClick={() => toggleOpenOrder(orderId)}
                          >
                            {isOrderOpen ? "Скрыть товары" : "Показать товары"}
                          </button>
                        </div>

                        {isOrderOpen && items.length > 0 && (
                          <div className={s.itemsListMobile}>
                            {items.map((item) => {
                              const pv = item.productVariant;
                              const name = pv?.product?.name ?? "";
                              const material = pv?.material?.name
                                ? `  ${pv.material.name}`
                                : "";
                              const sku = pv?.sku ?? "—";

                              return (
                                <div key={String(item.id)} className={s.itemPill}>
                                  <div className={s.itemPillTitle}>
                                    {name || "Без названия"}
                                    {material && (
                                      <span className={s.muted}>{material}</span>
                                    )}
                                  </div>
                                  <div className={s.itemPillMeta}>
                                    SKU: {sku} • Кол-во: {item.quantity} • Цена:{" "}
                                    {money(pv?.price)} BYN
                                  </div>
                                  <div
                                    className={
                                      item.is_from_shop_stock
                                        ? s.badgeStock
                                        : s.badgeCustom
                                    }
                                  >
                                    {item.is_from_shop_stock
                                      ? "Со склада"
                                      : "Под заказ"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {shipment.status === "in_transit" && (
                  <div className={s.shipmentActions}>
                    <button
                      type="button"
                      className={`${s.primaryBtnFull} ${s.deliverBtn}`}
                      disabled={updatingId === shipmentId}
                      onClick={() => updateShipmentStatus(shipmentId, "deliver")}
                    >
                      {updatingId === shipmentId ? "Обновляем…" : "Доставлено"}
                    </button>
                    <button
                      type="button"
                      className={`${s.primaryBtnFull} ${s.cancelBtn}`}
                      disabled={updatingId === shipmentId}
                      onClick={() => updateShipmentStatus(shipmentId, "cancel")}
                    >
                      Отказ
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Пагинация */}
        {totalShipments > 0 && (
          <div className={s.paginationRow}>
            <div className={s.pageControls}>
              <span className={s.pageSizeLabel}>На странице:</span>
              <select
                className={s.select}
                value={pageSize}
                onChange={(e) => {
                  const next = Number(e.target.value) || 10;
                  setPageSize(next);
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <button
                type="button"
                className={s.pageBtn}
                onClick={handlePrev}
                disabled={page <= 1}
              >
                Назад
              </button>
              <span className={s.pageIndicator}>
                {page}/{totalPages}
              </span>
              <button
                type="button"
                className={s.pageBtn}
                onClick={handleNext}
                disabled={page >= totalPages}
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}