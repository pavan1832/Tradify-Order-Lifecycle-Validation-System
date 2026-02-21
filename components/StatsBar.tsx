"use client";
// components/StatsBar.tsx
import { useAppSelector } from "@/store/hooks";

export function StatsBar() {
  const orders = useAppSelector((s) => s.orders.orders);

  const total = orders.length;
  const ready = orders.filter((o) => o.state === "READY").length;
  const rejected = orders.filter((o) => o.state === "REJECTED").length;
  const avgRisk = total > 0
    ? Math.round(orders.reduce((a, o) => a + o.riskScore, 0) / total)
    : 0;
  const acceptRate = total > 0 ? Math.round((ready / total) * 100) : 0;

  const stats = [
    { label: "Total Submitted", value: total, color: "var(--text-primary)" },
    { label: "Ready", value: ready, color: "var(--green)" },
    { label: "Rejected", value: rejected, color: "var(--red)" },
    { label: "Accept Rate", value: `${acceptRate}%`, color: acceptRate >= 70 ? "var(--green)" : acceptRate >= 40 ? "var(--amber)" : "var(--red)" },
    { label: "Avg Risk Score", value: `${avgRisk}/100`, color: avgRisk < 40 ? "var(--green)" : avgRisk < 70 ? "var(--amber)" : "var(--red)" },
  ];

  return (
    <div style={{
      display: "flex",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg-secondary)",
      flexShrink: 0
    }}>
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRight: i < stats.length - 1 ? "1px solid var(--border)" : "none",
            display: "flex",
            flexDirection: "column",
            gap: 2
          }}
        >
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {s.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1, fontFamily: "var(--font-display)" }}>
            {s.value}
          </div>
        </div>
      ))}

      {/* Pipeline visualization */}
      {total > 0 && (
        <div style={{
          flex: 2,
          padding: "10px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 4
        }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
            Order Pipeline
          </div>
          <div style={{ display: "flex", height: 6, borderRadius: 2, overflow: "hidden", gap: 1 }}>
            {ready > 0 && (
              <div style={{
                flex: ready,
                background: "var(--green)",
                opacity: 0.8
              }} title={`Ready: ${ready}`} />
            )}
            {rejected > 0 && (
              <div style={{
                flex: rejected,
                background: "var(--red)",
                opacity: 0.8
              }} title={`Rejected: ${rejected}`} />
            )}
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 10, color: "var(--text-muted)" }}>
            <span><span style={{ color: "var(--green)" }}>■</span> Ready</span>
            <span><span style={{ color: "var(--red)" }}>■</span> Rejected</span>
          </div>
        </div>
      )}
    </div>
  );
}
