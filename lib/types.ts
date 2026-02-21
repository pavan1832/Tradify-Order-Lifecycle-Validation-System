export type Instrument = 'INDEX' | 'FUTURES' | 'EQUITY'
export type OrderType = 'MARKET' | 'LIMIT'
export type OrderState = 'CREATED' | 'VALIDATED' | 'RISK_APPROVED' | 'READY' | 'REJECTED'
export type Strategy = 'MOMENTUM' | 'MEAN_REVERSION' | 'ARBITRAGE' | 'DELTA_NEUTRAL' | 'CUSTOM'

export interface StateTransition {
  from: OrderState
  to: OrderState
  timestamp: string
  note?: string
}

export interface ValidationStep {
  check: string
  passed: boolean
  detail: string
}

export interface Order {
  id: string
  instrument: Instrument
  orderType: OrderType
  quantity: number
  price?: number
  strategy: Strategy
  state: OrderState
  rejectionReason?: string
  validationSteps: ValidationStep[]
  transitions: StateTransition[]
  createdAt: string
}

export interface ValidationResult {
  passed: boolean
  steps: ValidationStep[]
  rejectionReason?: string
}
