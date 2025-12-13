-- kyc_auto_approve_trigger.sql
-- Create trigger to set profiles.is_verified = true when kyc_verifications.status becomes 'approved' or 'verified'

-- Function
CREATE OR REPLACE FUNCTION public.handle_kyc_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act on rows where the new status is approved/verified
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF (NEW.status = 'approved' OR NEW.status = 'verified') THEN
      -- Upsert profile to set is_verified = true
      INSERT INTO public.profiles (id, is_verified, created_at, updated_at)
      VALUES (NEW.user_id, true, timezone('utc', now()), timezone('utc', now()))
      ON CONFLICT (id) DO UPDATE SET is_verified = true, updated_at = timezone('utc', now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_kyc_status_change ON public.kyc_verifications;
CREATE TRIGGER trigger_kyc_status_change
AFTER INSERT OR UPDATE ON public.kyc_verifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_kyc_status_change();
