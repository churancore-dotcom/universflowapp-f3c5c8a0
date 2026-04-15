
-- Fix donations policies: scope to authenticated only
DROP POLICY IF EXISTS "Users can view their own donations" ON public.donations;
CREATE POLICY "Users can view their own donations"
ON public.donations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert donations" ON public.donations;
CREATE POLICY "Authenticated users can insert donations"
ON public.donations FOR INSERT TO authenticated
WITH CHECK ((user_id IS NULL) OR (user_id = auth.uid()));

-- Fix profiles policies: scope INSERT and UPDATE to authenticated
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND is_admin = false);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND NOT (is_admin IS DISTINCT FROM (SELECT p.is_admin FROM profiles p WHERE p.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view friend profiles" ON public.profiles;
CREATE POLICY "Users can view friend profiles"
ON public.profiles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM friends
  WHERE friends.status = 'accepted'
  AND ((friends.user_id = auth.uid() AND friends.friend_id = profiles.user_id)
    OR (friends.friend_id = auth.uid() AND friends.user_id = profiles.user_id))
));
