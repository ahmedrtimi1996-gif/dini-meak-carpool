import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  bio: string | null;
  birthday: string | null;
  gender: string | null;
  emergency_contact: string | null;
  languages: string[];
  rating: number;
  reviews_count: number;
  completed_trips: number;
  cancelled_trips: number;
  identity_verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  license_verified: boolean;
  created_at: string;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  isDriver: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (uid: string | undefined, confirmedAt?: string | null) => {
    if (!uid) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    let prof = (p as Profile) ?? null;
    // Supabase Auth confirms the email; mirror that onto the profile badge.
    if (prof && confirmedAt && !prof.email_verified) {
      const { error } = await supabase
        .from("profiles")
        .update({ email_verified: true })
        .eq("id", uid);
      if (!error) prof = { ...prof, email_verified: true };
    }
    setProfile(prof);
    setRoles((r ?? []).map((row) => row.role as string));
  }, []);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      void load(next?.user?.id, next?.user?.email_confirmed_at ?? null);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await load(data.session?.user?.id, data.session?.user?.email_confirmed_at ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    await load(data.session?.user?.id, data.session?.user?.email_confirmed_at ?? null);
  }, [load]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
    setSession(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      roles,
      loading,
      isDriver: roles.includes("driver"),
      isAdmin: roles.includes("admin"),
      refresh,
      signOut,
    }),
    [session, profile, roles, loading, refresh, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
