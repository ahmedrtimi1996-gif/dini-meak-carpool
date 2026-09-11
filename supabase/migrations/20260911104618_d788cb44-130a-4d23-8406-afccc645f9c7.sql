-- 1. PROFILES: stop anonymous full-row PII reads -----------------------------
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_staff"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'support')
  );

-- Safe public directory: no phone, address, birthday, gender, emergency
-- contact, locale, moderation reasons, presence or soft-delete timestamps.
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false) AS
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.cover_url,
    p.city,
    p.bio,
    p.languages,
    p.driving_experience_years,
    p.rating,
    p.reviews_count,
    p.completed_trips,
    p.cancelled_trips,
    p.email_verified,
    p.phone_verified,
    p.identity_verified,
    p.license_verified,
    p.vehicle_verified,
    p.insurance_verified,
    p.is_featured,
    p.account_status,
    p.created_at
  FROM public.profiles p
  WHERE p.deleted_at IS NULL;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 2. VEHICLES: keep plates and insurance dates private -----------------------
DROP POLICY IF EXISTS "vehicles_public_read" ON public.vehicles;

CREATE POLICY "vehicles_select_staff"
  ON public.vehicles FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'support')
  );

CREATE OR REPLACE VIEW public.vehicles_public
WITH (security_invoker = false) AS
  SELECT
    v.id,
    v.owner_id,
    v.brand,
    v.model,
    v.version,
    v.year,
    v.color,
    v.seats,
    v.fuel,
    v.transmission,
    v.luggage,
    v.air_conditioning,
    v.usb_charger,
    v.wifi,
    v.music,
    v.smoking_allowed,
    v.pets_allowed,
    v.photos,
    v.is_default,
    v.created_at
  FROM public.vehicles v;

GRANT SELECT ON public.vehicles_public TO anon, authenticated;

-- 3. TRIPS: only fully verified, active drivers may publish ------------------
CREATE OR REPLACE FUNCTION public.driver_can_publish(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _uid
      AND p.identity_verified
      AND p.license_verified
      AND p.vehicle_verified
      AND p.insurance_verified
      AND p.account_status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.driver_can_publish(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.driver_can_publish(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "trips_driver_write" ON public.trips;

CREATE POLICY "trips_driver_insert"
  ON public.trips FOR INSERT TO authenticated
  WITH CHECK (
    driver_id = auth.uid()
    AND (status <> 'published' OR public.driver_can_publish(auth.uid()))
  );

CREATE POLICY "trips_driver_update"
  ON public.trips FOR UPDATE TO authenticated
  USING (driver_id = auth.uid())
  WITH CHECK (
    driver_id = auth.uid()
    AND (status <> 'published' OR public.driver_can_publish(auth.uid()))
  );

CREATE POLICY "trips_driver_delete"
  ON public.trips FOR DELETE TO authenticated
  USING (driver_id = auth.uid());