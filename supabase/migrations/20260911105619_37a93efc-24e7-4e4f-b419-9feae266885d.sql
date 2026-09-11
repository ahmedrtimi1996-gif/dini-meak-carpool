-- 1. Safe public data through security-definer FUNCTIONS, views become SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.safe_public_profiles()
RETURNS TABLE (
  id uuid, first_name text, last_name text, avatar_url text, cover_url text,
  city text, bio text, languages text[], driving_experience_years integer,
  rating numeric, reviews_count integer, completed_trips integer, cancelled_trips integer,
  email_verified boolean, phone_verified boolean, identity_verified boolean,
  license_verified boolean, vehicle_verified boolean, insurance_verified boolean,
  is_featured boolean, account_status public.account_status, created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.first_name, p.last_name, p.avatar_url, p.cover_url,
         p.city, p.bio, p.languages, p.driving_experience_years,
         p.rating, p.reviews_count, p.completed_trips, p.cancelled_trips,
         p.email_verified, p.phone_verified, p.identity_verified,
         p.license_verified, p.vehicle_verified, p.insurance_verified,
         p.is_featured, p.account_status, p.created_at
  FROM public.profiles p
  WHERE p.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.safe_public_vehicles()
RETURNS TABLE (
  id uuid, owner_id uuid, brand text, model text, version text, year integer,
  color text, seats integer, fuel text, transmission text, luggage text,
  air_conditioning boolean, usb_charger boolean, wifi boolean, music boolean,
  smoking_allowed boolean, pets_allowed boolean, photos text[], is_default boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.id, v.owner_id, v.brand, v.model, v.version, v.year,
         v.color, v.seats, v.fuel, v.transmission, v.luggage,
         v.air_conditioning, v.usb_charger, v.wifi, v.music,
         v.smoking_allowed, v.pets_allowed, v.photos, v.is_default, v.created_at
  FROM public.vehicles v;
$$;

REVOKE ALL ON FUNCTION public.safe_public_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.safe_public_vehicles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_public_profiles() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.safe_public_vehicles() TO anon, authenticated, service_role;

DROP VIEW IF EXISTS public.profiles_public;
DROP VIEW IF EXISTS public.vehicles_public;

CREATE VIEW public.profiles_public WITH (security_invoker = true) AS
  SELECT * FROM public.safe_public_profiles();

CREATE VIEW public.vehicles_public WITH (security_invoker = true) AS
  SELECT * FROM public.safe_public_vehicles();

GRANT SELECT ON public.profiles_public TO anon, authenticated, service_role;
GRANT SELECT ON public.vehicles_public TO anon, authenticated, service_role;

-- 2. Verification flags & account status may only change through staff-reviewed paths
CREATE OR REPLACE FUNCTION public.protect_profile_trust_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_staff boolean := false;
BEGIN
  -- Trusted server-side paths (triggers, service role, admin tooling) have no JWT user.
  IF _uid IS NULL THEN
    RETURN NEW;
  END IF;

  _is_staff := public.has_role(_uid, 'admin')
            OR public.has_role(_uid, 'moderator')
            OR public.has_role(_uid, 'support');

  IF _is_staff THEN
    RETURN NEW;
  END IF;

  NEW.identity_verified  := OLD.identity_verified;
  NEW.license_verified   := OLD.license_verified;
  NEW.vehicle_verified   := OLD.vehicle_verified;
  NEW.insurance_verified := OLD.insurance_verified;
  NEW.email_verified     := OLD.email_verified;
  NEW.phone_verified     := OLD.phone_verified;
  NEW.account_status     := OLD.account_status;
  NEW.suspension_reason  := OLD.suspension_reason;
  NEW.suspended_until    := OLD.suspended_until;
  NEW.ban_reason         := OLD.ban_reason;
  NEW.is_featured        := OLD.is_featured;
  NEW.rating             := OLD.rating;
  NEW.reviews_count      := OLD.reviews_count;
  NEW.completed_trips    := OLD.completed_trips;
  NEW.cancelled_trips    := OLD.cancelled_trips;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_trust_columns ON public.profiles;
CREATE TRIGGER profiles_protect_trust_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_trust_columns();