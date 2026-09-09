ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_thread
  ON public.conversations (trip_id, driver_id, passenger_id);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON public.messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

-- Start or reuse the thread between the caller and the other party for a ride.
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_trip_id uuid, _passenger_id uuid DEFAULT NULL)
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _trip public.trips;
  _passenger uuid;
  _conv public.conversations;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;

  SELECT * INTO _trip FROM public.trips WHERE id = _trip_id;
  IF NOT FOUND OR _trip.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'TRIP_NOT_FOUND'; END IF;

  IF _uid = _trip.driver_id THEN
    _passenger := _passenger_id;
    IF _passenger IS NULL THEN RAISE EXCEPTION 'PASSENGER_REQUIRED'; END IF;
  ELSE
    _passenger := _uid;
  END IF;

  SELECT * INTO _conv FROM public.conversations
   WHERE trip_id = _trip_id AND driver_id = _trip.driver_id AND passenger_id = _passenger;

  IF NOT FOUND THEN
    INSERT INTO public.conversations (trip_id, driver_id, passenger_id)
    VALUES (_trip_id, _trip.driver_id, _passenger)
    RETURNING * INTO _conv;
  END IF;

  RETURN _conv;
END; $$;

REVOKE ALL ON FUNCTION public.get_or_create_conversation(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid, uuid) TO authenticated;

-- Send a message and notify the recipient.
CREATE OR REPLACE FUNCTION public.send_message(_conversation_id uuid, _body text)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _conv public.conversations;
  _msg public.messages;
  _recipient uuid;
  _sender_name text;
  _trip public.trips;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  IF _body IS NULL OR btrim(_body) = '' THEN RAISE EXCEPTION 'EMPTY_MESSAGE'; END IF;

  SELECT * INTO _conv FROM public.conversations WHERE id = _conversation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'CONVERSATION_NOT_FOUND'; END IF;
  IF _uid <> _conv.passenger_id AND _uid <> _conv.driver_id THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  INSERT INTO public.messages (conversation_id, sender_id, body)
  VALUES (_conversation_id, _uid, btrim(_body))
  RETURNING * INTO _msg;

  UPDATE public.conversations SET last_message_at = now() WHERE id = _conversation_id;

  _recipient := CASE WHEN _uid = _conv.passenger_id THEN _conv.driver_id ELSE _conv.passenger_id END;
  SELECT COALESCE(NULLIF(btrim(COALESCE(first_name,'') || ' ' || COALESCE(left(last_name,1) || '.','')), ''), 'Un membre')
    INTO _sender_name FROM public.profiles WHERE id = _uid;
  SELECT * INTO _trip FROM public.trips WHERE id = _conv.trip_id;

  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    _recipient, 'message',
    'Nouveau message de ' || COALESCE(_sender_name, 'un membre'),
    COALESCE(_trip.from_city || ' → ' || _trip.to_city || ' · ', '') || left(btrim(_body), 120),
    '/messages?c=' || _conversation_id::text
  );

  RETURN _msg;
END; $$;

REVOKE ALL ON FUNCTION public.send_message(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_message(uuid, text) TO authenticated;

-- Notify the passenger when a booking decision is made.
CREATE OR REPLACE FUNCTION public.notify_booking_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _trip public.trips;
  _title text;
  _target uuid;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  SELECT * INTO _trip FROM public.trips WHERE id = NEW.trip_id;

  _target := NEW.passenger_id;
  _title := CASE NEW.status
    WHEN 'accepted' THEN 'Réservation confirmée'
    WHEN 'rejected' THEN 'Réservation refusée'
    WHEN 'cancelled_by_driver' THEN 'Réservation annulée par le conducteur'
    WHEN 'completed' THEN 'Trajet terminé'
    ELSE NULL
  END;

  IF NEW.status = 'cancelled_by_passenger' THEN
    _target := NEW.driver_id;
    _title := 'Réservation annulée par le passager';
  END IF;

  IF _title IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    _target, 'booking', _title,
    COALESCE(_trip.from_city || ' → ' || _trip.to_city, '') || ' · ' || NEW.seats || ' place(s)',
    CASE WHEN _target = NEW.passenger_id THEN '/bookings' ELSE '/dashboard' END
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS bookings_notify_status ON public.bookings;
CREATE TRIGGER bookings_notify_status AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_booking_status();

-- Notify passengers when a ride is cancelled or rescheduled.
CREATE OR REPLACE FUNCTION public.notify_trip_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kind text;
  _title text;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    _title := 'Trajet annulé';
  ELSIF (NEW.depart_date, NEW.depart_time, NEW.price) IS DISTINCT FROM (OLD.depart_date, OLD.depart_time, OLD.price) THEN
    _title := 'Trajet modifié';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, kind, title, body, link)
  SELECT DISTINCT b.passenger_id, 'trip', _title,
         NEW.from_city || ' → ' || NEW.to_city || ' · ' || NEW.depart_date || ' ' || to_char(NEW.depart_time, 'HH24:MI'),
         '/bookings'
  FROM public.bookings b
  WHERE b.trip_id = NEW.id AND b.status IN ('pending','accepted');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trips_notify_change ON public.trips;
CREATE TRIGGER trips_notify_change AFTER UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.notify_trip_change();

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
