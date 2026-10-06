create index if not exists idx_notifications_user_created_at on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications (user_id, is_read, created_at desc);
create index if not exists idx_activity_logs_user_action_created_at on public.activity_logs (user_id, action, created_at desc);
create index if not exists idx_kora_transactions_manager_status on public.kora_transactions (manager_id, status);
create index if not exists idx_kora_transactions_client_status on public.kora_transactions (client_id, status);
