import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  relativeTime,
} from "@/lib/notifications";

export function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const uid = user?.id;

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", uid],
    queryFn: () => listNotifications(uid as string),
    enabled: Boolean(uid),
    refetchInterval: 60_000,
  });

  // Live push: new rows land in the panel without a refresh.
  useEffect(() => {
    if (!uid) return;
    const channel = supabase
      .channel(`notifications-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        () => {
          void qc.invalidateQueries({ queryKey: ["notifications", uid] });
          void qc.invalidateQueries({ queryKey: ["unread-messages", uid] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [uid, qc]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(uid as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", uid] }),
  });

  if (!uid) return null;

  const unread = items.filter((n) => !n.read_at).length;

  const openItem = async (id: string, link: string | null, isRead: boolean) => {
    setOpen(false);
    if (!isRead) {
      await markNotificationRead(id).catch(() => undefined);
      void qc.invalidateQueries({ queryKey: ["notifications", uid] });
    }
    if (link) void router.navigate({ href: link } as never);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications (${unread} non lues)` : "Notifications"}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:border-primary/40"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-extrabold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 mt-2 max-h-[70vh] w-[20rem] overflow-y-auto rounded-2xl border border-border bg-background p-1.5 shadow-xl sm:w-[22rem]"
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Notifications
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-soft"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Aucune notification pour le moment.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => void openItem(n.id, n.link, Boolean(n.read_at))}
                className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-start hover:bg-muted ${
                  n.read_at ? "" : "bg-primary-soft/50"
                }`}
              >
                <span className="flex w-full items-center gap-2">
                  {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  <span className="truncate text-sm font-bold">{n.title}</span>
                </span>
                {n.body && (
                  <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {relativeTime(n.created_at)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
