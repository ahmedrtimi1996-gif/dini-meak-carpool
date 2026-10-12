ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS arrive_date date;

UPDATE public.trips SET arrive_date = CASE WHEN arrive_time < depart_time THEN depart_date + 1 ELSE depart_date END
WHERE arrive_time IS NOT NULL AND arrive_date IS NULL;

CREATE OR REPLACE FUNCTION public.validate_trip_schedule()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.depart_date, NEW.depart_time, NEW.arrive_date, NEW.arrive_time)
     IS NOT DISTINCT FROM (OLD.depart_date, OLD.depart_time, OLD.arrive_date, OLD.arrive_time) THEN
    RETURN NEW;
  END IF;
  IF NEW.arrive_time IS NOT NULL AND NEW.arrive_date IS NULL THEN
    NEW.arrive_date := CASE WHEN NEW.arrive_time < NEW.depart_time THEN NEW.depart_date + 1 ELSE NEW.depart_date END;
  END IF;
  IF NEW.arrive_date IS NOT NULL AND NEW.arrive_time IS NULL THEN
    RAISE EXCEPTION 'ARRIVAL_TIME_REQUIRED';
  END IF;
  IF NEW.arrive_date IS NOT NULL THEN
    IF (NEW.arrive_date + NEW.arrive_time) <= (NEW.depart_date + NEW.depart_time) THEN
      RAISE EXCEPTION 'ARRIVAL_BEFORE_DEPARTURE';
    END IF;
    IF (NEW.arrive_date + NEW.arrive_time) > (NEW.depart_date + NEW.depart_time) + interval '48 hours' THEN
      RAISE EXCEPTION 'ARRIVAL_TOO_LATE';
    END IF;
    NEW.duration_minutes := (EXTRACT(EPOCH FROM ((NEW.arrive_date + NEW.arrive_time) - (NEW.depart_date + NEW.depart_time))) / 60)::int;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.validate_trip_schedule() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trips_validate_schedule ON public.trips;
CREATE TRIGGER trips_validate_schedule BEFORE INSERT OR UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.validate_trip_schedule();