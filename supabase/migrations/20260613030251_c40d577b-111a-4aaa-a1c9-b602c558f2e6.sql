
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- WALLETS
CREATE TABLE public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_available NUMERIC(14,2) NOT NULL DEFAULT 1000.00,
  balance_locked NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('transfer_in','transfer_out','withdrawal','deposit')),
  amount NUMERIC(14,2) NOT NULL,
  fee NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed')),
  counterpart_user_id UUID REFERENCES auth.users(id),
  counterpart_name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_user_created ON public.transactions(user_id, created_at DESC);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- WITHDRAWAL REQUESTS
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  fee NUMERIC(14,2) NOT NULL,
  net_amount NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX idx_withdrawals_user_created ON public.withdrawal_requests(user_id, created_at DESC);
GRANT SELECT ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- TRIGGER: create profile + wallet on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_username TEXT;
  v_display TEXT;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1));
  v_display := COALESCE(NEW.raw_user_meta_data->>'display_name', v_username);
  -- ensure unique username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_username := v_username || floor(random()*1000)::text;
  END LOOP;
  INSERT INTO public.profiles(id, username, display_name) VALUES (NEW.id, v_username, v_display);
  INSERT INTO public.wallets(user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRANSFER FUNDS RPC
CREATE OR REPLACE FUNCTION public.transfer_funds(p_to_user UUID, p_amount NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_from UUID := auth.uid();
  v_from_name TEXT;
  v_to_name TEXT;
  v_balance NUMERIC;
BEGIN
  IF v_from IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF v_from = p_to_user THEN RAISE EXCEPTION 'cannot transfer to self'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;

  SELECT display_name INTO v_from_name FROM public.profiles WHERE id = v_from;
  SELECT display_name INTO v_to_name FROM public.profiles WHERE id = p_to_user;
  IF v_to_name IS NULL THEN RAISE EXCEPTION 'recipient not found'; END IF;

  -- lock sender wallet
  SELECT balance_available INTO v_balance FROM public.wallets WHERE user_id = v_from FOR UPDATE;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'insufficient funds'; END IF;

  UPDATE public.wallets SET balance_available = balance_available - p_amount, updated_at = now() WHERE user_id = v_from;
  UPDATE public.wallets SET balance_available = balance_available + p_amount, updated_at = now() WHERE user_id = p_to_user;

  INSERT INTO public.transactions(user_id, type, amount, net_amount, counterpart_user_id, counterpart_name, description)
  VALUES (v_from, 'transfer_out', p_amount, p_amount, p_to_user, v_to_name, 'Transferência enviada');

  INSERT INTO public.transactions(user_id, type, amount, net_amount, counterpart_user_id, counterpart_name, description)
  VALUES (p_to_user, 'transfer_in', p_amount, p_amount, v_from, v_from_name, 'Transferência recebida');

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.transfer_funds(UUID, NUMERIC) TO authenticated;

-- WITHDRAWAL RPC
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_fee NUMERIC;
  v_net NUMERIC;
  v_balance NUMERIC;
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_amount < 50 THEN RAISE EXCEPTION 'minimum withdrawal is 50'; END IF;

  v_fee := round(p_amount * 0.03, 2);
  v_net := p_amount - v_fee;

  SELECT balance_available INTO v_balance FROM public.wallets WHERE user_id = v_user FOR UPDATE;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'insufficient funds'; END IF;

  UPDATE public.wallets SET balance_available = balance_available - p_amount, updated_at = now() WHERE user_id = v_user;

  INSERT INTO public.withdrawal_requests(user_id, amount, fee, net_amount)
  VALUES (v_user, p_amount, v_fee, v_net) RETURNING id INTO v_id;

  INSERT INTO public.transactions(user_id, type, amount, fee, net_amount, status, description)
  VALUES (v_user, 'withdrawal', p_amount, v_fee, v_net, 'pending', 'Solicitação de saque');

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'fee', v_fee, 'net', v_net);
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(NUMERIC) TO authenticated;

-- SEARCH USERS
CREATE OR REPLACE FUNCTION public.search_users(p_query TEXT)
RETURNS TABLE(id UUID, username TEXT, display_name TEXT, avatar_url TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, username, display_name, avatar_url FROM public.profiles
  WHERE id <> auth.uid()
    AND (username ILIKE '%' || p_query || '%' OR display_name ILIKE '%' || p_query || '%')
  ORDER BY display_name LIMIT 8;
$$;
GRANT EXECUTE ON FUNCTION public.search_users(TEXT) TO authenticated;
