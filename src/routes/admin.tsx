import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldOff } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration — DiniM3ak" },
      {
        name: "description",
        content:
          "Console d'administration DiniM3ak : pilotage des utilisateurs, trajets, paiements, modération et support.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Administration — DiniM3ak" },
      { property: "og:description", content: "Console interne de gestion de la plateforme DiniM3ak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const { loading, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Chargement de la console</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldOff className="h-10 w-10 text-destructive" aria-hidden="true" />
        <h1 className="text-2xl font-extrabold">Accès réservé</h1>
        <p className="text-sm text-muted-foreground">
          Cette console est réservée aux administrateurs DiniM3ak. Si vous pensez qu'il s'agit d'une
          erreur, contactez l'équipe plateforme.
        </p>
        <Button onClick={() => void navigate({ to: "/" })}>Retour à l'accueil</Button>
      </div>
    );
  }

  return <Outlet />;
}
