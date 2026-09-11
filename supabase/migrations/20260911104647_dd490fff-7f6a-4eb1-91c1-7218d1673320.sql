-- Runs as the caller: a driver can always read their own profile row
-- (profiles_select_own), so no elevated privileges are needed here.
CREATE OR REPLACE FUNCTION public.driver_can_publish(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
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