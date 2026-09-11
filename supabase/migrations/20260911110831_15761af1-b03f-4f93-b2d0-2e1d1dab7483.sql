REVOKE ALL ON FUNCTION public.validate_review() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.protect_review_columns() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.refresh_profile_rating() FROM anon, authenticated, public;