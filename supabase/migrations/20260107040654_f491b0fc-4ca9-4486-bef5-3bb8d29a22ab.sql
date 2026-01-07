-- PHASE 1: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_orders_farmer_id_created 
  ON public.market_orders(farmer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_orders_buyer_id_created 
  ON public.market_orders(buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_orders_status 
  ON public.market_orders(status);

CREATE INDEX IF NOT EXISTS idx_market_orders_created_at 
  ON public.market_orders(created_at DESC);

-- PHASE 1: Update status values for consistency
UPDATE public.market_orders SET status = 'pending' WHERE status = 'requested';
UPDATE public.market_orders SET status = 'shipped' WHERE status = 'in_transport';

-- PHASE 1: Add CHECK constraint for valid statuses
ALTER TABLE public.market_orders 
  ADD CONSTRAINT market_orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'rejected'));

-- PHASE 2: Create secure status update function
CREATE OR REPLACE FUNCTION public.farmer_update_order_status(
  p_order_id UUID,
  p_new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_farmer_id UUID;
BEGIN
  -- Get current order info
  SELECT status, farmer_id INTO v_current_status, v_farmer_id
  FROM public.market_orders
  WHERE id = p_order_id;
  
  -- Verify farmer owns this order
  IF v_farmer_id IS NULL OR v_farmer_id != auth.uid() THEN
    RAISE EXCEPTION 'Order not found or access denied';
  END IF;
  
  -- Validate status transitions
  IF v_current_status = 'pending' AND p_new_status IN ('confirmed', 'rejected', 'cancelled') THEN
    NULL;
  ELSIF v_current_status = 'confirmed' AND p_new_status = 'shipped' THEN
    NULL;
  ELSIF v_current_status = 'shipped' AND p_new_status = 'delivered' THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'Invalid status transition from % to %', v_current_status, p_new_status;
  END IF;
  
  -- Perform the update
  UPDATE public.market_orders
  SET status = p_new_status, updated_at = now()
  WHERE id = p_order_id;
  
  RETURN TRUE;
END;
$$;

-- PHASE 2: Drop existing overly permissive farmer update policy
DROP POLICY IF EXISTS "Farmers can update orders for their crops" ON public.market_orders;

-- PHASE 2: Create restricted farmer update policy
CREATE POLICY "Farmers can update own order status"
  ON public.market_orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = farmer_id);