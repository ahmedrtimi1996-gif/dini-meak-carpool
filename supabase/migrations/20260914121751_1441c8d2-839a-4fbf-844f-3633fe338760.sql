-- 1. Booking write authorization at database level
CREATE OR REPLACE FUNCTION public.protect_booking_transitions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  staff boolean;
BEGIN
  -- Trusted server-side paths (triggers, service role) have no JWT user.
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;

  staff := public.has_role(uid,'admin') OR public.has_role(uid,'moderator') OR public.has_role(uid,'support');
  IF staff THEN
    RETURN NEW;
  END IF;

  IF uid <> OLD.passenger_id AND uid <> OLD.driver_id THEN
    RAISE EXCEPTION 'BOOKING_FORBIDDEN';
  END IF;

  -- Identity and money columns are immutable for participants.
  NEW.id := OLD.id;
  NEW.trip_id := OLD.trip_id;
  NEW.passenger_id := OLD.passenger_id;
  NEW.driver_id := OLD.driver_id;
  NEW.seats := OLD.seats;
  NEW.unit_price := OLD.unit_price;
  NEW.total_price := OLD.total_price;
  NEW.commission := OLD.commission;
  NEW.currency := OLD.currency;
  NEW.payment_status := OLD.payment_status;
  NEW.payment_method := OLD.payment_method;
  NEW.is_waitlist := OLD.is_waitlist;
  NEW.created_at := OLD.created_at;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF uid = OLD.passenger_id THEN
      IF NOT (OLD.status IN ('pending','accepted') AND NEW.status = 'cancelled_by_passenger') THEN
        RAISE EXCEPTION 'BOOKING_TRANSITION_FORBIDDEN';
      END IF;
    ELSE
      IF NOT (
           (OLD.status = 'pending'  AND NEW.status IN ('accepted','rejected'))
        OR (OLD.status = 'accepted' AND NEW.status IN ('cancelled_by_driver','completed'))
      ) THEN
        RAISE EXCEPTION 'BOOKING_TRANSITION_FORBIDDEN';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_booking_transitions() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_booking_transitions() FROM anon;
REVOKE ALL ON FUNCTION public.protect_booking_transitions() FROM authenticated;

DROP TRIGGER IF EXISTS bookings_protect_transitions ON public.bookings;
CREATE TRIGGER bookings_protect_transitions
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.protect_booking_transitions();

-- Defense in depth: one active booking per passenger per trip.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_one_active_per_passenger_idx
  ON public.bookings (trip_id, passenger_id)
  WHERE status IN ('pending','accepted','completed');

-- 2. Messages are append-only; only the recipient can mark read
CREATE OR REPLACE FUNCTION public.protect_message_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.conversation_id := OLD.conversation_id;
  NEW.sender_id := OLD.sender_id;
  NEW.body := OLD.body;
  NEW.attachment_url := OLD.attachment_url;
  NEW.created_at := OLD.created_at;

  IF NEW.read_at IS DISTINCT FROM OLD.read_at AND uid = OLD.sender_id THEN
    NEW.read_at := OLD.read_at;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_message_columns() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_message_columns() FROM anon;
REVOKE ALL ON FUNCTION public.protect_message_columns() FROM authenticated;

DROP TRIGGER IF EXISTS messages_protect_columns ON public.messages;
CREATE TRIGGER messages_protect_columns
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.protect_message_columns();

-- 3. Public trip browsing must not leak hidden/soft-deleted rides
DROP POLICY IF EXISTS trips_public_read ON public.trips;
CREATE POLICY trips_public_read ON public.trips
  FOR SELECT
  USING (status = 'published' AND is_hidden = false AND deleted_at IS NULL);

-- Booking parties keep read access to their ride even once hidden/cancelled.
DROP POLICY IF EXISTS trips_booking_party_read ON public.trips;
CREATE POLICY trips_booking_party_read ON public.trips
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.trip_id = trips.id
      AND (b.passenger_id = auth.uid() OR b.driver_id = auth.uid())
  ));

-- 4. Index hygiene
DROP INDEX IF EXISTS public.bookings_trip_idx;
DROP INDEX IF EXISTS public.bookings_driver_idx;
DROP INDEX IF EXISTS public.bookings_passenger_idx;
DROP INDEX IF EXISTS public.trips_driver_idx;
DROP INDEX IF EXISTS public.vehicles_owner_idx;
DROP INDEX IF EXISTS public.notifications_user_idx;

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trips_search_idx
  ON public.trips (status, depart_date, from_city, to_city);
