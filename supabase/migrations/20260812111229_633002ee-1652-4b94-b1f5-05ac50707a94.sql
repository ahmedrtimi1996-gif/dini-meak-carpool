CREATE POLICY "roles_self_enroll" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND role IN ('passenger'::app_role, 'driver'::app_role));

GRANT INSERT ON public.user_roles TO authenticated;