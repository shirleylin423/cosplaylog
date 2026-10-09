import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import ThemeBackground from "@/components/theme-background";
import ThemePicker from "@/components/theme-picker";
import CornerFlourish from "@/components/corner-flourish";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { authErrorKey } from "@/lib/auth-errors";

type Mode = "login" | "register";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { t } = useTranslation();
  const { session, signIn, signUp } = useAuth();
  const { themeKey, setThemeKey } = useTheme();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  // 已經登入的人不需要再看登入頁
  if (session) {
    return <Navigate to="/" replace />;
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast.error(t("auth.error.emailRequired"));
      return;
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      toast.error(t("auth.error.emailInvalid"));
      return;
    }
    if (!password) {
      toast.error(t("auth.error.passwordRequired"));
      return;
    }
    if (mode === "register") {
      if (password.length < 8) {
        toast.error(t("auth.error.passwordTooShort"));
        return;
      }
      if (password !== confirmPassword) {
        toast.error(t("auth.error.passwordMismatch"));
        return;
      }
    }

    try {
      setLoading(true);

      if (mode === "login") {
        await signIn(cleanEmail, password);
        toast.success(t("auth.toast.loginSuccess"));
      } else {
        await signUp(cleanEmail, password, displayName.trim());
        // 註冊後直接登入，不必再打一次密碼
        await signIn(cleanEmail, password);
        toast.success(t("auth.toast.registerSuccess"));
      }

      // 登入完成 → 前往「我的紀錄」
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(t(authErrorKey(error instanceof Error ? error.message : undefined)));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-surface-border bg-surface px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent disabled:opacity-60";

  return (
    <div className="relative min-h-screen">
      <ThemeBackground themeKey={themeKey} />

      <div className="pt-safe flex justify-end px-4 pt-4 sm:px-6">
        <ThemePicker themeKey={themeKey} onChange={setThemeKey} />
      </div>

      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-5 pb-16">
        <div className="surface anim-fade-up relative w-full max-w-[420px] overflow-hidden rounded-3xl p-7 sm:p-9">
          <CornerFlourish position="tl" size={54} />
          <CornerFlourish position="br" size={54} />

          <div className="mb-7 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }}
            >
              <Sparkles size={26} style={{ color: "var(--accent)" }} />
            </div>

            <h1 className="font-serif-tc text-2xl font-black tracking-wide">
              <span style={{ color: "var(--text)" }}>{t("common.appName").slice(0, 2)}</span>
              <span className="glow-accent" style={{ color: "var(--accent)" }}>
                {t("common.appName").slice(2)}
              </span>
            </h1>

            <p className="font-deco mt-1.5 text-[10px] tracking-[0.3em] text-muted-foreground">
              {t("common.appNameLatin")}
            </p>

            <p className="mt-3 text-sm text-muted-foreground">{t("auth.subtitle")}</p>
          </div>

          {/* 登入／註冊切換 */}
          <div className="mb-5 flex rounded-full p-0.5" style={{ background: "var(--accent-soft)" }}>
            {(["login", "register"] as Mode[]).map((key) => {
              const active = mode === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={loading}
                  onClick={() => (active ? undefined : switchMode())}
                  className="font-serif-tc flex-1 rounded-full py-2 text-sm font-medium transition-colors disabled:opacity-60"
                  style={active ? { background: "var(--accent)", color: "var(--on-accent)" } : { color: "var(--text)" }}
                >
                  {t(key === "login" ? "auth.tab.login" : "auth.tab.register")}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {mode === "register" && (
              <>
                <label className="font-serif-tc mt-1 text-sm font-semibold">{t("auth.displayName")}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t("auth.displayNamePlaceholder")}
                  autoComplete="nickname"
                  disabled={loading}
                  className={inputClass}
                />
              </>
            )}

            <label className="font-serif-tc mt-1 text-sm font-semibold">{t("auth.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              autoComplete="email"
              disabled={loading}
              className={inputClass}
            />

            <label className="font-serif-tc mt-1 text-sm font-semibold">{t("auth.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              disabled={loading}
              className={inputClass}
            />

            {mode === "register" && (
              <>
                <label className="font-serif-tc mt-1 text-sm font-semibold">{t("auth.confirmPassword")}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                  disabled={loading}
                  className={inputClass}
                />
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary font-serif-tc mt-5 w-full rounded-full py-3.5 text-base font-bold disabled:opacity-60"
            >
              {loading
                ? t("auth.submit.processing")
                : t(mode === "login" ? "auth.submit.login" : "auth.submit.register")}
            </button>
          </form>

          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">{t("auth.note")}</p>
        </div>
      </div>
    </div>
  );
}
