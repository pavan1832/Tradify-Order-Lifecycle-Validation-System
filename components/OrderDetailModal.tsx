"use client";
// components/OrderDetailModal.tsx
import { StateBadge } from "./StateBadge";
import type { Order } from "@/store/slices/ordersSlice";
import type { OrderState } from "@/lib/validationEngine";

const STATE_ORDER: OrderState[] = [
  "CREATED",
  "VALIDATED",
  "RISK_APPROVED",
  "READY",
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    hour12: false,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const allStates: OrderState[] = order.state === "REJECTED"
    ? ["CREATED", "REJECTED"]
    : ["CREATED", "VALIDATED", "RISK_APPROVED", "READY"];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8,12,16,0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-bright)",
          borderRadius: 2,
          width: "100%",
          maxWidth: 780,
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 1px rgba(0,212,255,0.2)",
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>ORDER</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--accent)", fontWeight: 600 }}>
              #{order.id.toUpperCase()}
            </span>
            <StateBadge state={order.state} />
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: "0 4px"
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
          {/* Left: order info + lifecycle */}
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Order summary */}
            <div>
              <SectionHeader>Order Parameters</SectionHeader>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <KV label="Instrument" value={order.instrument} accent />
                <KV label="Order Type" value={order.orderType} />
                <KV label="Quantity" value={order.quantity.toLocaleString()} />
                <KV label="Price" value={order.price != null ? `$${order.price.toLocaleString()}` : "MARKET"} />
                <KV label="Strategy" value={order.strategy} />
                <KV label="Risk Score" value={`${order.riskScore}/100`} accent={order.riskScore > 70} />
              </div>
            </div>

            {/* Lifecycle state machine */}
            <div>
              <SectionHeader>Lifecycle State Machine</SectionHeader>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {allStates.map((st, idx) => {
                  const reached = order.transitions.some((t) => t.to === st) || st === "CREATED";
                  const isCurrent = order.state === st;
                  const transitionTo = order.transitions.find((t) => t.to === st);

                  return (
                    <div key={st} style={{ display: "flex", gap: 12 }}>
                      {/* Timeline */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          border: "1.5px solid",
                          borderColor: reached
                            ? st === "REJECTED" ? "var(--red)" : "var(--green)"
                            : "var(--border)",
                          background: reached
                            ? st === "REJECTED" ? "rgba(255,75,75,0.3)" : "rgba(0,230,118,0.3)"
                            : "var(--bg)",
                          boxShadow: isCurrent ? `0 0 8px ${st === "REJECTED" ? "var(--red)" : "var(--green)"}` : "none",
                          flexShrink: 0,
                          marginTop: 4
                        }} />
                        {idx < allStates.length - 1 && (
                          <div style={{
                            width: 1,
                            flex: 1,
                            minHeight: 24,
                            background: reached ? "var(--border-bright)" : "var(--border)",
                            margin: "3px 0"
                          }} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ paddingBottom: idx < allStates.length - 1 ? 8 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            color: reached
                              ? st === "REJECTED" ? "var(--red)" : "var(--text-primary)"
                              : "var(--text-muted)"
                          }}>
                            {st}
                          </span>
                          {isCurrent && (
                            <span style={{ fontSize: 9, background: "rgba(0,212,255,0.1)", color: "var(--accent)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 10, padding: "0 6px" }}>
                              CURRENT
                            </span>
                          )}
                        </div>
                        {transitionTo && (
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                            {formatDateTime(transitionTo.timestamp)}
                          </div>
                        )}
                        {transitionTo?.reason && (
                          <div style={{ fontSize: 11, color: "var(--red)", marginTop: 2 }}>
                            {transitionTo.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: validation steps */}
          <div style={{ flex: "1 1 300px" }}>
            <SectionHeader>Validation Steps</SectionHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {order.validationSteps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg)",
                    border: `1px solid ${step.passed ? "rgba(0,230,118,0.15)" : "rgba(255,75,75,0.2)"}`,
                    borderRadius: 2,
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                      {step.name}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      color: step.passed ? "var(--green)" : "var(--red)"
                    }}>
                      {step.passed ? "✓ PASS" : "✗ FAIL"}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: step.passed ? "var(--text-muted)" : "var(--red)", opacity: step.passed ? 1 : 0.85 }}>
                    {step.message}
                  </p>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                    {formatDateTime(step.timestamp)}
                  </div>
                </div>
              ))}
            </div>

            {/* Final outcome */}
            <div style={{
              marginTop: 12,
              padding: "12px",
              background: order.state === "READY"
                ? "rgba(0,230,118,0.05)"
                : "rgba(255,75,75,0.05)",
              border: `1px solid ${order.state === "READY" ? "rgba(0,230,118,0.2)" : "rgba(255,75,75,0.2)"}`,
              borderRadius: 2
            }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Final Outcome
              </div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 700, 
                color: order.state === "READY" ? "var(--green)" : "var(--red)",
                letterSpacing: "0.05em"
              }}>
                {order.state === "READY" ? "ORDER ACCEPTED — EXECUTION READY" : "ORDER REJECTED"}
              </div>
              {order.rejectionReason && (
                <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4, opacity: 0.8 }}>
                  {order.rejectionReason}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      borderBottom: "1px solid var(--border)",
      paddingBottom: 6,
      marginBottom: 10
    }}>
      {children}
    </div>
  );
}

function KV({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: accent ? "var(--accent)" : "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}
