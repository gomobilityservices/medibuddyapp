-- =========================================================
-- PROFILES (private, owner-only)
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer','provider')),
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'everyone',
  photo TEXT NOT NULL DEFAULT '',
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- =========================================================
-- PROVIDERS (public listing, no contact info)
-- =========================================================
CREATE TABLE public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL UNIQUE,
  photo TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'female',
  languages TEXT[] NOT NULL DEFAULT '{}',
  area TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  categories TEXT[] NOT NULL DEFAULT '{}',
  experience TEXT NOT NULL DEFAULT '',
  rating NUMERIC(3,2) NOT NULL DEFAULT 5,
  reviews INTEGER NOT NULL DEFAULT 0,
  rate_call NUMERIC(10,2) NOT NULL DEFAULT 1.5,
  rate_chat NUMERIC(10,2) NOT NULL DEFAULT 1.0,
  available BOOLEAN NOT NULL DEFAULT true,
  preferred_customer_gender TEXT NOT NULL DEFAULT 'everyone',
  sessions INTEGER NOT NULL DEFAULT 0,
  response_sec INTEGER NOT NULL DEFAULT 15,
  distance_km NUMERIC(5,1) NOT NULL DEFAULT 2.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can browse provider listings"
  ON public.providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Providers can create their own listing"
  ON public.providers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Providers can update their own listing"
  ON public.providers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================================
-- TRANSACTIONS
-- =========================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('debit','credit')),
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  sub TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX transactions_user_created_idx ON public.transactions(user_id, created_at DESC);

-- =========================================================
-- SESSIONS
-- =========================================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('chat','call')),
  rate NUMERIC(10,2) NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0,
  minutes INTEGER NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  provider_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

GRANT SELECT ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR provider_id IN (SELECT p.id FROM public.providers p WHERE p.user_id = auth.uid())
  );

CREATE INDEX sessions_customer_idx ON public.sessions(customer_id, started_at DESC);
CREATE INDEX sessions_provider_idx ON public.sessions(provider_id, started_at DESC);

-- =========================================================
-- REVIEWS
-- =========================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL DEFAULT 'Guest',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_id, customer_id)
);

GRANT SELECT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can read reviews"
  ON public.reviews FOR SELECT TO authenticated USING (true);

CREATE INDEX reviews_provider_idx ON public.reviews(provider_id, created_at DESC);

-- =========================================================
-- WITHDRAWALS
-- =========================================================
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own payout requests"
  ON public.withdrawals FOR SELECT TO authenticated USING (user_id = auth.uid());

-- =========================================================
-- SAVED PROVIDERS
-- =========================================================
CREATE TABLE public.saved_providers (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, provider_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_providers TO authenticated;
GRANT ALL ON public.saved_providers TO service_role;
ALTER TABLE public.saved_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own saved providers"
  ON public.saved_providers FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================================================
-- updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER providers_touch_updated_at BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- New user -> profile (+ provider listing)
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role TEXT := COALESCE(meta->>'role', 'customer');
  v_name TEXT := COALESCE(meta->>'name', 'Guest');
  v_username TEXT;
BEGIN
  IF v_role NOT IN ('customer','provider') THEN
    v_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, role, email, name, gender, photo)
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NEW.email, ''),
    v_name,
    COALESCE(meta->>'gender', 'everyone'),
    COALESCE(meta->>'photo', '')
  );

  IF v_role = 'provider' THEN
    v_username := COALESCE(NULLIF(meta->>'username',''), 'user_' || substr(NEW.id::text, 1, 8));
    IF EXISTS (SELECT 1 FROM public.providers p WHERE p.username = v_username) THEN
      v_username := v_username || '_' || substr(NEW.id::text, 1, 4);
    END IF;

    INSERT INTO public.providers (
      user_id, name, username, photo, gender, languages, area, description,
      categories, experience, rate_call, rate_chat, preferred_customer_gender,
      distance_km
    )
    VALUES (
      NEW.id,
      v_name,
      v_username,
      COALESCE(meta->>'photo', ''),
      COALESCE(meta->>'provider_gender', 'female'),
      COALESCE(
        (SELECT array_agg(value::text) FROM jsonb_array_elements_text(meta->'languages') AS value),
        ARRAY['English']
      ),
      COALESCE(meta->>'area', ''),
      COALESCE(meta->>'description', 'I am a listener here to talk with you.'),
      COALESCE(
        (SELECT array_agg(value::text) FROM jsonb_array_elements_text(meta->'categories') AS value),
        ARRAY['General Chat']
      ),
      COALESCE(meta->>'experience', ''),
      COALESCE((meta->>'rate_call')::numeric, 1.5),
      COALESCE((meta->>'rate_chat')::numeric, 1.0),
      COALESCE(meta->>'preferred_customer_gender', 'everyone'),
      round((1 + random() * 8)::numeric, 1)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- SECURE ACTIONS
-- =========================================================
CREATE OR REPLACE FUNCTION public.top_up_wallet(p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_balance NUMERIC;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    RAISE EXCEPTION 'Invalid top-up amount';
  END IF;

  UPDATE public.profiles SET balance = balance + p_amount
  WHERE id = v_user RETURNING balance INTO v_balance;

  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  INSERT INTO public.transactions (user_id, kind, type, label, sub, amount)
  VALUES (v_user, 'credit', 'topup', 'Wallet Top-up', 'Card ending 4242', p_amount);

  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_session(p_provider_id UUID, p_mode TEXT)
RETURNS public.sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_rate NUMERIC;
  v_balance NUMERIC;
  v_row public.sessions;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_mode NOT IN ('chat','call') THEN RAISE EXCEPTION 'Invalid mode'; END IF;

  SELECT CASE WHEN p_mode = 'call' THEN p.rate_call ELSE p.rate_chat END
    INTO v_rate FROM public.providers p WHERE p.id = p_provider_id;
  IF v_rate IS NULL THEN RAISE EXCEPTION 'Provider not found'; END IF;

  SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_balance < v_rate THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.providers SET available = false WHERE id = p_provider_id;

  INSERT INTO public.sessions (customer_id, provider_id, mode, rate)
  VALUES (v_user, p_provider_id, p_mode, v_rate)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.end_session(p_session_id UUID, p_seconds INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.sessions;
  v_minutes INTEGER;
  v_amount NUMERIC;
  v_balance NUMERIC;
  v_earnings NUMERIC;
  v_provider_name TEXT;
  v_provider_user UUID;
  v_seconds INTEGER := GREATEST(0, COALESCE(p_seconds, 0));
BEGIN
  SELECT * INTO s FROM public.sessions
  WHERE id = p_session_id AND customer_id = auth.uid() AND status = 'active';
  IF s.id IS NULL THEN RAISE EXCEPTION 'Active session not found'; END IF;

  v_minutes := GREATEST(1, CEIL(v_seconds / 60.0))::int;

  SELECT balance INTO v_balance FROM public.profiles WHERE id = s.customer_id;
  v_amount := LEAST(v_minutes * s.rate, v_balance);
  v_earnings := round(v_amount * 0.9, 2);

  SELECT p.name, p.user_id INTO v_provider_name, v_provider_user
  FROM public.providers p WHERE p.id = s.provider_id;

  UPDATE public.profiles SET balance = balance - v_amount WHERE id = s.customer_id;

  INSERT INTO public.transactions (user_id, kind, type, label, sub, amount)
  VALUES (
    s.customer_id, 'debit',
    CASE WHEN s.mode = 'call' THEN 'session_call' ELSE 'session_chat' END,
    (CASE WHEN s.mode = 'call' THEN 'Call with ' ELSE 'Chat with ' END) || COALESCE(v_provider_name, 'Provider'),
    v_minutes || ' min at Rs ' || to_char(s.rate, 'FM999990.00') || '/min',
    v_amount
  );

  UPDATE public.providers
  SET available = true, sessions = sessions + 1
  WHERE id = s.provider_id;

  IF v_provider_user IS NOT NULL THEN
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + v_earnings,
        total_earnings = total_earnings + v_earnings
    WHERE id = v_provider_user;

    INSERT INTO public.transactions (user_id, kind, type, label, sub, amount)
    VALUES (
      v_provider_user, 'credit',
      CASE WHEN s.mode = 'call' THEN 'session_call' ELSE 'session_chat' END,
      'Earning from ' || CASE WHEN s.mode = 'call' THEN 'Call' ELSE 'Chat' END,
      v_minutes || ' min session (10% comm deducted)',
      v_earnings
    );
  END IF;

  UPDATE public.sessions
  SET status = 'ended', seconds = v_seconds, minutes = v_minutes,
      amount = v_amount, provider_earnings = v_earnings, ended_at = now()
  WHERE id = s.id;

  RETURN jsonb_build_object(
    'provider_id', s.provider_id,
    'mode', s.mode,
    'seconds', v_seconds,
    'minutes', v_minutes,
    'amount', v_amount,
    'balance_after', GREATEST(0, v_balance - v_amount)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount NUMERIC)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_wallet NUMERIC;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT wallet_balance INTO v_wallet FROM public.profiles WHERE id = v_user AND role = 'provider';
  IF v_wallet IS NULL THEN RAISE EXCEPTION 'Provider profile not found'; END IF;
  IF v_wallet < p_amount THEN RETURN false; END IF;

  UPDATE public.profiles
  SET wallet_balance = wallet_balance - p_amount,
      pending_earnings = pending_earnings + p_amount
  WHERE id = v_user;

  INSERT INTO public.withdrawals (user_id, amount) VALUES (v_user, p_amount);

  INSERT INTO public.transactions (user_id, kind, type, label, sub, amount)
  VALUES (v_user, 'debit', 'withdrawal', 'Earnings Payout Request', 'Payout to bank account', p_amount);

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_review(p_provider_id UUID, p_rating INTEGER, p_comment TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_name TEXT;
  v_avg NUMERIC;
  v_count INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN RAISE EXCEPTION 'Invalid rating'; END IF;

  SELECT name INTO v_name FROM public.profiles WHERE id = v_user;

  INSERT INTO public.reviews (provider_id, customer_id, customer_name, rating, comment)
  VALUES (p_provider_id, v_user, COALESCE(v_name, 'Guest'), p_rating, COALESCE(left(p_comment, 500), ''))
  ON CONFLICT (provider_id, customer_id)
  DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now();

  SELECT avg(r.rating), count(*) INTO v_avg, v_count
  FROM public.reviews r WHERE r.provider_id = p_provider_id;

  UPDATE public.providers
  SET rating = round(v_avg, 1), reviews = v_count
  WHERE id = p_provider_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.top_up_wallet(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_session(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_session(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_review(UUID, INTEGER, TEXT) TO authenticated;

-- =========================================================
-- DEMO PROVIDER LISTINGS
-- =========================================================
INSERT INTO public.providers
  (name, username, photo, gender, languages, area, description, categories, experience,
   rating, reviews, rate_call, rate_chat, available, preferred_customer_gender, sessions, response_sec, distance_km)
VALUES
  ('Ava R.','ava_r','asset:p1','female',ARRAY['English','Hindi','Marathi'],'Bandra West',
   'Career coach turned late-night listener. I am good at untangling messy thoughts and helping you decide the next small step.',
   ARRAY['Career Advice','Life Coaching','General Chat'],'3 years of coaching',4.9,0,1.5,1.2,true,'everyone',1240,12,2.4),
  ('Malik T.','malik_t','asset:p2','male',ARRAY['English','French'],'Andheri East',
   'Calm, direct and allergic to small talk. Come with a problem, leave with a plan. Fluent in football metaphors.',
   ARRAY['Decision Making','Motivation','Sports'],'5 years mentoring',4.7,0,1.2,0.8,true,'everyone',780,25,5.1),
  ('Mei L.','mei_l','asset:p3','female',ARRAY['English','Mandarin','Cantonese'],'Lower Parel',
   'Fifteen years in negotiation and family mediation. I speak slowly, ask sharp questions and never rush you.',
   ARRAY['Relationships','Conflict Resolution','Workplace Dynamics'],'15 years in mediation',5.0,0,2.5,2.0,true,'female',420,40,7.8),
  ('Diego M.','diego_m','asset:p4','male',ARRAY['English','Spanish','Portuguese'],'Powai',
   'Language practice, gaming chat or just company on a long commute. Low rate, high energy, zero judgement.',
   ARRAY['Language Practice','Gaming','Casual Chat'],'2 years traveler talk',4.5,0,0.9,0.6,true,'everyone',1610,8,9.2),
  ('Nour A.','nour_a','asset:p5','female',ARRAY['English','Arabic','Turkish'],'Khar',
   'Gentle sounding board for anxiety, grief and the in-between days. Chat only, because typing lets you breathe.',
   ARRAY['Mental Wellness','Grief Support','Anxiety Soundboard'],'4 years community support',4.8,0,1.8,1.5,true,'female',640,30,3.6),
  ('Jonas W.','jonas_w','asset:p6','male',ARRAY['English','German'],'Worli',
   'Twenty years of product and hiring. Bring your pitch, your resume or your resignation letter and we will stress-test it.',
   ARRAY['Mock Interviews','Resume Review','Startups'],'20 years tech product & hiring',4.9,0,3.0,2.4,false,'everyone',300,55,8.4);