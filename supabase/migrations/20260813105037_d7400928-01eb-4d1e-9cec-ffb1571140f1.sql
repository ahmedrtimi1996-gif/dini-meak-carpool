CREATE OR REPLACE FUNCTION public.sync_trip_seats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Seats are reserved when the booking is created (see public.create_booking),
  -- so acceptance must NOT subtract them a second time. Only restore on release.
  IF OLD.status IN ('pending','accepted')
     AND NEW.status IN ('cancelled_by_passenger','cancelled_by_driver','rejected','expired') THEN
    UPDATE public.trips
      SET seats_available = LEAST(seats_available + NEW.seats, seats_total)
      WHERE id = NEW.trip_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.create_booking(
  _trip_id uuid,
  _seats integer,
  _message text DEFAULT NULL,
  _pickup_note text DEFAULT NULL,
  _dropoff_note text DEFAULT NULL
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _trip public.trips;
  _booking public.bookings;
  _unit numeric;
  _total numeric;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;
  IF _seats IS NULL OR _seats < 1 OR _seats > 8 THEN
    RAISE EXCEPTION 'INVALID_SEATS';
  END IF;

  SELECT * INTO _trip FROM public.trips WHERE id = _trip_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRIP_NOT_FOUND';
  END IF;
  IF _trip.status <> 'published' OR _trip.is_hidden OR _trip.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'TRIP_NOT_BOOKABLE';
  END IF;
  IF (_trip.depart_date + _trip.depart_time) < (now() - interval '1 hour') THEN
    RAISE EXCEPTION 'TRIP_DEPARTED';
  END IF;
  IF _trip.driver_id = _uid THEN
    RAISE EXCEPTION 'OWN_TRIP';
  END IF;
  IF COALESCE((SELECT account_status FROM public.profiles WHERE id = _uid), 'active') <> 'active' THEN
    RAISE EXCEPTION 'ACCOUNT_NOT_ACTIVE';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.trip_id = _trip_id AND b.passenger_id = _uid
      AND b.status IN ('pending','accepted','completed')
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_BOOKING';
  END IF;
  IF _trip.seats_available < _seats THEN
    RAISE EXCEPTION 'NOT_ENOUGH_SEATS';
  END IF;

  _unit := _trip.price;
  _total := _unit * _seats;

  INSERT INTO public.bookings (
    trip_id, passenger_id, driver_id, seats, pickup_note, dropoff_note,
    unit_price, total_price, commission, currency, status, payment_status, message
  ) VALUES (
    _trip_id, _uid, _trip.driver_id, _seats, NULLIF(btrim(_pickup_note),''), NULLIF(btrim(_dropoff_note),''),
    _unit, _total, ROUND(_total * 0.08, 2), _trip.currency,
    CASE WHEN _trip.instant_booking THEN 'accepted'::booking_status ELSE 'pending'::booking_status END,
    'unpaid'::payment_status, NULLIF(btrim(_message),'')
  ) RETURNING * INTO _booking;

  UPDATE public.trips
    SET seats_available = GREATEST(seats_available - _seats, 0)
    WHERE id = _trip_id;

  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    _trip.driver_id, 'booking',
    CASE WHEN _trip.instant_booking THEN 'Nouvelle réservation confirmée' ELSE 'Nouvelle demande de réservation' END,
    _trip.from_city || ' → ' || _trip.to_city || ' · ' || _seats || ' place(s)',
    '/dashboard'
  );

  RETURN _booking;
END; $$;

REVOKE ALL ON FUNCTION public.create_booking(uuid, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, integer, text, text, text) TO authenticated;