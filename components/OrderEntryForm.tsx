"use client";
// components/OrderEntryForm.tsx
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { submitOrder, clearError } from "@/store/slices/ordersSlice";
import type { OrderInput } from "@/lib/validationEngine";

const INSTRUMENTS = ["INDEX", "FUTURES", "EQUITY"] as const;
const ORDER_TYPES = ["MARKET", "LIMIT"] as const;
const STRATEGIES = [
  "DELTA-NEUTRAL",
  "MOMENTUM",
  "ARBITRAGE",
  "MEAN-REVERSION",
  "TREND-FOLLOWING",
] as const;

const INSTRUMENT_PRESETS: Record<string, { qty: number; price: number }> = {
  INDEX: { qty: 10, price: 5400 },
  FUTURES: { qty: 25, price: 5820 },
  EQUITY: { qty: 200, price: 142 },
};

export function OrderEntryForm() {
  const dispatch = useAppDispatch();
  const { submitting, error } = useAppSelector((s) => s.orders);

  const [form, setForm] = useState<{
    instrument: typeof INSTRUMENTS[number];
    orderType: typeof ORDER_TYPES[number];
    quantity: string;
    price: string;
    strategy: typeof STRATEGIES[number];
  }>({
    instrument: "INDEX",
    orderType: "LIMIT",
    quantity: "10",
    price: "5400",
    strategy: "DELTA-NEUTRAL",
  });

  function update<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    if (error) dispatch(clearError());
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "instrument") {
        const preset = INSTRUMENT_PRESETS[val as string];
        next.quantity = String(preset.qty);
        next.price = String(preset.price);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: OrderInput = {
      instrument: form.instrument,
      orderType: form.orderType,
      quantity: Number(form.quantity),
      strategy: form.strategy,
      ...(form.orderType === "LIMIT" && form.price
        ? { price: Number(form.price) }
        : {}),
    };
    dispatch(submitOrder(input));
  }

  const isLimit = form.orderType === "LIMIT";

  return (
    <aside style={{ 
      width: 280, 
      flexShrink: 0,
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{ 
        padding: "14px 16px", 
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 8
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
          New Order Entry
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        {/* Instrument */}
        <div>
          <label className="tf-label">Instrument</label>
          <div style={{ display: "flex", gap: 4 }}>
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst}
                type="button"
                onClick={() => update("instrument", inst)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  border: "1px solid",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: form.instrument === inst ? "rgba(0,212,255,0.12)" : "var(--bg)",
                  borderColor: form.instrument === inst ? "var(--accent)" : "var(--border)",
                  color: form.instrument === inst ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {inst}
              </button>
            ))}
          </div>
        </div>

        {/* Order Type */}
        <div>
          <label className="tf-label">Order Type</label>
          <div style={{ display: "flex", gap: 4 }}>
            {ORDER_TYPES.map((ot) => (
              <button
                key={ot}
                type="button"
                onClick={() => update("orderType", ot)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  border: "1px solid",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: form.orderType === ot ? "rgba(0,212,255,0.12)" : "var(--bg)",
                  borderColor: form.orderType === ot ? "var(--accent)" : "var(--border)",
                  color: form.orderType === ot ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {ot}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="tf-label">Quantity (lots)</label>
          <input
            className="tf-input"
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => update("quantity", e.target.value)}
            required
          />
        </div>

        {/* Price */}
        {isLimit && (
          <div>
            <label className="tf-label">Limit Price</label>
            <input
              className="tf-input"
              type="number"
              min={0.01}
              step={0.01}
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              required={isLimit}
            />
          </div>
        )}

        {/* Strategy */}
        <div>
          <label className="tf-label">Strategy Tag</label>
          <select
            className="tf-select"
            value={form.strategy}
            onChange={(e) => update("strategy", e.target.value as typeof form.strategy)}
          >
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Notional preview */}
        {isLimit && form.price && form.quantity && (
          <div style={{ 
            background: "var(--bg)", 
            border: "1px solid var(--border)", 
            borderRadius: 2, 
            padding: "8px 10px",
            fontSize: 11
          }}>
            <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>NOTIONAL EXPOSURE</div>
            <div style={{ color: "var(--amber)", fontWeight: 600 }}>
              ${(Number(form.quantity) * Number(form.price)).toLocaleString()}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ 
            background: "rgba(255,75,75,0.08)", 
            border: "1px solid rgba(255,75,75,0.3)",
            borderRadius: 2,
            padding: "8px 10px",
            fontSize: 11,
            color: "var(--red)"
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="tf-btn"
          disabled={submitting}
          style={{ marginTop: "auto" }}
        >
          {submitting ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: "spin-slow 1s linear infinite" }}>
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" fill="none"/>
              </svg>
              VALIDATING...
            </span>
          ) : (
            "SUBMIT ORDER →"
          )}
        </button>
      </form>

      {/* Footer note */}
      <div style={{ 
        padding: "10px 16px", 
        borderTop: "1px solid var(--border)",
        fontSize: 10,
        color: "var(--text-muted)",
        lineHeight: 1.5
      }}>
        Server-side validation via Node.js.<br/>
        State managed by Redux Toolkit.
      </div>
    </aside>
  );
}
