import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — DiniM3ak" },
      {
        name: "description",
        content:
          "Connectez-vous à DiniM3ak pour réserver un covoiturage au Maroc ou publier vos trajets.",
      },
      { property: "og:title", content: "Connexion — DiniM3ak" },
      { property: "og:description", content: "Rejoignez la communauté DiniM3ak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { first_name: firstName, last_name: lastName },
          },
        });
        if (err) throw err;
        if (!data.session) setNotice(t("auth.checkEmail"));
        else navigate({ to: "/" });
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate({ to: "/" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(t("common.error"));
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  async function reset() {
    if (!email) {
      setError(t("auth.email"));
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (err) setError(err.message);
    else setNotice(t("auth.resetSent"));
  }

  const input =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-primary";

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-primary-soft/40 via-background to-accent-soft/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="surface-panel rounded-3xl p-7 shadow-lift">
          <h1 className="text-2xl font-extrabold">{t("auth.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>

          <button
            type="button"
            onClick={google}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold transition-colors hover:bg-muted"
          >
            <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.3 17.6 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.1 24.6c0-1.6-.1-2.8-.4-4.1H24v8.1h12.5c-.3 2.1-1.6 5.2-4.7 7.3l7.6 5.9c4.5-4.2 6.7-10.3 6.7-17.2z"
              />
              <path
                fill="#FBBC05"
                d="M10.4 28.7A14.5 14.5 0 0 1 9.6 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.9-2.1 15.4-5.8l-7.6-5.9c-2 1.4-4.7 2.4-7.8 2.4-6.4 0-11.7-3.8-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            {t("auth.google")}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("auth.or")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={input}
                  placeholder={t("auth.firstName")}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={60}
                />
                <input
                  className={input}
                  placeholder={t("auth.lastName")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength={60}
                />
              </div>
            )}
            <input
              className={input}
              type="email"
              autoComplete="email"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
            />
            <input
              className={input}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={t("auth.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={72}
            />

            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
            {notice && <p className="text-sm font-semibold text-primary">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? t("auth.signin") : t("auth.signup")}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signin" ? t("auth.needAccount") : t("auth.haveAccount")}
            </button>
            {mode === "signin" && (
              <button
                type="button"
                onClick={reset}
                className="text-muted-foreground hover:underline"
              >
                {t("auth.forgot")}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="font-semibold text-muted-foreground hover:text-primary">
            ← {t("common.back")}
          </Link>
        </p>
      </div>
    </div>
  );
}
