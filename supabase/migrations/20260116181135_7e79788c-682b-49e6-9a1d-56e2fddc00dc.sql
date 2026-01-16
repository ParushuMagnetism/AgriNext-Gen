-- Fix the permissive policy for transport_status_events insert
DROP POLICY IF EXISTS "System can insert status events" ON public.transport_status_events;

CREATE POLICY "Actors can insert status events for their context"
ON public.transport_status_events FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND (
    -- Farmer inserting for their own request
    (actor_role = 'farmer' AND EXISTS (
      SELECT 1 FROM public.transport_requests tr
      WHERE tr.id = transport_request_id AND tr.farmer_id = auth.uid()
    ))
    OR
    -- Transporter inserting for their trip
    (actor_role = 'transporter' AND EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_id AND t.transporter_id = auth.uid()
    ))
    OR
    -- Admin can insert anything
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);