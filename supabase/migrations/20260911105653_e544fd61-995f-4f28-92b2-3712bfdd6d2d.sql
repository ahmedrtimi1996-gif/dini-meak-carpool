CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.safe_public_profiles()
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

CREATE OR REPLACE FUNCTION private.safe_public_vehicles()
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

GRANT EXECUTE ON FUNCTION private.safe_public_profiles() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.safe_public_vehicles() TO anon, authenticated, service_role;

DROP VIEW IF EXISTS public.profiles_public;
DROP VIEW IF EXISTS public.vehicles_public;

CREATE VIEW public.profiles_public WITH (security_invoker = true) AS
  SELECT * FROM private.safe_public_profiles();

CREATE VIEW public.vehicles_public WITH (security_invoker = true) AS
  SELECT * FROM private.safe_public_vehicles();

GRANT SELECT ON public.profiles_public TO anon, authenticated, service_role;
GRANT SELECT ON public.vehicles_public TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.safe_public_profiles();
DROP FUNCTION IF EXISTS public.safe_public_vehicles();