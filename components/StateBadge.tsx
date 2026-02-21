"use client";

// components/StateBadge.tsx
import type { OrderState } from "@/lib/types";

const STATE_CONFIG: Record<
  OrderState,
  { label: string; cls: string; dot: string }
> = {
  CREATED: {
    label: "CREATED",
    cls: "badge-created",
    dot: "var(--text-secondary)",
  },
  VALIDATED: {
    label: "VALIDATED",
    cls: "badge-validated",
    dot: "var(--amber)",
  },
  RISK_APPROVED: {
    label: "RISK APPROVED",
    cls: "badge-risk",
    dot: "var(--amber)",
  },
  READY: {
    label: "READY",
    cls: "badge-ready",
    dot: "var(--green)",
  },
  REJECTED: {
    label: "REJECTED",
    cls: "badge-rejected",
    dot: "var(--red)",
  },
};

export function StateBadge({ state }: { state: OrderState }) {
  const cfg = STATE_CONFIG[state];

  return (
    <span
      className={cfg.cls}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.08em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
        }}
      />
      {cfg.label}
    </span>
  );
}
