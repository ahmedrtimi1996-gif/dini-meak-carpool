-- Verification documents: private, path = <user_id>/<doc_type>/<file>
DROP POLICY IF EXISTS "verification_docs_own_read" ON storage.objects;
CREATE POLICY "verification_docs_own_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'moderator')
      OR public.has_role(auth.uid(), 'support')
    )
  );

DROP POLICY IF EXISTS "verification_docs_own_insert" ON storage.objects;
CREATE POLICY "verification_docs_own_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "verification_docs_own_update" ON storage.objects;
CREATE POLICY "verification_docs_own_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "verification_docs_own_delete" ON storage.objects;
CREATE POLICY "verification_docs_own_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Avatars: private bucket, signed URLs; owner writes, signed-in members read
DROP POLICY IF EXISTS "avatars_read" ON storage.objects;
CREATE POLICY "avatars_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_own_write" ON storage.objects;
CREATE POLICY "avatars_own_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_own_update" ON storage.objects;
CREATE POLICY "avatars_own_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_own_delete" ON storage.objects;
CREATE POLICY "avatars_own_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Reduce privilege: requirements helper does not need to bypass RLS
CREATE OR REPLACE FUNCTION public.driver_publish_requirements(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
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