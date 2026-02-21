import { NextRequest, NextResponse } from 'next/server'
import { runValidation } from '@/lib/validationEngine'
import { Instrument, OrderType, Strategy } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { instrument, orderType, quantity, price, strategy } = body

    if (!instrument || !orderType || !quantity || !strategy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = runValidation({
      instrument: instrument as Instrument,
      orderType: orderType as OrderType,
      quantity: Number(quantity),
      price: price ? Number(price) : undefined,
      strategy: strategy as Strategy,
    })

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: 'Validation engine error' }, { status: 500 })
  }
}
