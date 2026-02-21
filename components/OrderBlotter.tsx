"use client";
// components/OrderBlotter.tsx
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { removeOrder } from "@/store/slices/ordersSlice";
import { StateBadge } from "./StateBadge";
import { OrderDetailModal } from "./OrderDetailModal";
import type { Order } from "@/lib/types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function RiskBar({ score }: { score: number }) {
  const color =
    score < 40 ? "var(--green)" : score < 70 ? "var(--amber)" : "var(--red)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="risk-bar" style={{ width: 60 }}>
        <div
          className="risk-fill"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span style={{ fontSize: 11, color, minWidth: 28 }}>{score}</span>
    </div>
  );
}

export function OrderBlotter() {
  const orders = useAppSelector((s) => s.orders.orders);
  const dispatch = useAppDispatch();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const STATE_FILTERS = ["ALL", "READY", "REJECTED", "VALIDATED", "RISK_APPROVED"];

  const filtered =
    filter === "ALL" ? orders : orders.filter((o) => o.state === filter);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Blotter header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="12" rx="1" stroke="var(--accent)" strokeWidth="1"/>
            <path d="M3 4h8M3 7h8M3 10h5" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
            Order Blotter
          </span>
          <span style={{
            background: "rgba(0,212,255,0.1)",
            color: "var(--accent)",
            border: "1px solid rgba(0,212,255,0.2)",
            borderRadius: 10,
            padding: "0 8px",
            fontSize: 10,
            fontWeight: 600
          }}>
            {orders.length}
          </span>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {STATE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "4px 10px",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                letterSpacing: "0.08em",
                border: "1px solid",
                borderRadius: 2,
                cursor: "pointer",
                transition: "all 0.15s",
                background: filter === f ? "rgba(0,212,255,0.1)" : "transparent",
                borderColor: filter === f ? "var(--accent)" : "var(--border)",
                color: filter === f ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {filtered.length === 0 ? (
          <EmptyState hasOrders={orders.length > 0} />
        ) : (
          <table className="blotter-table">
            <thead style={{ position: "sticky", top: 0, background: "var(--bg-secondary)", zIndex: 10 }}>
              <tr>
                <th>Order ID</th>
                <th>Time</th>
                <th>Instrument</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Strategy</th>
                <th>Risk</th>
                <th>State</th>
                <th>Rejection</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="order-row"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td>
                    <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    {formatTime(order.createdAt)}
                  </td>
                  <td>
                    <span style={{ 
                      fontWeight: 600, 
                      color: order.instrument === "INDEX" ? "var(--accent)" 
                           : order.instrument === "FUTURES" ? "var(--amber)" 
                           : "var(--text-primary)"
                    }}>
                      {order.instrument}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{order.orderType}</td>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {order.quantity.toLocaleString()}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {order.price != null ? `$${order.price.toLocaleString()}` : <span style={{ color: "var(--text-muted)" }}>MKT</span>}
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: 10, 
                      color: "var(--text-muted)", 
                      background: "var(--bg-elevated)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 2, 
                      padding: "2px 6px"
                    }}>
                      {order.strategy}
                    </span>
                  </td>
                  <td><RiskBar score={order.riskScore} /></td>
                  <td><StateBadge state={order.state} /></td>
                  <td style={{ maxWidth: 200 }}>
                    {order.rejectionReason ? (
                      <span style={{ fontSize: 11, color: "var(--red)", opacity: 0.8 }} title={order.rejectionReason}>
                        {order.rejectionReason.length > 40
                          ? order.rejectionReason.slice(0, 40) + "…"
                          : order.rejectionReason}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td onClick={(e) => { e.stopPropagation(); dispatch(removeOrder(order.id)); }}>
                    <span style={{ 
                      color: "var(--text-muted)", 
                      cursor: "pointer", 
                      fontSize: 16, 
                      lineHeight: 1,
                      padding: "0 4px"
                    }}
                    title="Remove order"
                    >
                      ×
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ hasOrders }: { hasOrders: boolean }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: 320,
      gap: 12,
      color: "var(--text-muted)"
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity={0.3}>
        <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 20h16M16 26h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <p style={{ fontSize: 12, letterSpacing: "0.05em" }}>
        {hasOrders ? "No orders match filter" : "No orders submitted yet"}
      </p>
      {!hasOrders && (
        <p style={{ fontSize: 11, opacity: 0.6 }}>Submit an order using the entry panel →</p>
      )}
    </div>
  );
}
