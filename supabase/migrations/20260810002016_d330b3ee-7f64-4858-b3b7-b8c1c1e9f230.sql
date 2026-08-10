-- 1. Profile verification flags
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vehicle_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_verified boolean NOT NULL DEFAULT false;

-- 2. Extend existing driver_documents (reuse, no duplicate table)
ALTER TABLE public.driver_documents
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expiry_notified_at timestamptz;

CREATE INDEX IF NOT EXISTS driver_documents_user_idx ON public.driver_documents(user_id);
CREATE INDEX IF NOT EXISTS driver_documents_status_idx ON public.driver_documents(status);
CREATE INDEX IF NOT EXISTS driver_documents_type_idx ON public.driver_documents(doc_type);
CREATE UNIQUE INDEX IF NOT EXISTS driver_documents_latest_idx
  ON public.driver_documents(user_id, doc_type, created_at);

-- 3. Staff read access for verification/support roles (admin already covered)
DROP POLICY IF EXISTS driver_docs_staff_read ON public.driver_documents;
CREATE POLICY driver_docs_staff_read ON public.driver_documents
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'support')
  );

-- 4. Badge sync + audit trail + notification on document review
CREATE OR REPLACE FUNCTION public.sync_verification_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approved boolean := NEW.status = 'approved';
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.doc_type IN ('national_id', 'cin', 'passport', 'selfie') THEN
    UPDATE public.profiles SET identity_verified = approved WHERE id = NEW.user_id;
  ELSIF NEW.doc_type = 'driving_license' THEN
    UPDATE public.profiles SET license_verified = approved WHERE id = NEW.user_id;
  ELSIF NEW.doc_type = 'vehicle_registration' THEN
    UPDATE public.profiles SET vehicle_verified = approved WHERE id = NEW.user_id;
  ELSIF NEW.doc_type = 'insurance' THEN
    UPDATE public.profiles SET insurance_verified = approved WHERE id = NEW.user_id;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (
    COALESCE(NEW.reviewed_by, NEW.user_id),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'DOCUMENT_SUBMITTED'
      WHEN NEW.status = 'approved' THEN 'DOCUMENT_APPROVED'
      WHEN NEW.status = 'rejected' THEN 'DOCUMENT_REJECTED'
      WHEN NEW.status = 'expired' THEN 'DOCUMENT_EXPIRED'
      WHEN NEW.status = 'under_review' THEN 'DOCUMENT_UNDER_REVIEW'
      ELSE 'DOCUMENT_UPDATED'
    END,
    'driver_document',
    NEW.id::text,
    CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('status', OLD.status) ELSE NULL END,
    jsonb_build_object('status', NEW.status, 'doc_type', NEW.doc_type, 'reason', NEW.review_note, 'user_id', NEW.user_id)
  );

  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (
      NEW.user_id,
      'verification',
      CASE NEW.status
        WHEN 'approved' THEN 'Document approuvé'
        WHEN 'rejected' THEN 'Document refusé'
        WHEN 'expired' THEN 'Document expiré'
        ELSE 'Document en cours d''examen'
      END,
      NEW.doc_type || COALESCE(' — ' || NEW.review_note, ''),
      '/verification'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS driver_documents_badge_sync ON public.driver_documents;
CREATE TRIGGER driver_documents_badge_sync
  AFTER INSERT OR UPDATE ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION public.sync_verification_badges();

-- 5. Publish eligibility helper (server-side source of truth)
CREATE OR REPLACE FUNCTION public.driver_publish_requirements(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
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
    'account_active', COALESCE(p.account_status, 'active') = 'active',
    'expired_documents', COALESCE((
      SELECT jsonb_agg(DISTINCT d.doc_type)
      FROM public.driver_documents d
      WHERE d.user_id = _user_id
        AND (d.status = 'expired' OR (d.expires_on IS NOT NULL AND d.expires_on < current_date))
    ), '[]'::jsonb)
  )
  FROM public.profiles p WHERE p.id = _user_id;
$$;

REVOKE ALL ON FUNCTION public.sync_verification_badges() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.driver_publish_requirements(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.driver_publish_requirements(uuid) TO authenticated;