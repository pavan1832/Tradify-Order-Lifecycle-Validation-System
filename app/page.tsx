'use client'
import { useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'
import { RootState, AppDispatch } from '@/store'
import { addOrder, transitionOrder, selectOrder, clearOrders } from '@/store/slices/ordersSlice'
import { Order, Instrument, OrderType, Strategy, OrderState } from '@/lib/types'

// ─── State badge ──────────────────────────────────────────────────────────────
function StateBadge({ state }: { state: OrderState }) {
  const cfg: Record<OrderState, { label: string; color: string; dot: string }> = {
    CREATED:      { label: 'CREATED',      color: '#4a5068', dot: '#6b7489' },
    VALIDATED:    { label: 'VALIDATED',    color: '#1a4a7a', dot: '#4a90d9' },
    RISK_APPROVED:{ label: 'RISK OK',      color: '#1a4a3a', dot: '#00d4aa' },
    READY:        { label: 'READY',        color: '#1a4a1a', dot: '#4caf50' },
    REJECTED:     { label: 'REJECTED',     color: '#4a1a1a', dot: '#ff4560' },
  }
  const c = cfg[state]
  return (
    <span style={{ background: c.color, border: `1px solid ${c.dot}30`, color: c.dot }}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium">
      <span style={{ background: c.dot }} className="w-1.5 h-1.5 rounded-full" />
      {c.label}
    </span>
  )
}

// ─── Order Entry Form ─────────────────────────────────────────────────────────
function OrderEntryForm() {
  const dispatch = useDispatch<AppDispatch>()
  const [form, setForm] = useState({
    instrument: 'EQUITY' as Instrument,
    orderType: 'LIMIT' as OrderType,
    quantity: '',
    price: '',
    strategy: 'MOMENTUM' as Strategy,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const instruments: Instrument[] = ['INDEX', 'FUTURES', 'EQUITY']
  const orderTypes: OrderType[] = ['MARKET', 'LIMIT']
  const strategies: Strategy[] = ['MOMENTUM', 'MEAN_REVERSION', 'ARBITRAGE', 'DELTA_NEUTRAL', 'CUSTOM']

  const submit = useCallback(async () => {
    setError(null)
    const qty = Number(form.quantity)
    if (!qty || qty <= 0) { setError('Quantity must be a positive number.'); return }
    if (form.orderType === 'LIMIT' && (!form.price || Number(form.price) <= 0)) {
      setError('Limit orders require a valid price.'); return
    }

    setLoading(true)

    // Create order in CREATED state
    const id = uuidv4()
    const now = new Date().toISOString()
    const newOrder: Order = {
      id,
      instrument: form.instrument,
      orderType: form.orderType,
      quantity: qty,
      price: form.orderType === 'LIMIT' ? Number(form.price) : undefined,
      strategy: form.strategy,
      state: 'CREATED',
      riskScore: 0,
      validationSteps: [],
      transitions: [{ from: 'CREATED', to: 'CREATED', timestamp: now, note: 'Order entered into system' }],
      createdAt: now,
    }
    dispatch(addOrder(newOrder))

    try {
      // Call Next.js API route (server-side Node.js validation)
      const res = await fetch('/api/validate-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrument: form.instrument,
          orderType: form.orderType,
          quantity: qty,
          price: form.price ? Number(form.price) : undefined,
          strategy: form.strategy,
        }),
      })
      const result = await res.json()

      if (!res.ok) {
        dispatch(transitionOrder({ id, to: 'REJECTED', note: 'API error during validation', rejectionReason: 'Internal validation error.' }))
        setLoading(false)
        return
      }

      if (!result.passed) {
        // Transition through VALIDATED (to show it was processed) then REJECTED
        dispatch(transitionOrder({ id, to: 'VALIDATED', note: 'Validation engine processed', validationSteps: result.steps }))
        setTimeout(() => {
          dispatch(transitionOrder({ id, to: 'REJECTED', note: 'Failed risk checks', rejectionReason: result.rejectionReason }))
        }, 400)
      } else {
        // Happy path: CREATED → VALIDATED → RISK_APPROVED → READY
        dispatch(transitionOrder({ id, to: 'VALIDATED', note: 'All validation checks passed', validationSteps: result.steps }))
        setTimeout(() => {
          dispatch(transitionOrder({ id, to: 'RISK_APPROVED', note: 'Risk desk sign-off (simulated)' }))
          setTimeout(() => {
            dispatch(transitionOrder({ id, to: 'READY', note: 'Order staged for execution' }))
          }, 500)
        }, 500)
      }

      // Reset form
      setForm({ instrument: 'EQUITY', orderType: 'LIMIT', quantity: '', price: '', strategy: 'MOMENTUM' })
    } catch {
      dispatch(transitionOrder({ id, to: 'REJECTED', note: 'Network error', rejectionReason: 'Unable to reach validation engine.' }))
    }
    setLoading(false)
  }, [form, dispatch])

  const inputCls = "w-full bg-bg border border-border rounded px-3 py-2 text-text text-sm font-mono focus:outline-none focus:border-accent transition-colors"
  const labelCls = "block text-xs text-muted mb-1 uppercase tracking-widest"

  return (
    <div className="bg-surface border border-border rounded-lg p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-accent rounded-full" />
        <h2 className="font-display text-sm uppercase tracking-[0.15em] text-text">Order Entry</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelCls}>Instrument</label>
          <select className={inputCls} value={form.instrument} onChange={e => setForm(f => ({ ...f, instrument: e.target.value as Instrument }))}>
            {instruments.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Order Type</label>
          <select className={inputCls} value={form.orderType} onChange={e => setForm(f => ({ ...f, orderType: e.target.value as OrderType }))}>
            {orderTypes.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Quantity</label>
          <input className={inputCls} type="number" placeholder="e.g. 250" value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Limit Price {form.orderType !== 'LIMIT' && <span className="text-muted">(N/A)</span>}</label>
          <input className={inputCls} type="number" placeholder="e.g. 4250.00"
            disabled={form.orderType !== 'LIMIT'} value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            style={{ opacity: form.orderType !== 'LIMIT' ? 0.4 : 1 }} />
        </div>
      </div>

      <div className="mb-5">
        <label className={labelCls}>Strategy Tag</label>
        <div className="flex gap-2 flex-wrap">
          {strategies.map(s => (
            <button key={s} onClick={() => setForm(f => ({ ...f, strategy: s }))}
              className="px-3 py-1 rounded text-xs font-mono border transition-all"
              style={{
                background: form.strategy === s ? '#00d4aa15' : 'transparent',
                borderColor: form.strategy === s ? '#00d4aa' : '#1e2130',
                color: form.strategy === s ? '#00d4aa' : '#4a5068',
              }}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs animate-slide-in">
          ⚠ {error}
        </div>
      )}

      <button onClick={submit} disabled={loading}
        className="w-full py-2.5 rounded font-mono text-sm font-medium transition-all"
        style={{
          background: loading ? '#1e2130' : '#00d4aa',
          color: loading ? '#4a5068' : '#0a0b0f',
          cursor: loading ? 'wait' : 'pointer',
        }}>
        {loading ? '◌ SUBMITTING ORDER...' : '→ SUBMIT ORDER'}
      </button>
    </div>
  )
}

// ─── State Machine Diagram ────────────────────────────────────────────────────
function StateMachineDiagram({ currentState }: { currentState?: OrderState }) {
  const states: { s: OrderState; label: string }[] = [
    { s: 'CREATED', label: 'CREATED' },
    { s: 'VALIDATED', label: 'VALIDATED' },
    { s: 'RISK_APPROVED', label: 'RISK OK' },
    { s: 'READY', label: 'READY' },
  ]
  const rejected = currentState === 'REJECTED'

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {states.map((node, i) => {
        const isActive = currentState === node.s
        const isPast = currentState && !rejected && states.findIndex(n => n.s === currentState) > i
        return (
          <div key={node.s} className="flex items-center gap-1">
            <div className="px-2 py-1 rounded text-xs font-mono border transition-all"
              style={{
                background: isActive ? '#00d4aa20' : isPast ? '#00d4aa08' : 'transparent',
                borderColor: isActive ? '#00d4aa' : isPast ? '#00d4aa40' : '#1e2130',
                color: isActive ? '#00d4aa' : isPast ? '#00d4aa80' : '#4a5068',
                fontWeight: isActive ? '600' : '400',
              }}>
              {node.label}
            </div>
            {i < states.length - 1 && (
              <span style={{ color: isPast || isActive ? '#00d4aa60' : '#1e2130' }} className="text-xs">→</span>
            )}
          </div>
        )
      })}
      {rejected && (
        <>
          <span className="text-xs" style={{ color: '#ff456060' }}>⟶</span>
          <div className="px-2 py-1 rounded text-xs font-mono border"
            style={{ background: '#ff456015', borderColor: '#ff4560', color: '#ff4560', fontWeight: 600 }}>
            REJECTED
          </div>
        </>
      )}
    </div>
  )
}

// ─── Order Blotter Table ──────────────────────────────────────────────────────
function OrderBlotter() {
  const dispatch = useDispatch<AppDispatch>()
  const orders = useSelector((s: RootState) => s.orders.orders)
  const selectedId = useSelector((s: RootState) => s.orders.selectedOrderId)

  if (orders.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-8 text-center animate-fade-in">
        <div style={{ color: '#1e2130', fontSize: 48, fontFamily: 'monospace' }}>⬡</div>
        <p className="text-muted text-xs mt-3 font-mono">No orders submitted yet.</p>
        <p className="text-muted text-xs mt-1" style={{ color: '#2a3050' }}>Use the entry panel to create your first simulated order.</p>
      </div>
    )
  }

  const thCls = "text-left text-xs text-muted uppercase tracking-widest py-3 px-4 font-mono border-b border-border"
  const tdCls = "py-3 px-4 text-xs font-mono border-b border-border/50 cursor-pointer"

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-accent rounded-full" />
          <h2 className="font-display text-sm uppercase tracking-[0.15em] text-text">Order Blotter</h2>
          <span className="text-xs text-muted font-mono">({orders.length} order{orders.length !== 1 ? 's' : ''})</span>
        </div>
        <button onClick={() => dispatch(clearOrders())}
          className="text-xs text-muted hover:text-danger transition-colors font-mono px-3 py-1 rounded border border-border hover:border-danger/30">
          CLEAR ALL
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className={thCls}>Order ID</th>
              <th className={thCls}>Instrument</th>
              <th className={thCls}>Type</th>
              <th className={thCls}>Qty</th>
              <th className={thCls}>Price</th>
              <th className={thCls}>Strategy</th>
              <th className={thCls}>State</th>
              <th className={thCls}>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}
                onClick={() => dispatch(selectOrder(selectedId === order.id ? null : order.id))}
                style={{
                  background: selectedId === order.id ? '#00d4aa08' : 'transparent',
                  transition: 'background 0.15s',
                }}
                className="hover:bg-white/[0.02] transition-colors">
                <td className={tdCls} style={{ color: '#4a90d9' }}>
                  {order.id.slice(0, 8).toUpperCase()}
                </td>
                <td className={tdCls} style={{ color: '#c8cde4' }}>{order.instrument}</td>
                <td className={tdCls} style={{ color: order.orderType === 'LIMIT' ? '#f5a623' : '#c8cde4' }}>
                  {order.orderType}
                </td>
                <td className={tdCls} style={{ color: '#c8cde4' }}>{order.quantity.toLocaleString()}</td>
                <td className={tdCls} style={{ color: '#c8cde4' }}>
                  {order.price ? `$${order.price.toLocaleString()}` : '—'}
                </td>
                <td className={tdCls} style={{ color: '#9b6dff' }}>{order.strategy.replace('_', ' ')}</td>
                <td className={tdCls}><StateBadge state={order.state} /></td>
                <td className={tdCls} style={{ color: '#4a5068' }}>
                  {new Date(order.createdAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Order Detail Panel ───────────────────────────────────────────────────────
function OrderDetailPanel() {
  const dispatch = useDispatch<AppDispatch>()
  const orders = useSelector((s: RootState) => s.orders.orders)
  const selectedId = useSelector((s: RootState) => s.orders.selectedOrderId)
  const order = orders.find(o => o.id === selectedId)

  if (!order) return null

  return (
    <div className="bg-surface border border-border rounded-lg animate-slide-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full" style={{ background: '#4a90d9' }} />
          <h2 className="font-display text-sm uppercase tracking-[0.15em] text-text">Order Detail</h2>
          <span className="text-xs font-mono" style={{ color: '#4a90d9' }}>{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <button onClick={() => dispatch(selectOrder(null))}
          className="text-muted hover:text-text transition-colors text-lg leading-none">×</button>
      </div>

      <div className="p-6 space-y-6">
        {/* State Machine */}
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-3 font-mono">Lifecycle State</p>
          <StateMachineDiagram currentState={order.state} />
          {order.rejectionReason && (
            <div className="mt-3 px-3 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
              ✗ {order.rejectionReason}
            </div>
          )}
        </div>

        {/* Validation Steps */}
        {order.validationSteps.length > 0 && (
          <div>
            <p className="text-xs text-muted uppercase tracking-widest mb-3 font-mono">Validation Checks</p>
            <div className="space-y-2">
              {order.validationSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2 rounded border"
                  style={{
                    borderColor: step.passed ? '#00d4aa20' : '#ff456030',
                    background: step.passed ? '#00d4aa08' : '#ff456008',
                  }}>
                  <span className="text-sm mt-0.5 shrink-0" style={{ color: step.passed ? '#00d4aa' : '#ff4560' }}>
                    {step.passed ? '✓' : '✗'}
                  </span>
                  <div>
                    <p className="text-xs font-mono font-medium" style={{ color: step.passed ? '#00d4aa' : '#ff4560' }}>
                      {step.check}
                    </p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: '#6b7489' }}>{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transition History */}
        <div>
          <p className="text-xs text-muted uppercase tracking-widest mb-3 font-mono">Transition History</p>
          <div className="space-y-1">
            {order.transitions.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded border border-border/50">
                <span className="text-xs font-mono" style={{ color: '#4a5068', minWidth: 80 }}>
                  {new Date(t.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-xs" style={{ color: '#4a5068' }}>
                  <span style={{ color: '#c8cde4' }}>{t.from}</span>
                  <span style={{ color: '#4a5068' }}> → </span>
                  <span style={{ color: t.to === 'REJECTED' ? '#ff4560' : t.to === 'READY' ? '#4caf50' : '#00d4aa' }}>
                    {t.to}
                  </span>
                </span>
                {t.note && <span className="text-xs" style={{ color: '#2a3050' }}>— {t.note}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  const orders = useSelector((s: RootState) => s.orders.orders)
  const total = orders.length
  const ready = orders.filter(o => o.state === 'READY').length
  const rejected = orders.filter(o => o.state === 'REJECTED').length
  const pending = orders.filter(o => !['READY', 'REJECTED'].includes(o.state)).length
  const fillRate = total ? Math.round((ready / total) * 100) : 0

  const stat = (label: string, value: string | number, color: string) => (
    <div className="flex items-center gap-4 px-5 py-3 border-r border-border last:border-r-0">
      <div>
        <p className="text-xs text-muted uppercase tracking-widest font-mono">{label}</p>
        <p className="text-lg font-mono font-semibold mt-0.5" style={{ color }}>{value}</p>
      </div>
    </div>
  )

  return (
    <div className="bg-surface border border-border rounded-lg flex flex-wrap">
      {stat('Total Orders', total, '#c8cde4')}
      {stat('Ready', ready, '#4caf50')}
      {stat('Rejected', rejected, '#ff4560')}
      {stat('In Flight', pending, '#f5a623')}
      {stat('Fill Rate', `${fillRate}%`, '#00d4aa')}
    </div>
  )
}

// ─── Root Page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #1e2130', background: '#111218' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div style={{ width: 32, height: 32, background: '#00d4aa', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#0a0b0f', fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>TF</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-base" style={{ color: '#c8cde4', letterSpacing: '0.05em' }}>
                TRADEFLOW<span style={{ color: '#00d4aa' }}>.</span>SIM
              </h1>
              <p className="text-xs font-mono" style={{ color: '#4a5068', marginTop: 1 }}>
                Order Lifecycle & Validation Engine · Derivatives Simulation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded border text-xs font-mono"
              style={{ background: '#4caf5010', borderColor: '#4caf5040', color: '#4caf50' }}>
              ● SIMULATION MODE
            </span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <StatsBar />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-5">
            <OrderEntryForm />
            {/* Risk legend */}
            <div className="bg-surface border border-border rounded-lg p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 rounded-full" style={{ background: '#f5a623' }} />
                <h3 className="font-display text-xs uppercase tracking-[0.15em] text-text">Risk Limits Reference</h3>
              </div>
              <div className="space-y-2">
                {[
                  { inst: 'INDEX', maxQty: 500, maxPrice: '1K–30K' },
                  { inst: 'FUTURES', maxQty: 1000, maxPrice: '50–50K' },
                  { inst: 'EQUITY', maxQty: 5000, maxPrice: '0.01–10K' },
                ].map(r => (
                  <div key={r.inst} className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-border/50 last:border-0">
                    <span style={{ color: '#9b6dff' }}>{r.inst}</span>
                    <span style={{ color: '#4a5068' }}>Max qty: <span style={{ color: '#c8cde4' }}>{r.maxQty}</span></span>
                    <span style={{ color: '#4a5068' }}>Px: <span style={{ color: '#c8cde4' }}>{r.maxPrice}</span></span>
                  </div>
                ))}
                <p className="text-xs font-mono pt-1" style={{ color: '#2a3050' }}>Daily exp cap: 15% · ARBITRAGE blocked on INDEX</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-5">
            <OrderBlotter />
            <OrderDetailPanel />
          </div>
        </div>
      </main>
    </div>
  )
}
