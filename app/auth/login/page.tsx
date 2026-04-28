"use client";

import { useState } from "react";

function BankIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 10h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M6 10v7M10 10v7M14 10v7M18 10v7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M3 19h18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M12 4 4.5 8h15L12 4Z" fill="currentColor" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <rect height="11" rx="2" stroke="currentColor" strokeWidth="2" width="14" x="5" y="10" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      {hidden ? <path d="M4 4l16 16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /> : null}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" />
    </svg>
  );
}

const features = [
  "7 niveis hierarquicos com permissoes individuais",
  "7 departamentos com planilhas independentes",
  "Dashboard com cotacoes e noticias em tempo real",
  "Dados salvos com seguranca no Google Sheets",
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, username }),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "Nao foi possivel entrar.");
        return;
      }

      if (remember) {
        window.localStorage.setItem("fattura:lastUser", username);
      }

      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="brand-panel">
        <div className="brand-content">
          <div className="brand-lockup">
            <div className="brand-mark">
              <BankIcon />
            </div>
            <div>
              <strong>
                Fattura <span>Contabilidade</span>
              </strong>
              <small>Sistema de gestao</small>
            </div>
          </div>

          <div className="hero-copy">
            <h1>
              Gestao contabil com <span>precisao</span> e elegancia
            </h1>
            <p>
              Controle total dos seus departamentos, usuarios com acesso por cargo e dados sempre
              seguros.
            </p>
          </div>

          <div className="feature-list">
            {features.map((feature, index) => (
              <div className="feature-item" key={feature}>
                <span className="feature-icon">{index + 1}</span>
                <p>{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="form-panel">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="form-heading">
            <span>Acesso seguro</span>
            <h2>Bem-vindo</h2>
            <p>Entre com suas credenciais para acessar</p>
          </div>

          <label className="field">
            <span>Usuario</span>
            <div className="input-wrap">
              <UserIcon />
              <input
                autoComplete="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Seu usuario"
                required
                value={username}
              />
            </div>
          </label>

          <label className="field">
            <span>Senha</span>
            <div className="input-wrap">
              <LockIcon />
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="icon-button"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                <EyeIcon hidden={!showPassword} />
              </button>
            </div>
          </label>

          <div className="form-options">
            <label>
              <input
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                type="checkbox"
              />
              Lembrar meu usuario
            </label>
            <button type="button">Esqueci a senha</button>
          </div>

          {error ? <p className="error-message">{error}</p> : null}

          <button className="submit-button" disabled={loading} type="submit">
            {loading ? "Entrando..." : "Entrar no Sistema"}
            <ArrowIcon />
          </button>

          <p className="copyright">Fattura Contabilidade © 2026 · Todos os direitos reservados</p>
        </form>
      </section>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 470px;
          background: #06170d;
          color: #f8fafc;
        }

        .brand-panel {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 60px;
          background:
            linear-gradient(90deg, rgba(6, 23, 13, 0.98), rgba(7, 45, 27, 0.92)),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 64px),
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.025) 0 1px, transparent 1px 64px);
        }

        .brand-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 55% 50%, rgba(19, 185, 129, 0.16), transparent 38%);
          pointer-events: none;
        }

        .brand-content {
          position: relative;
          display: grid;
          gap: 58px;
          max-width: 580px;
        }

        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .brand-mark {
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          border-radius: 14px;
          color: #ffffff;
          background: linear-gradient(135deg, #12c991, #d8ad42);
          box-shadow: 0 18px 36px rgba(18, 201, 145, 0.25);
        }

        .brand-lockup strong {
          display: block;
          font-size: 23px;
          line-height: 1;
          letter-spacing: 0;
        }

        .brand-lockup span,
        .hero-copy span {
          color: #ffc94f;
        }

        .brand-lockup small {
          display: block;
          margin-top: 8px;
          color: #65b997;
          font-size: 11px;
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        .hero-copy h1 {
          max-width: 520px;
          margin: 0;
          color: #ffffff;
          font-size: 38px;
          line-height: 1.14;
          letter-spacing: 0;
        }

        .hero-copy p {
          max-width: 430px;
          margin: 18px 0 0;
          color: #a7bdb0;
          font-size: 16px;
          line-height: 1.55;
        }

        .feature-list {
          display: grid;
          gap: 14px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #b8cabf;
        }

        .feature-icon {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border: 1px solid rgba(19, 185, 129, 0.35);
          border-radius: 8px;
          color: #10d899;
          background: rgba(10, 111, 74, 0.45);
          font-size: 13px;
          font-weight: 800;
        }

        .feature-item p {
          margin: 0;
          font-size: 14px;
        }

        .form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          border-top: 2px solid #0bae75;
          color: #06170d;
          padding: 40px 48px;
        }

        .login-card {
          width: 100%;
          display: grid;
          gap: 18px;
        }

        .form-heading {
          margin-bottom: 14px;
        }

        .form-heading span {
          color: #009e69;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        .form-heading h2 {
          margin: 12px 0 4px;
          color: #07170d;
          font-size: 28px;
          line-height: 1.1;
          letter-spacing: 0;
        }

        .form-heading p {
          margin: 0;
          color: #6c8a78;
          font-size: 14px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field > span {
          color: #092015;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .input-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 48px;
          border: 1px solid #cadbd1;
          border-radius: 12px;
          background: #f7fbf8;
          color: #789385;
          padding: 0 14px;
        }

        .input-wrap:focus-within {
          border-color: #0bae75;
          box-shadow: 0 0 0 3px rgba(11, 174, 117, 0.14);
        }

        .input-wrap input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0b1f14;
          font-size: 15px;
        }

        .input-wrap input::placeholder {
          color: #7c9186;
        }

        .icon-button {
          display: grid;
          place-items: center;
          border: 0;
          background: transparent;
          color: #779888;
          cursor: pointer;
          padding: 0;
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #355042;
          font-size: 13px;
        }

        .form-options label {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-options button {
          border: 0;
          background: transparent;
          color: #009e69;
          cursor: pointer;
          font-weight: 800;
        }

        .error-message {
          margin: 0;
          color: #b91c1c;
          font-size: 14px;
        }

        .submit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 52px;
          border: 0;
          border-radius: 12px;
          color: #ffffff;
          background: linear-gradient(100deg, #12aa75, #d4ae4a);
          box-shadow: 0 16px 28px rgba(11, 174, 117, 0.28);
          cursor: pointer;
          font-size: 15px;
          font-weight: 800;
        }

        .submit-button:disabled {
          cursor: not-allowed;
          opacity: 0.72;
        }

        .copyright {
          margin: 12px 0 0;
          color: #7a9688;
          font-size: 12px;
          text-align: center;
        }

        @media (max-width: 900px) {
          .login-page {
            grid-template-columns: 1fr;
          }

          .brand-panel {
            min-height: 42vh;
            padding: 38px 24px;
          }

          .brand-content {
            gap: 28px;
          }

          .hero-copy h1 {
            font-size: 32px;
          }

          .form-panel {
            padding: 34px 24px;
          }
        }

        @media (max-width: 560px) {
          .brand-panel {
            min-height: auto;
          }

          .hero-copy h1 {
            font-size: 28px;
          }

          .feature-list {
            display: none;
          }

          .form-options {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
