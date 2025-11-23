// app/api/v1/checkout/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const cartItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  sku: z.string().min(1, 'sku обязателен'),
  name: z.string().min(1, 'Название обязательно'),
  materialName: z.string().min(1, 'Материал обязателен'),
  price: z.coerce.number(),          // на всякий случай, если вдруг пришла строка
  quantity: z.coerce.number().int().positive(),
  image_path: z.string().nullable().optional(),
})

const bodySchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Корзина пуста'),
})

export async function POST(req: Request) {
    console.log('STRIPE_SECRET_KEY starts with:', process.env.STRIPE_SECRET_KEY?.slice(0, 8))
  try {
    const json = await req.json()
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      console.error('❌ checkout body validation error:', parsed.error.issues, 'payload:', json)
      return NextResponse.json(
        { message: 'Некорректные данные корзины', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { items } = parsed.data

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map((item) => ({
        price_data: {
          currency: 'byn', // если будешь менять валюту — не забудь тут
          unit_amount: Math.round(item.price * 100), // BYN → копейки
          product_data: {
            name: `${item.name} (${item.materialName})`,
            images: item.image_path
              ? [`${appUrl}${item.image_path}`]
              : undefined,
          },
        },
        quantity: item.quantity,
      })),
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
    })

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (e: any) {
    console.error('checkout create error', e)
    return NextResponse.json(
      { message: 'Ошибка при создании платежа', details: e?.message },
      { status: 500 }
    )
  }
}
