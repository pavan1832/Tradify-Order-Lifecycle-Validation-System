// components/StateBadge.tsx
import type { OrderState } from "@/lib/validationEngine";

const STATE_CONFIG: Record<OrderState, { label: string; cls: string; dot: string }> = {
  CREATED: { label: "CREATED", cls: "badge-created", dot: "var(--text-secondary)" },
  VALIDATED: { label: "VALIDATED", cls: "badge-validated", dot: "var(--accent)" },
  RISK_APPROVED: { label: "RISK OK", cls: "badge-risk", dot: "var(--amber)" },
  READY: { label: "READY", cls: "badge-ready", dot: "var(--green)" },
  REJECTED: { label: "REJECTED", cls: "badge-rejected", dot: "var(--red)" },
};

export function StateBadge({ state }: { state: OrderState }) {
  const cfg = STATE_CONFIG[state];
  return (
    <span className={`badge ${cfg.cls}`}>
      <span style={{ 
        width: 5, height: 5, borderRadius: "50%", 
        background: cfg.dot, display: "inline-block",
        flexShrink: 0
      }} />
      {cfg.label}
    </span>
  );
}
