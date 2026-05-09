-- Lock search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- These functions are only invoked by triggers; users should not call them directly via RPC.
revoke execute on function public.mark_query_answered() from public, anon, authenticated;
revoke execute on function public.update_chat_last_message() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;