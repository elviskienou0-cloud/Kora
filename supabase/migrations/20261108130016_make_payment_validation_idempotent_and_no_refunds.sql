-- KORA payment validation hardening.
-- No refunds are supported. Paid payments cannot be downgraded, and revalidating
-- an already-paid payment must not extend the subscription a second time.
CREATE OR REPLACE FUNCTION public.admin_validate_payment(
  p_payment_id uuid,
  p_status text,
  p_note text DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_payment public.payments%rowtype;
  v_old_status text;
  v_status text := lower(trim(coalesce(p_status, '')));
  v_start timestamptz := now();
  v_end timestamptz;
BEGIN
  PERFORM public.admin_require_permission('payments.validate');

  IF p_payment_id IS NULL THEN
    RAISE EXCEPTION 'Paiement manquant';
  END IF;

  IF v_status NOT IN ('paid', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Statut de paiement invalide ou non pris en charge';
  END IF;

  SELECT *
    INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Paiement introuvable';
  END IF;

  v_old_status := v_payment.status;

  IF v_old_status = 'paid' AND v_status <> 'paid' THEN
    RAISE EXCEPTION 'Un paiement validé ne peut pas être rétrogradé';
  END IF;

  IF v_old_status = 'refunded' THEN
    RAISE EXCEPTION 'Un paiement clôturé ne peut pas être réactivé';
  END IF;

  UPDATE public.payments
     SET status = v_status,
         paid_at = CASE WHEN v_status = 'paid' THEN coalesce(paid_at, now()) ELSE paid_at END,
         validated_by = auth.uid(),
         validated_at = now(),
         metadata = coalesce(metadata, '{}'::jsonb)
           || CASE WHEN p_note IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('admin_note', p_note) END,
         updated_at = now()
   WHERE id = p_payment_id
   RETURNING * INTO v_payment;

  IF v_status = 'paid'
     AND v_old_status IS DISTINCT FROM 'paid'
     AND v_payment.subscription_id IS NOT NULL THEN
    v_end := v_start + interval '30 days';

    UPDATE public.subscriptions
       SET status = 'active',
           plan_id = coalesce(v_payment.plan_id, plan_id),
           plan = lower(coalesce(v_payment.plan_id, plan_id)),
           starts_at = v_start,
           ends_at = v_end,
           trial_start = NULL,
           trial_end = NULL,
           current_period_start = v_start,
           current_period_end = v_end,
           updated_at = now()
     WHERE id = v_payment.subscription_id
       AND user_id = v_payment.user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Abonnement associé au paiement introuvable ou incohérent';
    END IF;
  ELSIF v_status = 'paid'
        AND v_old_status IS DISTINCT FROM 'paid'
        AND v_payment.metadata ->> 'source' = 'kora_subscription' THEN
    RAISE EXCEPTION 'Abonnement manquant pour ce paiement KORA';
  END IF;

  IF v_old_status IS DISTINCT FROM v_status THEN
    INSERT INTO public.notifications (user_id, type, title, message, data, is_read, created_at)
    VALUES (
      v_payment.user_id,
      'payment',
      'Mise à jour du paiement',
      concat('Votre paiement ', coalesce(v_payment.reference, v_payment.id::text), ' est maintenant : ', v_status, '.'),
      jsonb_build_object('payment_id', v_payment.id, 'status', v_status),
      false,
      now()
    );
  END IF;

  PERFORM public.write_admin_audit_log_internal(
    'payment.status_update',
    'payment',
    v_payment.id,
    v_payment.user_id,
    jsonb_build_object('from', v_old_status, 'to', v_status, 'note', p_note)
  );

  RETURN v_payment;
END;
$function$;
