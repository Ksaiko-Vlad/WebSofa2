
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderIdNum = Number(params.orderId)
    if (!Number.isFinite(orderIdNum)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    const order = await prisma.orders.findUnique({
      where: { id: BigInt(orderIdNum) },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
                material: true,
              },
            },
          },
        },
        address: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const { height } = page.getSize()
    let y = height - 60

    const draw = (text: string, x = 50, step = 20, size = 12) => {
      page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) })
      y -= step
    }

    // Шапка
    draw('ООО «Furniture Shop»', 50, 18, 14)
    draw(`ЧЕК № ${order.id.toString()}`, 50, 26, 16)
    draw('--------------------------------------------')

    draw(
      `Дата: ${order.created_at
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19)}`
    )
    if (order.customer_name) draw(`Имя: ${order.customer_name}`)
    if (order.customer_second_name)
      draw(`Отчество: ${order.customer_second_name}`)
    if (order.customer_last_name) draw(`Фамилия: ${order.customer_last_name}`)
    if (order.customer_email) draw(`Email: ${order.customer_email}`)
    if (order.customer_phone) draw(`Телефон: ${order.customer_phone}`)

    draw('')
    draw(`Тип доставки: ${order.delivery_type}`)

    if (order.address) {
      draw(
        `Адрес: ${order.address.city}, ${order.address.street}, д. ${order.address.house}`
      )
      if (order.address.apartment)
        draw(`Квартира: ${order.address.apartment}`)
      if (order.address.entrance) draw(`Подъезд: ${order.address.entrance}`)
      if (order.address.floor) draw(`Этаж: ${order.address.floor}`)
    }

    draw('')
    draw('--- Состав заказа ---')

    for (const item of order.items) {
      const pv = item.productVariant
      const productName = pv?.product?.name ?? 'Товар'
      const materialName = pv?.material?.name ?? 'Материал'

      const unitPriceNum = item.unit_price.toNumber()
      draw(
        `${productName} (${materialName}) — ${
          item.quantity
        } × ${unitPriceNum.toLocaleString('ru-RU')} BYN`
      )
    }

    draw('')
    const totalNumber = order.total_amount.toNumber()
    draw(
      `Итого: ${totalNumber.toLocaleString('ru-RU')} BYN`,
      50,
      28,
      14
    )
    draw('--------------------------------------------')
    draw('Спасибо за покупку!')

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.id.toString()}.pdf"`,
      },
    })
  } catch (e: any) {
    console.error('Invoice generation error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
