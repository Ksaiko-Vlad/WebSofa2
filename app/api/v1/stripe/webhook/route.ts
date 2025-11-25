// app/api/v1/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { DeliveryType, OrderStatus } from '@prisma/client'

export const runtime = 'nodejs' 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET! 
    )
  } catch (err: any) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // Нас интересует только успешная оплата
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const meta = session.metadata
      if (!meta) throw new Error('No metadata in session')

      // items мы положим в metadata как JSON-строку
      const items = JSON.parse(meta.items || '[]') as Array<{
        variantId: number
        sku: string
        productName: string
        materialName: string
        price: number
        quantity: number
      }>

      const total = items.reduce(
        (s, i) => s + i.price * i.quantity,
        0
      )

      const deliveryType: DeliveryType =
      meta.deliveryType === 'home_delivery'
        ? DeliveryType.home_delivery
        : DeliveryType.pickup

      // создаём заказ ТОЛЬКО после успешной оплаты
      const order = await prisma.orders.create({
        data: {
            customer_name: meta.name || null,
            customer_second_name: meta.second_name || null,
            customer_last_name: meta.last_name || null,
            customer_email: meta.email || null,
            customer_phone: meta.phone || null,
            delivery_type: deliveryType,
            status: OrderStatus.created,
            note: meta.note || null,
            total_amount: total,
        },
      })

      // если доставка, а не самовывоз — создаём адрес
      if (meta.deliveryType === 'home_delivery') {
        await prisma.delivery_addresses.create({
          data: {
            order_id: order.id,
            city: meta.city || '',
            street: meta.street || '',
            house: meta.house || '',
            floor: meta.floor || null,
            apartment: meta.apartment || null,
            entrance: meta.entrance || null,
          },
        })
      }

      // позиции заказа
      await prisma.order_items.createMany({
        data: items.map((i) => ({
          order_id: order.id,
          // ВАЖНО: тут кладём id варианта (variantId), а не товара
          product_variant_id: BigInt(i.variantId),
          unit_price: i.price,
          quantity: i.quantity,
          line_total: i.price * i.quantity,
        })),
      })

      console.log(' Order created after payment:', order.id)
    } catch (e: any) {
        console.error(' Webhook processing error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
      }  
  }

  return NextResponse.json({ received: true })
}
