-- 1) Selfies never expire
UPDATE public.driver_documents SET expires_on = NULL WHERE doc_type = 'selfie' AND expires_on IS NOT NULL;
UPDATE public.driver_documents SET status = 'pending' WHERE doc_type = 'selfie' AND status = 'expired';

CREATE OR REPLACE FUNCTION public.enforce_selfie_no_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.doc_type = 'selfie' THEN
    NEW.expires_on := NULL;
    IF NEW.status = 'expired' THEN NEW.status := 'pending'; END IF;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.enforce_selfie_no_expiry() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS driver_documents_selfie_no_expiry ON public.driver_documents;
CREATE TRIGGER driver_documents_selfie_no_expiry
BEFORE INSERT OR UPDATE ON public.driver_documents
FOR EACH ROW EXECUTE FUNCTION public.enforce_selfie_no_expiry();

-- 2) Publish requirements: ignore selfie expiry, add verified-vehicle requirement
CREATE OR REPLACE FUNCTION public.driver_publish_requirements(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'email_verified', COALESCE(p.email_verified, false),
    'phone_verified', COALESCE(p.phone_verified, false),
    'identity_verified', COALESCE(p.identity_verified, false),
    'license_verified', COALESCE(p.license_verified, false),
    'vehicle_verified', COALESCE(p.vehicle_verified, false),
    'insurance_verified', COALESCE(p.insurance_verified, false),
    'has_vehicle', EXISTS (SELECT 1 FROM public.vehicles v WHERE v.owner_id = _user_id),
    'has_verified_vehicle', (
      EXISTS (SELECT 1 FROM public.vehicles v WHERE v.owner_id = _user_id)
      AND EXISTS (
        SELECT 1 FROM public.driver_documents d
        WHERE d.user_id = _user_id
          AND d.doc_type = 'vehicle_registration'
          AND d.status = 'approved'
          AND (d.expires_on IS NULL OR d.expires_on >= current_date)
      )
    ),
    'account_active', COALESCE(p.account_status, 'active') = 'active',
    'expired_documents', COALESCE((
      SELECT jsonb_agg(DISTINCT d.doc_type)
      FROM public.driver_documents d
      WHERE d.user_id = _user_id
        AND d.doc_type <> 'selfie'
        AND (d.status = 'expired' OR (d.expires_on IS NOT NULL AND d.expires_on < current_date))
    ), '[]'::jsonb)
  )
  FROM public.profiles p WHERE p.id = _user_id;
$$;

-- 3) Per-vehicle verification status (own vehicles, or staff)
CREATE OR REPLACE FUNCTION public.vehicle_verification_statuses(_owner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL OR (
      auth.uid() <> _owner_id
      AND NOT public.has_role(auth.uid(), 'admin')
      AND NOT public.has_role(auth.uid(), 'moderator')
      AND NOT public.has_role(auth.uid(), 'support')
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT COALESCE(jsonb_object_agg(v.id::text, COALESCE(s.status, legacy.status, 'not_submitted')), '{}'::jsonb)
  INTO result
  FROM public.vehicles v
  LEFT JOIN LATERAL (
    SELECT d.status FROM public.driver_documents d
    WHERE d.vehicle_id = v.id AND d.doc_type = 'vehicle_registration'
    ORDER BY d.created_at DESC LIMIT 1
  ) s ON true
  LEFT JOIN LATERAL (
    SELECT d.status FROM public.driver_documents d
    WHERE d.user_id = _owner_id AND d.vehicle_id IS NULL AND d.doc_type = 'vehicle_registration'
    ORDER BY d.created_at DESC LIMIT 1
  ) legacy ON true
  WHERE v.owner_id = _owner_id;

  RETURN COALESCE(result, '{}'::jsonb);
END; $$;

REVOKE EXECUTE ON FUNCTION public.vehicle_verification_statuses(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vehicle_verification_statuses(uuid) TO authenticated;