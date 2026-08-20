import type { ReactNode } from "react";
import { PortalIcon } from "@/components/portal/PortalIcon";

/* ── Hero da página (mesmo padrão do .module-hero do sistema) ── */

export function PortalHero({
  actions,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="module-hero">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="hero-actions">{actions}</div> : null}
    </section>
  );
}

/* ── Estado vazio ── */

export function PortalEmpty({
  description,
  icon,
  title,
}: {
  description: string;
  icon: string;
  title: string;
}) {
  return (
    <div className="portal-empty">
      <span className="portal-empty-icon">
        <PortalIcon name={icon} size={26} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

/* ── Carregando (tela inteira) ── */

export function PortalLoading({ label = "Carregando portal..." }: { label?: string }) {
  return <div className="portal-loading">{label}</div>;
}

/* ── Filtros em chip ── */

export function PortalFilters({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <div className="portal-filters">
      {options.map((option) => (
        <button
          className={value === option ? "filter-chip active" : "filter-chip"}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

/* ── Campo de formulário ── */

export function PortalField({
  children,
  label,
  required,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="portal-field">
      <span>
        {label}
        {required ? <em>*</em> : null}
      </span>
      {children}
    </label>
  );
}

/* ── Métrica ── */

export function PortalMetric({
  hint,
  label,
  tone = "neutral",
  value,
}: {
  hint: string;
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  value: ReactNode;
}) {
  return (
    <div className={`metric-card metric-card-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{hint}</p>
    </div>
  );
}
