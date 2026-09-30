-- KORA — align the public plan label with the product name Business
-- The BUSINESS plan keeps its existing ID to preserve foreign keys.
update public.plans
set name = 'Business',
    price = 5000,
    currency = 'XOF',
    duration_months = 1,
    trial_days = 0,
    is_active = true,
    updated_at = now()
where id = 'BUSINESS';
