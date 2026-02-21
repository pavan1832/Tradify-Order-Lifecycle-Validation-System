"use client";
// components/TopBar.tsx
import { useAppSelector } from "@/store/hooks";

const TICKER_ITEMS = [
  { label: "SPX", value: "5,843.12", change: "+0.34%" },
  { label: "NQ1!", value: "20,741.50", change: "+0.18%" },
  { label: "VIX", value: "14.22", change: "-1.82%" },
  { label: "ES1!", value: "5,819.75", change: "+0.31%" },
  { label: "CL1!", value: "78.42", change: "-0.44%" },
  { label: "GC1!", value: "2,321.80", change: "+0.21%" },
];

export function TopBar() {
  const orders = useAppSelector((s) => s.orders.orders);
  const readyCount = orders.filter((o) => o.state === "READY").length;
  const rejectedCount = orders.filter((o) => o.state === "REJECTED").length;

  return (
    <header style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
      {/* Ticker tape */}
      <div style={{ 
        borderBottom: "1px solid var(--border)", 
        padding: "5px 0", 
        overflow: "hidden",
        position: "relative"
      }}>
        <div style={{
          display: "flex",
          gap: 40,
          whiteSpace: "nowrap",
          animation: "ticker-slide 30s linear infinite",
        }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} style={{ 
              fontFamily: "var(--font-mono)", 
              fontSize: 11,
              color: "var(--text-secondary)"
            }}>
              <span style={{ color: "var(--accent)", marginRight: 6 }}>{t.label}</span>
              {t.value}
              <span style={{ 
                color: t.change.startsWith("+") ? "var(--green)" : "var(--red)",
                marginLeft: 6
              }}>
                {t.change}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Main header */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: "12px 24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Logo mark */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="1" y="1" width="22" height="22" rx="2" stroke="var(--accent)" strokeWidth="1"/>
              <path d="M5 17L9 11L13 14L19 7" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="19" cy="7" r="2" fill="var(--green)"/>
            </svg>
            <span style={{ 
              fontFamily: "var(--font-display)", 
              fontSize: 18, 
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em"
            }}>
              TRADE<span style={{ color: "var(--accent)" }}>FLOW</span>
            </span>
          </div>
          <span style={{ 
            fontSize: 10, 
            color: "var(--text-muted)", 
            borderLeft: "1px solid var(--border)", 
            paddingLeft: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase"
          }}>
            Order Lifecycle Simulator
          </span>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          <Stat label="TOTAL ORDERS" value={orders.length} />
          <Stat label="READY" value={readyCount} accent="var(--green)" />
          <Stat label="REJECTED" value={rejectedCount} accent="var(--red)" />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="animate-blink" style={{ 
              width: 6, height: 6, borderRadius: "50%", 
              background: "var(--green)", display: "inline-block" 
            }} />
            <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em" }}>LIVE SIM</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: accent ?? "var(--text-primary)", lineHeight: 1 }}>{value}</div>
    </div>
  );
}
