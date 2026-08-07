import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id="dm-pin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary-dark)" />
        </linearGradient>
      </defs>
      <path
        d="M24 3c8.6 0 15.5 6.9 15.5 15.4 0 10.8-12.2 22.9-14.2 24.8a1.9 1.9 0 0 1-2.6 0C20.7 41.3 8.5 29.2 8.5 18.4 8.5 9.9 15.4 3 24 3Z"
        fill="url(#dm-pin)"
      />
      <path
        d="M15 30.5c3.4-2.3 9-2.3 12.4-4.6 3-2 2.4-4.6-1-5.4"
        stroke="var(--amber)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M14.5 20.6l1.7-4.1a2.6 2.6 0 0 1 2.4-1.6h10.8a2.6 2.6 0 0 1 2.4 1.6l1.7 4.1v4.2a1.3 1.3 0 0 1-1.3 1.3h-1.5a1.3 1.3 0 0 1-1.3-1.3v-.6H18.6v.6a1.3 1.3 0 0 1-1.3 1.3h-1.5a1.3 1.3 0 0 1-1.3-1.3v-4.2Z"
        fill="white"
      />
      <path d="M17.2 20.3l1.2-2.9h11.2l1.2 2.9H17.2Z" fill="var(--accent)" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="DiniM3ak">
      <LogoMark className={compact ? "h-8 w-8" : "h-9 w-9"} />
      <span className="text-lg font-extrabold tracking-tight">
        Dini<span className="text-primary">M3ak</span>
      </span>
    </Link>
  );
}
