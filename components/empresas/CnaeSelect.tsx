"use client";

import { useEffect, useRef, useState } from "react";
import { CNAE_LIST } from "@/data/cnae";

type Props = {
  value: string;
  onChange: (code: string, description: string) => void;
};

export function CnaeSelect({ value, onChange }: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim().length < 1
    ? CNAE_LIST.slice(0, 60)
    : CNAE_LIST.filter(
        (c) =>
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 80);

  function select(code: string, description: string) {
    setQuery(code);
    setOpen(false);
    onChange(code, description);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        setHighlighted(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) {
        select(filtered[highlighted].code, filtered[highlighted].description);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        autoComplete="off"
        className="input"
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(0);
          if (e.target.value === "") onChange("", "");
        }}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Ex: 6920-6/01 ou digite a atividade..."
        style={{ width: "100%", paddingRight: "2rem" }}
        value={query}
      />
      <span style={{ position: "absolute", right: "0.65rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.75rem", color: "#9ca3af" }}>
        {open ? "▲" : "▼"}
      </span>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #d1e7da",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(6,23,13,0.13)",
            zIndex: 999,
            maxHeight: 280,
            overflowY: "auto",
            padding: 0,
            margin: 0,
            listStyle: "none",
          }}
        >
          {query.trim() === "" && (
            <li style={{ padding: "0.5rem 0.9rem", fontSize: "0.7rem", fontWeight: 700, color: "#10b981", letterSpacing: "1.5px", textTransform: "uppercase", borderBottom: "1px solid #f0f7f3", background: "#f8fdfb" }}>
              Todos os CNAEs disponíveis — {CNAE_LIST.length} códigos
            </li>
          )}
          {query.trim().length > 0 && (
            <li style={{ padding: "0.5rem 0.9rem", fontSize: "0.7rem", fontWeight: 700, color: "#6f8f7c", letterSpacing: "1px", borderBottom: "1px solid #f0f7f3", background: "#f8fdfb" }}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "{query}"
            </li>
          )}
          {filtered.map((item, i) => (
            <li
              key={item.code}
              onMouseDown={() => select(item.code, item.description)}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "0.6rem",
                alignItems: "center",
                padding: "0.6rem 0.9rem",
                cursor: "pointer",
                borderBottom: "1px solid #f5faf7",
                background: i === highlighted ? "#f0fdf4" : "transparent",
                transition: "background 0.1s",
              }}
            >
              <span style={{
                background: i === highlighted ? "#10b981" : "#e6f0ea",
                color: i === highlighted ? "#fff" : "#065f46",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: "0.74rem",
                fontWeight: 800,
                whiteSpace: "nowrap",
                fontFamily: "monospace",
              }}>
                {item.code}
              </span>
              <span style={{ fontSize: "0.8rem", color: i === highlighted ? "#065f46" : "#374151", fontWeight: i === highlighted ? 600 : 400 }}>
                {item.description}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
