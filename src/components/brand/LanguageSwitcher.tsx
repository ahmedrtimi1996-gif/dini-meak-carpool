import { Globe, Check } from "lucide-react";
import { useState } from "react";
import { LANGS, useI18n } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang)!;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
        aria-label={t("common.language")}
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        {current.short}
      </button>
      {open && (
        <div className="absolute end-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lift">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onMouseDown={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-primary-soft hover:text-primary-dark"
            >
              {l.label}
              {l.code === lang && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
