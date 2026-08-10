/*
# Storage policies for verification-docs bucket

1. Security
- Private bucket (public=false) for driver verification documents (CIN, license, insurance).
- Users can upload, read, and delete files under their own folder path `user_id/...`.
- Admins and moderators can read all files for review purposes.
*/

-- Ensure bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Users can upload to their own folder
DROP POLICY IF EXISTS "verification_docs_upload_own" ON storage.objects;
CREATE POLICY "verification_docs_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own files
DROP POLICY IF EXISTS "verification_docs_read_own" ON storage.objects;
CREATE POLICY "verification_docs_read_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
DROP POLICY IF EXISTS "verification_docs_delete_own" ON storage.objects;
CREATE POLICY "verification_docs_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins and moderators can read all verification documents
DROP POLICY IF EXISTS "verification_docs_staff_read" ON storage.objects;
CREATE POLICY "verification_docs_staff_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
);