import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import "./login.css";
import { useContestAssets } from "features/contest-brand";
import { login as loginRequest } from "shared/api/authApi";
import { APP_NAME, APP_SHORT_NAME } from "shared/config/brand";
import { consumePendingAuthError } from "shared/auth/pendingAuthError";
import {
  formatRateLimitRemaining,
  getRateLimitBlock,
  remainingRateLimitMs,
  setRateLimitBlock,
} from "shared/auth/rateLimitBlock";
import { validateTeamUsername } from "shared/lib/teamUsername";
import { authErrorCopy } from "./authErrorCopy";

const CONTACT_EMAIL = "compiler@aast.edu";

export default function Login() {
  const navigate = useNavigate();
  // Login surface is always dark-branded.
  const { logoSrc, contestTitle } = useContestAssets("dark");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("Login failed");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [blockRemainingMs, setBlockRemainingMs] = useState(0);

  const showAuthError = (codeOrMessage: string) => {
    if (codeOrMessage === "AUTH_RATE_LIMIT") {
      setRateLimitBlock("login");
    } else if (codeOrMessage === "AUTH_WS_RATE_LIMIT") {
      setRateLimitBlock("ws");
    }
    const copy = authErrorCopy(codeOrMessage);
    setErrorTitle(copy.title);
    setErrorMessage(copy.detail);
    setShowErrorModal(true);
    setBlockRemainingMs(remainingRateLimitMs());
  };

  useEffect(() => {
    const pending = consumePendingAuthError();
    if (pending) {
      showAuthError(pending);
      return;
    }
    const existing = getRateLimitBlock();
    if (existing) {
      showAuthError(
        existing.kind === "login" ? "AUTH_RATE_LIMIT" : "AUTH_WS_RATE_LIMIT"
      );
    }
  }, []);

  const isBlocked = blockRemainingMs > 0;

  useEffect(() => {
    if (!isBlocked) return;

    const tick = () => {
      setBlockRemainingMs(remainingRateLimitMs());
    };

    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [isBlocked]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setUsernameError("");
    setPasswordError("");

    let hasError = false;

    const usernameValidation = validateTeamUsername(username);
    if (usernameValidation) {
      setUsernameError(usernameValidation);
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) return;

    const blocked = remainingRateLimitMs();
    if (blocked > 0) {
      const kind = getRateLimitBlock()?.kind === "login"
        ? "AUTH_RATE_LIMIT"
        : "AUTH_WS_RATE_LIMIT";
      showAuthError(kind);
      return;
    }

    setLoading(true);

    try {
      const result = await loginRequest(username.trim(), password.trim());

      if (!result.ok) {
        showAuthError(result.error || "AUTH_LOGIN_FAILED");
        return;
      }

      if (import.meta.env.DEV) {
        console.log("Logged in as:", result.data.displayName);
      }
      navigate("/home");
    } catch (err) {
      console.error("Login failed:", err);
      showAuthError(
        err instanceof Error && err.message ? err.message : "AUTH_UNREACHABLE"
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `login-field w-full rounded-xl border bg-white/[0.04] py-3.5 pl-11 pr-3.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:bg-white/[0.06] ${
      hasError
        ? "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgb(248_113_113/0.2)]"
        : "border-white/10 focus:border-brand focus:shadow-[0_0_0_3px_rgb(59_130_246/0.2)]"
    }`;

  return (
    <div className="login-shell dark">
      {showErrorModal && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 border-0 bg-black/60"
            aria-label="Dismiss error"
            onClick={() => setShowErrorModal(false)}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-error-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-danger/40 bg-surface-raised p-6 text-center shadow-xl">
              <div className="text-4xl text-danger">✖</div>
              <h4
                id="login-error-title"
                className="mt-2 text-lg font-bold text-danger"
              >
                {errorTitle}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {errorMessage}
              </p>
              {blockRemainingMs > 0 ? (
                <p className="mt-3 text-sm font-semibold text-danger">
                  Try again in {formatRateLimitRemaining(blockRemainingMs)}.
                  Then open a new window and log in.
                </p>
              ) : null}
              <button
                type="button"
                className="mt-4 rounded-full bg-danger px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                onClick={() => setShowErrorModal(false)}
              >
                Ok
              </button>
            </div>
          </div>
        </>
      )}

      <section className="login-hero" aria-label={APP_NAME}>
        <div className="login-hero-veil" />
        <div className="login-hero-brand">
          <p className="login-hero-mark">{APP_SHORT_NAME}</p>
          <h2 className="login-hero-title">{APP_NAME}</h2>
          <span className="login-hero-rule" aria-hidden />
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex items-center justify-center">
              <img
                src={logoSrc}
                alt={contestTitle || ""}
                className="h-24 w-auto max-w-[14rem] object-contain sm:h-28 sm:max-w-[16rem]"
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-brand sm:text-[2rem]">
              Login
            </h1>
            <p className="mt-2 text-[13px] text-foreground-muted">
              using your username and password
            </p>
            {blockRemainingMs > 0 ? (
              <p
                className="mt-3 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
                role="status"
              >
                Blocked for {formatRateLimitRemaining(blockRemainingMs)}. Wait,
                then open a new window and log in again.
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-username"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-muted"
              >
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle">
                  <FaUser size={14} aria-hidden />
                </span>
                <input
                  id="login-username"
                  type="text"
                  className={fieldClass(Boolean(usernameError))}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUsernameError("");
                  }}
                  placeholder="Enter username"
                  autoFocus
                  autoComplete="username"
                  aria-invalid={Boolean(usernameError)}
                  aria-describedby={
                    usernameError ? "login-username-error" : undefined
                  }
                />
              </div>
              {usernameError && (
                <p
                  id="login-username-error"
                  className="mt-1.5 text-sm text-danger"
                >
                  {usernameError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-muted"
              >
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle">
                  <FaLock size={14} aria-hidden />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className={`${fieldClass(Boolean(passwordError))} pr-11`}
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);
                    setPasswordError("");
                    if (!value) setShowPassword(false);
                  }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={
                    passwordError ? "login-password-error" : undefined
                  }
                />
                {password ? (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border-0 bg-transparent p-1.5 text-foreground-subtle transition hover:bg-white/5 hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                ) : null}
              </div>
              {passwordError && (
                <p
                  id="login-password-error"
                  className="mt-1.5 text-sm text-danger"
                >
                  {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="login-submit group mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-extrabold tracking-wide text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || blockRemainingMs > 0}
            >
              {loading ? (
                <>
                  <span className="login-spinner" aria-hidden />
                  Logging in…
                </>
              ) : (
                <>
                  Login
                  <span
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  >
                    →
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      <footer className="login-footer">
        <div className="login-footer-inner">
          <div className="login-footer-meta">
            <p className="text-[11px] text-foreground-muted">
              © 2026 · Powered by{" "}
              <span className="font-semibold text-foreground/85">ACPC</span>
            </p>
            <span className="login-footer-dot" aria-hidden />
            <p className="text-[11px] text-foreground-muted">
              {APP_SHORT_NAME} · {APP_NAME}
            </p>
          </div>

          <div className="login-footer-contact">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
              Contact us
            </span>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-sm font-medium text-foreground transition hover:text-brand"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
