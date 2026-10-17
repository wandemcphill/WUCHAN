-- 00006_rls_helper_privileges.sql
-- RLS helper functions are internal policy machinery. They should not be
-- executable by anonymous users or arbitrary PUBLIC callers.

REVOKE EXECUTE ON FUNCTION public.current_actor_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_actor_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
