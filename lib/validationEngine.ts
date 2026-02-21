import { Instrument, OrderType, Strategy, ValidationResult, ValidationStep } from './types'

// Risk config – mirrors what a real quant desk risk table might look like
const RISK_CONFIG = {
  maxQuantity: { INDEX: 500, FUTURES: 1000, EQUITY: 5000 },
  maxNotional: { INDEX: 10_000_000, FUTURES: 50_000_000, EQUITY: 25_000_000 },
  priceRanges: {
    INDEX: { min: 1000, max: 30000 },
    FUTURES: { min: 50, max: 50000 },
    EQUITY: { min: 0.01, max: 10000 },
  },
  // Some strategies are restricted for certain instruments
  restrictions: {
    ARBITRAGE: ['INDEX'],         // arb not allowed on index
    DELTA_NEUTRAL: [],
    MOMENTUM: [],
    MEAN_REVERSION: [],
    CUSTOM: ['FUTURES'],          // custom blocked on futures
  } as Record<Strategy, Instrument[]>,
  maxDailyExposurePct: 0.15,     // simulated: flag if qty > 15% of "daily cap"
  dailyCaps: { INDEX: 2000, FUTURES: 5000, EQUITY: 20000 },
}

export function runValidation(params: {
  instrument: Instrument
  orderType: OrderType
  quantity: number
  price?: number
  strategy: Strategy
}): ValidationResult {
  const { instrument, orderType, quantity, price, strategy } = params
  const steps: ValidationStep[] = []
  let rejectionReason: string | undefined

  // 1. Quantity limit check
  const maxQty = RISK_CONFIG.maxQuantity[instrument]
  const qtyPass = quantity > 0 && quantity <= maxQty
  steps.push({
    check: 'Quantity Limits',
    passed: qtyPass,
    detail: qtyPass
      ? `Quantity ${quantity} within allowed max of ${maxQty} for ${instrument}`
      : `Quantity ${quantity} exceeds max of ${maxQty} for ${instrument}`,
  })

  // 2. Price sanity (only for limit orders)
  if (orderType === 'LIMIT') {
    const range = RISK_CONFIG.priceRanges[instrument]
    const priceVal = price ?? 0
    const pricePass = priceVal >= range.min && priceVal <= range.max
    steps.push({
      check: 'Price Sanity Check',
      passed: pricePass,
      detail: pricePass
        ? `Limit price ${priceVal} within valid range [${range.min}, ${range.max}]`
        : `Limit price ${priceVal} outside valid range [${range.min}, ${range.max}] for ${instrument}`,
    })
    if (!pricePass && !rejectionReason) {
      rejectionReason = `Limit price ${priceVal} is outside the acceptable range for ${instrument}.`
    }

    // 3. Notional check (qty × price)
    const notional = quantity * priceVal
    const maxNotional = RISK_CONFIG.maxNotional[instrument]
    const notionalPass = notional <= maxNotional
    steps.push({
      check: 'Notional Exposure Cap',
      passed: notionalPass,
      detail: notionalPass
        ? `Notional $${notional.toLocaleString()} within cap of $${maxNotional.toLocaleString()}`
        : `Notional $${notional.toLocaleString()} exceeds cap of $${maxNotional.toLocaleString()}`,
    })
    if (!notionalPass && !rejectionReason) {
      rejectionReason = `Order notional ($${notional.toLocaleString()}) exceeds risk cap.`
    }
  } else {
    steps.push({
      check: 'Price Sanity Check',
      passed: true,
      detail: 'Market order – no price sanity check required',
    })
    steps.push({
      check: 'Notional Exposure Cap',
      passed: true,
      detail: 'Market order – notional checked at execution',
    })
  }

  // 4. Strategy restriction check
  const blocked = RISK_CONFIG.restrictions[strategy] ?? []
  const stratPass = !blocked.includes(instrument)
  steps.push({
    check: 'Strategy Restriction',
    passed: stratPass,
    detail: stratPass
      ? `Strategy ${strategy} is permitted for ${instrument}`
      : `Strategy ${strategy} is not permitted on ${instrument} per desk policy`,
  })
  if (!stratPass && !rejectionReason) {
    rejectionReason = `Strategy "${strategy}" is restricted for ${instrument} orders.`
  }

  // 5. Daily exposure cap (simulated)
  const cap = RISK_CONFIG.dailyCaps[instrument]
  const exposurePct = quantity / cap
  const exposurePass = exposurePct <= RISK_CONFIG.maxDailyExposurePct
  steps.push({
    check: 'Daily Exposure Cap',
    passed: exposurePass,
    detail: exposurePass
      ? `Order is ${(exposurePct * 100).toFixed(1)}% of daily cap (limit: 15%)`
      : `Order is ${(exposurePct * 100).toFixed(1)}% of daily cap, exceeding the 15% threshold`,
  })
  if (!exposurePass && !rejectionReason) {
    rejectionReason = `Order size exceeds 15% of daily exposure cap for ${instrument}.`
  }

  if (!qtyPass && !rejectionReason) {
    rejectionReason = `Quantity ${quantity} is out of bounds for ${instrument}.`
  }

  const passed = steps.every((s) => s.passed)
  return { passed, steps, rejectionReason: passed ? undefined : rejectionReason }
}
