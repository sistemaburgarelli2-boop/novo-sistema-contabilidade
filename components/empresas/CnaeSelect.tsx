"use client";

import { useEffect, useRef, useState } from "react";
import { CNAE_LIST, SECOES, getSecao } from "@/data/cnae";

type Props = {
  value: string;
  onChange: (code: string, description: string) => void;
};

type RowItem =
  | { kind: "section"; id: string; label: string; emoji: string; count: number }
  | { kind: "cnae"; code: string; description: string; secao: string };

export function CnaeSelect({ value, onChange }: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState<number>(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearching = query.trim().length >= 2;

  /* ── Build rows for display ─────────────────────────────────────────── */
  const rows: RowItem[] = (() => {
    if (isSearching) {
      const filtered = CNAE_LIST.filter(
        (c) =>
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 100);

      // group by section
      const grouped = new Map<string, typeof filtered>();
      for (const c of filtered) {
        const s = getSecao(c.code);
        if (!grouped.has(s)) grouped.set(s, []);
        grouped.get(s)!.push(c);
      }

      const out: RowItem[] = [];
      for (const [secId, items] of grouped) {
        const sec = SECOES.find((s) => s.id === secId)!;
        out.push({ kind: "section", id: secId, label: sec.label, emoji: sec.emoji, count: items.length });
        for (const c of items) out.push({ kind: "cnae", code: c.code, description: c.description, secao: secId });
      }
      return out;
    }

    // no search: show all sections, expand clicked ones
    const out: RowItem[] = [];
    for (const sec of SECOES) {
      const items = CNAE_LIST.filter((c) => getSecao(c.code) === sec.id);
      out.push({ kind: "section", id: sec.id, label: sec.label, emoji: sec.emoji, count: items.length });
      if (expandedSections.has(sec.id)) {
        for (const c of items) out.push({ kind: "cnae", code: c.code, description: c.description, secao: sec.id });
      }
    }
    return out;
  })();

  /* ── Navigable rows (only CNAE items) ──────────────────────────────── */
  const navIndices = rows.reduce<number[]>((acc, r, i) => {
    if (r.kind === "cnae") acc.push(i);
    return acc;
  }, []);

  function select(code: string, description: string) {
    setQuery(code);
    setOpen(false);
    setHighlighted(-1);
    onChange(code, description);
  }

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); return; }
      return;
    }
    const pos = navIndices.indexOf(highlighted);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = navIndices[Math.min(pos + 1, navIndices.length - 1)];
      if (next !== undefined) setHighlighted(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = navIndices[Math.max(pos - 1, 0)];
      if (prev !== undefined) setHighlighted(prev);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[highlighted];
      if (row?.kind === "cnae") select(row.code, row.description);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (!open || highlighted < 0 || !listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  useEffect(() => { setQuery(value ?? ""); }, [value]);

  /* ── When typing, expand all matching sections ──────────────────────── */
  useEffect(() => {
    if (!isSearching) return;
    const matchedSecs = new Set(
      CNAE_LIST
        .filter((c) => c.code.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase()))
        .map((c) => getSecao(c.code))
    );
    setExpandedSections(matchedSecs);
  }, [query, isSearching]);

  const totalResults = isSearching ? rows.filter((r) => r.kind === "cnae").length : 0;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        autoComplete="off"
        className="input"
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(-1);
          if (e.target.value === "") onChange("", "");
        }}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Clique ou digite código / atividade..."
        style={{ width: "100%", paddingRight: "2rem" }}
        value={query}
      />
      <span style={{ position: "absolute", right: "0.65rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.7rem", color: "#9ca3af" }}>
        {open ? "▲" : "▼"}
      </span>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #d1e7da",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(6,23,13,0.15)",
          zIndex: 999,
          maxHeight: 360,
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}>
          {/* Cabeçalho */}
          <div style={{ padding: "0.55rem 1rem", background: "linear-gradient(90deg,#f0fdf4,#f8fdfb)", borderBottom: "1px solid #e6f0ea", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#10b981", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              {isSearching ? `${totalResults} resultado${totalResults !== 1 ? "s" : ""} para "${query}"` : `${CNAE_LIST.length} CNAEs — 21 categorias`}
            </span>
            {!isSearching && <span style={{ fontSize: "0.68rem", color: "#9ca3af" }}>Clique na categoria para expandir</span>}
          </div>

          <ul ref={listRef} style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {rows.map((row, i) => {
              if (row.kind === "section") {
                const isExpanded = isSearching || expandedSections.has(row.id);
                return (
                  <li
                    key={`sec-${row.id}`}
                    onClick={() => !isSearching && toggleSection(row.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.6rem 0.9rem",
                      background: "#f3f8f5",
                      borderBottom: "1px solid #e6f0ea",
                      cursor: isSearching ? "default" : "pointer",
                      userSelect: "none",
                    }}
                  >
                    <span style={{ fontSize: "1rem", flexShrink: 0 }}>{row.emoji}</span>
                    <span style={{ fontSize: "0.79rem", fontWeight: 800, color: "#065f46", flex: 1 }}>{row.label}</span>
                    <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 999, padding: "1px 8px", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}>
                      {row.count}
                    </span>
                    {!isSearching && (
                      <span style={{ fontSize: "0.7rem", color: "#6f8f7c", flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</span>
                    )}
                  </li>
                );
              }

              /* CNAE item */
              const isHl = highlighted === i;
              return (
                <li
                  key={row.code}
                  onMouseDown={() => select(row.code, row.description)}
                  onMouseEnter={() => setHighlighted(i)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "0.6rem",
                    alignItems: "center",
                    padding: "0.55rem 0.9rem 0.55rem 2.2rem",
                    cursor: "pointer",
                    borderBottom: "1px solid #f5faf7",
                    background: isHl ? "#f0fdf4" : "#fff",
                    transition: "background 0.08s",
                  }}
                >
                  <span style={{
                    background: isHl ? "#10b981" : "#e6f0ea",
                    color: isHl ? "#fff" : "#065f46",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: "0.73rem",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    fontFamily: "monospace",
                    letterSpacing: "0.3px",
                  }}>
                    {row.code}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: isHl ? "#065f46" : "#374151", fontWeight: isHl ? 600 : 400 }}>
                    {row.description}
                  </span>
                </li>
              );
            })}

            {rows.length === 0 && (
              <li style={{ padding: "1.25rem", textAlign: "center", color: "#9ca3af", fontSize: "0.82rem" }}>
                Nenhum CNAE encontrado para "{query}"
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
