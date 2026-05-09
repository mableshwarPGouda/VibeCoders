drop policy if exists "authenticated insert notifications" on public.notifications;
create policy "users insert own notifications"
  on public.notifications for insert
  to authenticated with check (auth.uid() = user_id);