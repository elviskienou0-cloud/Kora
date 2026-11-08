-- Reuse the latest pending SasPay subscription payment for the same
-- manager, subscription and plan. Serialize concurrent requests to prevent
-- duplicate pending rows caused by repeated clicks or parallel requests.
CREATE OR REPLACE FUNCTION public.create_subscription_payment(
  p_plan_id text,
  p_billing_cycle text DEFAULT 'monthly',
  p_provider text DEFAULT 'unconfigured'
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_plan public.plans%rowtype;
  v_sub public.subscriptions%rowtype;
  v_payment public.payments%rowtype;
  v_ref text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Connexion requise'; END IF;
  IF lower(coalesce(nullif(trim(p_billing_cycle), ''), 'monthly')) <> 'monthly' THEN
    RAISE EXCEPTION 'KORA utilise actuellement un abonnement mensuel.';
  END IF;
  IF lower(coalesce(nullif(trim(p_provider), ''), '')) <> 'saspay' THEN
    RAISE EXCEPTION 'Le seul prestataire de paiement autorisé est SasPay.';
  END IF;

  SELECT * INTO v_plan
  FROM public.plans
  WHERE id::text = p_plan_id AND is_active = true;

  IF v_plan.id IS NULL THEN RAISE EXCEPTION 'Plan introuvable'; END IF;
  IF upper(v_plan.id::text) NOT IN ('PRO', 'BUSINESS') THEN
    RAISE EXCEPTION 'Ce plan ne nécessite pas de paiement via cette fonction';
  END IF;
  IF v_plan.price <= 0 OR v_plan.currency <> 'XOF' THEN
    RAISE EXCEPTION 'Configuration tarifaire invalide';
  END IF;

  PERFORM public.ensure_my_manager_subscription();

  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE user_id = v_user
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_sub.id IS NULL THEN RAISE EXCEPTION 'Abonnement introuvable'; END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(v_user::text || ':' || v_sub.id::text || ':' || v_plan.id::text, 0)
  );

  SELECT * INTO v_payment
  FROM public.payments
  WHERE user_id = v_user
    AND subscription_id = v_sub.id
    AND plan_id = v_plan.id::text
    AND provider = 'saspay'
    AND billing_cycle = 'monthly'
    AND status = 'pending'
    AND metadata ->> 'source' = 'kora_subscription'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_payment.id IS NOT NULL THEN RETURN v_payment; END IF;

  v_ref := 'KORA-SUB-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 18));

  INSERT INTO public.payments (
    user_id, subscription_id, plan_id, provider, reference, amount, currency,
    billing_cycle, status, metadata
  )
  VALUES (
    v_user, v_sub.id, v_plan.id::text, 'saspay', v_ref, v_plan.price,
    v_plan.currency, 'monthly', 'pending',
    '{"source":"kora_subscription"}'::jsonb
  )
  RETURNING * INTO v_payment;

  RETURN v_payment;
END;
$function$;
