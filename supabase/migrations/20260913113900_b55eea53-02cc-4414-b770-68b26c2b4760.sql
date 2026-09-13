CREATE OR REPLACE FUNCTION public.is_published_avatar(_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _name ~ '^[0-9a-fA-F-]{36}/avatar-[0-9]+\.(jpg|jpeg|png|webp|gif|avif)$'
     AND EXISTS (
       SELECT 1 FROM public.profiles p
       WHERE p.avatar_url = _name
         AND p.id = split_part(_name, '/', 1)::uuid
         AND p.deleted_at IS NULL
     );
$$;

REVOKE ALL ON FUNCTION public.is_published_avatar(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_published_avatar(text) TO authenticated, service_role;

DROP POLICY IF EXISTS avatars_read ON storage.objects;
CREATE POLICY avatars_read ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'support')
    OR public.is_published_avatar(name)
  )
);
