// app/api/v1/stripe/invoice/[sessionId]/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

export async function GET(
  req: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!session.metadata) {
      return NextResponse.json({ error: 'No metadata in session' }, { status: 404 })
    }

    const meta = session.metadata
    const items = JSON.parse(meta.items ?? '[]')

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const { height } = page.getSize()
    let y = height - 60

    const draw = (text: string, x = 50, step = 20, size = 12) => {
      page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) })
      y -= step
    }

    // Шапка
    draw('ООО «Furniture Shop»', 50, 18, 14)
    draw(`ЧЕК (Stripe Session)`, 50, 26, 16)
    draw('--------------------------------------------')

    draw(`Дата: ${new Date(session.created * 1000).toLocaleString('ru-RU')}`)
    draw(`Имя: ${meta.name || '—'}`)
    if (meta.second_name) draw(`Отчество: ${meta.second_name}`)
    if (meta.last_name) draw(`Фамилия: ${meta.last_name}`)
    draw(`Email: ${meta.email || '—'}`)
    draw(`Телефон: ${meta.phone || '—'}`)
    draw(`Тип доставки: ${meta.deliveryType}`)

    if (meta.deliveryType === 'home_delivery') {
      draw(`Адрес: ${meta.city}, ${meta.street}, д. ${meta.house}`)
      if (meta.apartment) draw(`Кв: ${meta.apartment}`)
      if (meta.entrance) draw(`Подъезд: ${meta.entrance}`)
      if (meta.floor) draw(`Этаж: ${meta.floor}`)
    }

    draw('')
    draw('--- Состав заказа ---')

    let total = 0
    for (const item of items) {
      const productName = item.productName ?? 'Товар'
      const materialName = item.materialName ?? 'Материал'
      const price = item.price ?? 0
      const qty = item.quantity ?? 1
      total += price * qty
      draw(`${productName} (${materialName}) — ${qty} × ${price.toLocaleString('ru-RU')} BYN`)
    }

    draw('')
    draw(`Итого: ${total.toLocaleString('ru-RU')} BYN`, 50, 28, 14)
    draw('--------------------------------------------')
    draw('Спасибо за покупку!')

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${sessionId}.pdf"`,
      },
    })
  } catch (e: any) {
    console.error('Invoice generation error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
