type PortalIconProps = {
  name: string;
  size?: number;
};

export function PortalIcon({ name, size = 18 }: PortalIconProps) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    height: size,
    viewBox: "0 0 24 24",
    width: size,
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (name === "documentos") {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M14 2v6h6" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "guias" || name === "impostos") {
    return (
      <svg {...common}>
        <path d="M5 3h14v18l-2.5-1.6L14 21l-2-1.6L10 21l-2.5-1.6L5 21V3z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "solicitacoes") {
    return (
      <svg {...common}>
        <path d="M4 13h4l2 3h4l2-3h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M5.5 5h13l1.5 8v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4l2.5-8z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "contratos") {
    return (
      <svg {...common}>
        <path d="M15 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6l-4-4z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9 12h6M9 8h3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M9 17c1-1.4 2-1.4 3 0s2 1.4 3 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "certificados") {
    return (
      <svg {...common}>
        <path d="M12 2l7 3.5v5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5v-5L12 2z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9.5 11.5l1.8 1.8 3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "financeiro") {
    return (
      <svg {...common}>
        <rect height="13" rx="2.5" stroke="currentColor" strokeWidth="2" width="18" x="3" y="6" />
        <path d="M3 10.5h18" stroke="currentColor" strokeWidth="2" />
        <path d="M16.5 15.5h1.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "historico") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5.2l3.2 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "notificacoes") {
    return (
      <svg {...common}>
        <path d="M6 9a6 6 0 1 1 12 0c0 3.4.8 5.2 1.6 6.2.4.5 0 1.3-.7 1.3H5.1c-.7 0-1.1-.8-.7-1.3C5.2 14.2 6 12.4 6 9z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M10 20a2.2 2.2 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "chamados") {
    return (
      <svg {...common}>
        <path d="M21 12a9 9 0 1 0-3.3 6.9L21 20l-1-3.2A8.9 8.9 0 0 0 21 12z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9.6 9.5a2.4 2.4 0 1 1 3.3 2.2c-.6.3-.9.8-.9 1.4v.3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M12 16.3h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
      </svg>
    );
  }

  if (name === "upload") {
    return (
      <svg {...common}>
        <path d="M12 16V4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M7.5 8.5 12 4l4.5 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "atividade") {
    return (
      <svg {...common}>
        <path d="M3 12h4l2.5-6 4 13 2.5-7h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "calendario") {
    return (
      <svg {...common}>
        <rect height="16" rx="2.5" stroke="currentColor" strokeWidth="2" width="18" x="3" y="5" />
        <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "relogio") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7.5V12l3 1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "caixa") {
    return (
      <svg {...common}>
        <path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M3 8.5 12 13l9-4.5M12 13v7" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
        <path d="M8.5 12.2l2.4 2.4 4.6-4.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="4" y="4" />
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="13" y="4" />
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="4" y="13" />
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="13" y="13" />
    </svg>
  );
}
