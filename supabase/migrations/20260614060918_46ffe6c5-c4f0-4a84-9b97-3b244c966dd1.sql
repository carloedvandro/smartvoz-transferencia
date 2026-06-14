
DROP FUNCTION IF EXISTS public.transfer_funds(UUID, NUMERIC);
DROP FUNCTION IF EXISTS public.request_withdrawal(NUMERIC);
DROP FUNCTION IF EXISTS public.search_users(TEXT);
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.withdrawal_requests;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.wallets;
DROP TABLE IF EXISTS public.profiles;
