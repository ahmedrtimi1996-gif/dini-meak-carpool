-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('passenger','driver','admin','moderator','support');
CREATE TYPE public.trip_status AS ENUM ('published','paused','cancelled','completed','archived');
CREATE TYPE public.booking_status AS ENUM ('pending','accepted','rejected','cancelled_by_passenger','cancelled_by_driver','completed','expired');
CREATE TYPE public.payment_status AS ENUM ('unpaid','authorized','captured','refunded','partially_refunded','failed');

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  birthday DATE,
  gender TEXT,
  phone TEXT,
  city TEXT,
  address TEXT,
  bio TEXT,
  languages TEXT[] NOT NULL DEFAULT '{}',
  emergency_contact TEXT,
  preferred_locale TEXT NOT NULL DEFAULT 'fr',
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  identity_verified BOOLEAN NOT NULL DEFAULT false,
  license_verified BOOLEAN NOT NULL DEFAULT false,
  driving_experience_years INT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  completed_trips INT NOT NULL DEFAULT 0,
  cancelled_trips INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "roles_read_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- auto profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name',''),' ',1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULLIF(split_part(COALESCE(NEW.raw_user_meta_data->>'full_name',''),' ',2),'')),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email_confirmed_at IS NOT NULL
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'passenger') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ VEHICLES ============
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT,
  year INT,
  color TEXT,
  plate TEXT,
  seats INT NOT NULL DEFAULT 4,
  fuel TEXT,
  transmission TEXT,
  luggage TEXT NOT NULL DEFAULT 'medium',
  air_conditioning BOOLEAN NOT NULL DEFAULT true,
  usb_charger BOOLEAN NOT NULL DEFAULT false,
  wifi BOOLEAN NOT NULL DEFAULT false,
  music BOOLEAN NOT NULL DEFAULT true,
  smoking_allowed BOOLEAN NOT NULL DEFAULT false,
  pets_allowed BOOLEAN NOT NULL DEFAULT false,
  photos TEXT[] NOT NULL DEFAULT '{}',
  insurance_valid_until DATE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX vehicles_owner_idx ON public.vehicles(owner_id);
GRANT SELECT ON public.vehicles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_public_read" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "vehicles_owner_write" ON public.vehicles FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ============ TRIPS ============
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  stops TEXT[] NOT NULL DEFAULT '{}',
  meeting_point TEXT,
  arrival_point TEXT,
  depart_date DATE NOT NULL,
  depart_time TIME NOT NULL,
  arrive_time TIME,
  duration_minutes INT,
  distance_km INT,
  seats_total INT NOT NULL CHECK (seats_total > 0),
  seats_available INT NOT NULL CHECK (seats_available >= 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'MAD',
  luggage TEXT NOT NULL DEFAULT 'medium',
  smoking_allowed BOOLEAN NOT NULL DEFAULT false,
  pets_allowed BOOLEAN NOT NULL DEFAULT false,
  women_only BOOLEAN NOT NULL DEFAULT false,
  instant_booking BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  status public.trip_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trips_search_idx ON public.trips(depart_date, from_city, to_city);
CREATE INDEX trips_driver_idx ON public.trips(driver_id);
GRANT SELECT ON public.trips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips_public_read" ON public.trips FOR SELECT USING (status = 'published');
CREATE POLICY "trips_driver_read" ON public.trips FOR SELECT TO authenticated USING (driver_id = auth.uid());
CREATE POLICY "trips_admin_read" ON public.trips FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "trips_driver_write" ON public.trips FOR ALL TO authenticated
  USING (driver_id = auth.uid()) WITH CHECK (driver_id = auth.uid());
CREATE TRIGGER trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ BOOKINGS ============
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  seats INT NOT NULL DEFAULT 1 CHECK (seats > 0),
  pickup_note TEXT,
  dropoff_note TEXT,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MAD',
  status public.booking_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  payment_method TEXT,
  is_waitlist BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bookings_trip_idx ON public.bookings(trip_id);
CREATE INDEX bookings_passenger_idx ON public.bookings(passenger_id);
CREATE INDEX bookings_driver_idx ON public.bookings(driver_id);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_read_party" ON public.bookings FOR SELECT TO authenticated
  USING (passenger_id = auth.uid() OR driver_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bookings_insert_own" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (passenger_id = auth.uid() AND driver_id <> auth.uid());
CREATE POLICY "bookings_update_party" ON public.bookings FOR UPDATE TO authenticated
  USING (passenger_id = auth.uid() OR driver_id = auth.uid())
  WITH CHECK (passenger_id = auth.uid() OR driver_id = auth.uid());
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seat accounting
CREATE OR REPLACE FUNCTION public.sync_trip_seats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    UPDATE public.trips SET seats_available = GREATEST(seats_available - NEW.seats, 0) WHERE id = NEW.trip_id;
  ELSIF OLD.status = 'accepted' AND NEW.status IN ('cancelled_by_passenger','cancelled_by_driver','rejected','expired') THEN
    UPDATE public.trips SET seats_available = LEAST(seats_available + NEW.seats, seats_total) WHERE id = NEW.trip_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER bookings_seat_sync AFTER UPDATE OF status ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.sync_trip_seats();

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  target_id UUID NOT NULL,
  driving INT CHECK (driving BETWEEN 1 AND 5),
  punctuality INT CHECK (punctuality BETWEEN 1 AND 5),
  communication INT CHECK (communication BETWEEN 1 AND 5),
  safety INT CHECK (safety BETWEEN 1 AND 5),
  cleanliness INT CHECK (cleanliness BETWEEN 1 AND 5),
  friendliness INT CHECK (friendliness BETWEEN 1 AND 5),
  overall NUMERIC(3,2) NOT NULL CHECK (overall BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, author_id)
);
CREATE INDEX reviews_target_idx ON public.reviews(target_id);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_participant" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND b.status = 'completed'
        AND (b.passenger_id = auth.uid() OR b.driver_id = auth.uid())
        AND target_id IN (b.passenger_id, b.driver_id) AND target_id <> auth.uid()
    )
  );

-- rating rollup
CREATE OR REPLACE FUNCTION public.refresh_profile_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles p SET
    rating = COALESCE((SELECT ROUND(AVG(overall),2) FROM public.reviews WHERE target_id = NEW.target_id),0),
    reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE target_id = NEW.target_id)
  WHERE p.id = NEW.target_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER reviews_rollup AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.refresh_profile_rating();

-- ============ CONVERSATIONS / MESSAGES ============
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, passenger_id, driver_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_party" ON public.conversations FOR ALL TO authenticated
  USING (passenger_id = auth.uid() OR driver_id = auth.uid())
  WITH CHECK (passenger_id = auth.uid() OR driver_id = auth.uid());

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT,
  attachment_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_idx ON public.messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_read_party" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (c.passenger_id = auth.uid() OR c.driver_id = auth.uid())));
CREATE POLICY "messages_send_party" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (c.passenger_id = auth.uid() OR c.driver_id = auth.uid())));
CREATE POLICY "messages_mark_read" ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (c.passenger_id = auth.uid() OR c.driver_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id
    AND (c.passenger_id = auth.uid() OR c.driver_id = auth.uid())));
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ FAVORITES ============
CREATE TABLE public.favorite_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, driver_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorite_drivers TO authenticated;
GRANT ALL ON public.favorite_drivers TO service_role;
ALTER TABLE public.favorite_drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorite_drivers_own" ON public.favorite_drivers FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.favorite_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, from_city, to_city)
);
GRANT SELECT, INSERT, DELETE ON public.favorite_routes TO authenticated;
GRANT ALL ON public.favorite_routes TO service_role;
ALTER TABLE public.favorite_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorite_routes_own" ON public.favorite_routes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());