"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export function BotaoVoltar({ href, label }: { href?: string; label?: string }) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, fontWeight: 600, color: "var(--muted)",
        textDecoration: "none", marginBottom: 16, padding: "6px 0",
        transition: "color 0.15s",
      }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label || "Voltar"}
      </Link>
    );
  }

  return (
    <button onClick={() => router.back()} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 13, fontWeight: 600, color: "var(--muted)",
      background: "none", border: "none", cursor: "pointer",
      marginBottom: 16, padding: "6px 0", transition: "color 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
      onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label || "Voltar"}
    </button>
  );
}
