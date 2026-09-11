ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_by uuid,
  ADD COLUMN IF NOT EXISTS hidden_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS reviews_unique_author_booking_target
  ON public.reviews (booking_id, author_id, target_id);
CREATE INDEX IF NOT EXISTS reviews_target_visible_idx ON public.reviews (target_id, is_hidden, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_author_idx ON public.reviews (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reviews_trip_idx ON public.reviews (trip_id);

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_overall_range;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_overall_range CHECK (overall >= 1 AND overall <= 5);
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_no_self;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_no_self CHECK (author_id <> target_id);

-- Server-side validation: only completed bookings, only participants, fill trip_id
CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE b public.bookings;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = NEW.booking_id;
  IF b.id IS NULL THEN RAISE EXCEPTION 'BOOKING_NOT_FOUND'; END IF;
  IF b.status <> 'completed' THEN RAISE EXCEPTION 'RIDE_NOT_COMPLETED'; END IF;
  IF NEW.author_id NOT IN (b.passenger_id, b.driver_id) THEN RAISE EXCEPTION 'NOT_A_PARTICIPANT'; END IF;
  IF NEW.target_id NOT IN (b.passenger_id, b.driver_id) THEN RAISE EXCEPTION 'TARGET_NOT_A_PARTICIPANT'; END IF;
  IF NEW.target_id = NEW.author_id THEN RAISE EXCEPTION 'SELF_REVIEW'; END IF;
  NEW.trip_id := b.trip_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS validate_review_before_insert ON public.reviews;
CREATE TRIGGER validate_review_before_insert
BEFORE INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review();

-- Moderation-only updates: staff may toggle visibility, nothing else
CREATE OR REPLACE FUNCTION public.protect_review_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    RAISE EXCEPTION 'REVIEW_IMMUTABLE';
  END IF;
  NEW.id := OLD.id;
  NEW.booking_id := OLD.booking_id;
  NEW.trip_id := OLD.trip_id;
  NEW.author_id := OLD.author_id;
  NEW.target_id := OLD.target_id;
  NEW.overall := OLD.overall;
  NEW.comment := OLD.comment;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := now();
  IF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden THEN
    NEW.hidden_by := CASE WHEN NEW.is_hidden THEN auth.uid() ELSE NULL END;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protect_review_columns_before_update ON public.reviews;
CREATE TRIGGER protect_review_columns_before_update
BEFORE UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.protect_review_columns();

-- Ratings ignore hidden reviews and react to moderation
CREATE OR REPLACE FUNCTION public.refresh_profile_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE tgt uuid := COALESCE(NEW.target_id, OLD.target_id);
BEGIN
  UPDATE public.profiles p SET
    rating = COALESCE((SELECT ROUND(AVG(overall),2) FROM public.reviews WHERE target_id = tgt AND is_hidden = false),0),
    reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE target_id = tgt AND is_hidden = false)
  WHERE p.id = tgt;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS refresh_profile_rating_after_change ON public.reviews;
CREATE TRIGGER refresh_profile_rating_after_change
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_profile_rating();

-- Access rules
DROP POLICY IF EXISTS reviews_public_read ON public.reviews;
DROP POLICY IF EXISTS reviews_read_visible ON public.reviews;
CREATE POLICY reviews_read_visible ON public.reviews
FOR SELECT TO anon, authenticated
USING (
  is_hidden = false
  OR author_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

DROP POLICY IF EXISTS reviews_staff_moderate ON public.reviews;
CREATE POLICY reviews_staff_moderate ON public.reviews
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;