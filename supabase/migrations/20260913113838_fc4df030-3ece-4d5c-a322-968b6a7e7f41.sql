-- 1. Avatar bucket: no blanket read of every object
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
    OR (
      array_length(storage.foldername(name), 1) = 1
      AND name ~ '^[0-9a-fA-F-]{36}/avatar-[0-9]+\.(jpg|jpeg|png|webp|gif|avif)$'
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = ((storage.foldername(name))[1])::uuid
          AND p.avatar_url = storage.objects.name
      )
    )
  )
);

-- 2. Ride publishing: the selected vehicle must be an approved vehicle owned by the driver
CREATE OR REPLACE FUNCTION public.trip_vehicle_is_verified(_driver_id uuid, _vehicle_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT _vehicle_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = _vehicle_id AND v.owner_id = _driver_id)
     AND EXISTS (
       SELECT 1 FROM public.driver_documents d
       WHERE d.user_id = _driver_id
         AND d.doc_type = 'vehicle_registration'
         AND d.status = 'approved'
         AND (d.expires_on IS NULL OR d.expires_on >= current_date)
         AND (d.vehicle_id = _vehicle_id OR d.vehicle_id IS NULL)
     );
$$;

REVOKE ALL ON FUNCTION public.trip_vehicle_is_verified(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.trip_vehicle_is_verified(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS trips_driver_insert ON public.trips;
CREATE POLICY trips_driver_insert ON public.trips
FOR INSERT TO authenticated
WITH CHECK (
  driver_id = auth.uid()
  AND (
    status <> 'published'
    OR (
      public.driver_can_publish(auth.uid())
      AND public.trip_vehicle_is_verified(auth.uid(), vehicle_id)
    )
  )
);

DROP POLICY IF EXISTS trips_driver_update ON public.trips;
CREATE POLICY trips_driver_update ON public.trips
FOR UPDATE TO authenticated
USING (driver_id = auth.uid())
WITH CHECK (
  driver_id = auth.uid()
  AND (
    status <> 'published'
    OR (
      public.driver_can_publish(auth.uid())
      AND public.trip_vehicle_is_verified(auth.uid(), vehicle_id)
    )
  )
);
