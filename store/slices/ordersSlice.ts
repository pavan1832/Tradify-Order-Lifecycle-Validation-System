import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Order, OrderState, StateTransition, ValidationStep } from '@/lib/types'

interface OrdersState {
  orders: Order[]
  selectedOrderId: string | null
}

const initialState: OrdersState = {
  orders: [],
  selectedOrderId: null,
}

function makeTransition(from: OrderState, to: OrderState, note?: string): StateTransition {
  return { from, to, timestamp: new Date().toISOString(), note }
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addOrder(state, action: PayloadAction<Order>) {
      state.orders.unshift(action.payload)
    },

    transitionOrder(
      state,
      action: PayloadAction<{
        id: string
        to: OrderState
        note?: string
        validationSteps?: ValidationStep[]
        rejectionReason?: string
      }>
    ) {
      const { id, to, note, validationSteps, rejectionReason } = action.payload
      const order = state.orders.find((o) => o.id === id)
      if (!order) return
      const transition = makeTransition(order.state, to, note)
      order.transitions.push(transition)
      order.state = to
      if (validationSteps) order.validationSteps = validationSteps
      if (rejectionReason) order.rejectionReason = rejectionReason
    },

    selectOrder(state, action: PayloadAction<string | null>) {
      state.selectedOrderId = action.payload
    },

    clearOrders(state) {
      state.orders = []
      state.selectedOrderId = null
    },
  },
})

export const { addOrder, transitionOrder, selectOrder, clearOrders } = ordersSlice.actions
export default ordersSlice.reducer
