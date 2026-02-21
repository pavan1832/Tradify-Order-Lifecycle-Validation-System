"use client";

import { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { addOrder } from "@/store/slices/ordersSlice";
import { v4 as uuidv4 } from "uuid";
import type { Order } from "@/lib/types";

const INSTRUMENTS = ["INDEX", "FUTURES", "EQUITY"] as const;
const ORDER_TYPES = ["MARKET", "LIMIT"] as const;
const STRATEGIES = [
  "DELTA_NEUTRAL",
  "MOMENTUM",
  "ARBITRAGE",
  "MEAN_REVERSION",
  "CUSTOM",
] as const;

const INSTRUMENT_PRESETS: Record<string, { qty: number; price: number }> = {
  INDEX: { qty: 10, price: 5400 },
  FUTURES: { qty: 25, price: 5820 },
  EQUITY: { qty: 200, price: 142 },
};

export function OrderEntryForm() {
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    instrument: "INDEX" as typeof INSTRUMENTS[number],
    orderType: "LIMIT" as typeof ORDER_TYPES[number],
    quantity: "10",
    price: "5400",
    strategy: "DELTA_NEUTRAL" as typeof STRATEGIES[number],
  });

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "instrument") {
        const preset = INSTRUMENT_PRESETS[value as string];
        next.quantity = String(preset.qty);
        next.price = String(preset.price);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const now = new Date().toISOString();

    const order: Order = {
      id: uuidv4(),
      instrument: form.instrument,
      orderType: form.orderType,
      quantity: Number(form.quantity),
      price: form.orderType === "LIMIT" ? Number(form.price) : undefined,
      strategy: form.strategy,
      state: "CREATED",
      validationSteps: [],
      transitions: [],
      riskScore: Math.floor(Math.random() * 100),
      createdAt: now,
    };

    dispatch(addOrder(order));
  }

  const isLimit = form.orderType === "LIMIT";

  return (
    <aside
      style={{
        width: 280,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          New Order Entry
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          flex: 1,
        }}
      >
        {/* Instrument */}
        <div>
          <label className="tf-label">Instrument</label>
          <div style={{ display: "flex", gap: 4 }}>
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst}
                type="button"
                onClick={() => update("instrument", inst)}
                className="tf-toggle"
                data-active={form.instrument === inst}
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
                className="tf-toggle"
                data-active={form.orderType === ot}
              >
                {ot}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="tf-label">Quantity</label>
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
              required
            />
          </div>
        )}

        {/* Strategy */}
        <div>
          <label className="tf-label">Strategy</label>
          <select
            className="tf-select"
            value={form.strategy}
            onChange={(e) =>
              update("strategy", e.target.value as typeof form.strategy)
            }
          >
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button type="submit" className="tf-btn" style={{ marginTop: "auto" }}>
          SUBMIT ORDER →
        </button>
      </form>

      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          fontSize: 10,
          color: "var(--text-muted)",
        }}
      >
        Local validation • Redux Toolkit state
      </div>
    </aside>
  );
}
