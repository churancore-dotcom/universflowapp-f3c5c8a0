
-- 1) stream_songs: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view stream songs" ON public.stream_songs;
CREATE POLICY "Authenticated users can view stream songs"
  ON public.stream_songs
  FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.stream_songs FROM anon;

-- 2) viral_picks: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view active viral picks" ON public.viral_picks;
CREATE POLICY "Authenticated users can view active viral picks"
  ON public.viral_picks
  FOR SELECT
  TO authenticated
  USING (is_active = true);
REVOKE SELECT ON public.viral_picks FROM anon;

-- 3) Remove listening_sessions from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.listening_sessions;

-- 4) Lock down internal SECURITY DEFINER functions (triggers + backend-only helpers)
REVOKE EXECUTE ON FUNCTION public.notify_system_push(uuid[], text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_premium_expiry_notifications() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_old_subscriptions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_premium_activated() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_admin_field_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_status_field_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.support_message_after_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_viral_chart_refreshes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_premium_on_approval() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Also revoke from anon (but keep authenticated) on user-facing RPCs that should never be callable without auth
REVOKE EXECUTE ON FUNCTION public.consume_free_skip() FROM anon;
REVOKE EXECUTE ON FUNCTION public.join_listening_session(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.join_jam_room(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_friend_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_device_token(text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_review_payment_request(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_log_event(text, text, jsonb) FROM anon;
