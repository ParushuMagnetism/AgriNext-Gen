import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Trip {
  id: string;
  transport_request_id: string;
  transporter_id: string;
  status: 'assigned' | 'en_route' | 'arrived' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'issue';
  assigned_at: string;
  en_route_at: string | null;
  arrived_at: string | null;
  picked_up_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  issue_code: string | null;
  issue_notes: string | null;
  pickup_proofs: string[] | null;
  delivery_proofs: string[] | null;
  pickup_otp_required: boolean;
  pickup_otp_verified: boolean;
  delivery_otp_required: boolean;
  delivery_otp_verified: boolean;
  actual_weight_kg: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  transport_request?: {
    id: string;
    farmer_id: string;
    crop_id: string | null;
    quantity: number;
    quantity_unit: string | null;
    pickup_location: string;
    pickup_village: string | null;
    preferred_date: string | null;
    preferred_time: string | null;
    drop_location: string | null;
    fare_estimate: number | null;
    notes: string | null;
  };
  farmer?: {
    full_name: string;
    village: string;
    district: string;
    phone: string;
  };
  crop?: {
    crop_name: string;
    variety: string | null;
  };
}

export interface TransportStatusEvent {
  id: string;
  transport_request_id: string;
  trip_id: string | null;
  actor_id: string;
  actor_role: 'farmer' | 'agent' | 'transporter' | 'admin' | 'system';
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
}

// Fetch active trips for current transporter
export const useTrips = (status?: string | string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trips', user?.id, status],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('trips')
        .select(`
          *,
          transport_request:transport_requests(
            id, farmer_id, crop_id, quantity, quantity_unit,
            pickup_location, pickup_village, preferred_date, preferred_time,
            drop_location, fare_estimate, notes
          )
        `)
        .eq('transporter_id', user.id)
        .order('assigned_at', { ascending: false });

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      const { data: trips, error } = await query;
      if (error) throw error;

      const farmerIds = Array.from(
        new Set((trips || []).map((trip) => trip.transport_request?.farmer_id).filter(Boolean))
      ) as string[];
      const cropIds = Array.from(
        new Set((trips || []).map((trip) => trip.transport_request?.crop_id).filter(Boolean))
      ) as string[];

      const [farmersRes, cropsRes] = await Promise.all([
        farmerIds.length > 0
          ? supabase
              .from('profiles')
              .select('id, full_name, village, district, phone')
              .in('id', farmerIds)
          : Promise.resolve({ data: [], error: null }),
        cropIds.length > 0
          ? supabase
              .from('crops')
              .select('id, crop_name, variety')
              .in('id', cropIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (farmersRes.error) throw farmersRes.error;
      if (cropsRes.error) throw cropsRes.error;

      const farmerMap = new Map((farmersRes.data || []).map((f: any) => [f.id, f]));
      const cropMap = new Map((cropsRes.data || []).map((c: any) => [c.id, c]));

      const enrichedTrips = (trips || []).map((trip) => {
        const request = trip.transport_request;
        const farmer = request?.farmer_id ? farmerMap.get(request.farmer_id) : null;
        const crop = request?.crop_id ? cropMap.get(request.crop_id) : null;

        return {
          ...trip,
          farmer: farmer
            ? {
                full_name: farmer.full_name,
                village: farmer.village,
                district: farmer.district,
                phone: farmer.phone,
              }
            : null,
          crop: crop
            ? {
                crop_name: crop.crop_name,
                variety: crop.variety,
              }
            : null,
        };
      });

      return enrichedTrips as Trip[];
    },
    enabled: !!user?.id,
  });
};

// Fetch single trip by ID
export const useTripDetail = (tripId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['trip-detail', tripId],
    queryFn: async () => {
      if (!tripId) return null;

      const { data: trip, error } = await supabase
        .from('trips')
        .select(`
          *,
          transport_request:transport_requests(
            id, farmer_id, crop_id, quantity, quantity_unit,
            pickup_location, pickup_village, preferred_date, preferred_time,
            drop_location, fare_estimate, notes
          )
        `)
        .eq('id', tripId)
        .single();

      if (error) throw error;
      if (!trip) return null;

      const request = trip.transport_request;
      const [farmerResult, cropResult] = await Promise.all([
        request?.farmer_id
          ? supabase
              .from('profiles')
              .select('full_name, village, district, phone')
              .eq('id', request.farmer_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        request?.crop_id
          ? supabase
              .from('crops')
              .select('crop_name, variety')
              .eq('id', request.crop_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        ...trip,
        farmer: farmerResult.data,
        crop: cropResult.data,
      } as Trip;
    },
    enabled: !!tripId && !!user?.id,
  });
};

// Fetch trip status events
export const useTripStatusEvents = (tripId: string | undefined) => {
  return useQuery({
    queryKey: ['trip-status-events', tripId],
    queryFn: async () => {
      if (!tripId) return [];

      const { data, error } = await supabase
        .from('transport_status_events')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TransportStatusEvent[];
    },
    enabled: !!tripId,
  });
};

// Accept load via edge function
export const useAcceptLoadSecure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transportRequestId,
      vehicleId,
    }: {
      transportRequestId: string;
      vehicleId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('accept-load', {
        body: {
          transport_request_id: transportRequestId,
          vehicle_id: vehicleId,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['available-loads'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['active-trips'] });
      toast.success('Load accepted successfully!');
    },
    onError: (error: Error) => {
      if (error.message.includes('ALREADY_ASSIGNED') || error.message.includes('already')) {
        toast.error('This load has already been accepted by another transporter');
      } else {
        toast.error('Failed to accept load: ' + error.message);
      }
    },
  });
};

// Update trip status via edge function
export const useUpdateTripStatusSecure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      newStatus,
      note,
      proofPaths,
      issueCode,
      issueNotes,
      actualWeightKg,
    }: {
      tripId: string;
      newStatus: string;
      note?: string;
      proofPaths?: string[];
      issueCode?: string;
      issueNotes?: string;
      actualWeightKg?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('update-trip-status', {
        body: {
          trip_id: tripId,
          new_status: newStatus,
          note,
          proof_paths: proofPaths,
          issue_code: issueCode,
          issue_notes: issueNotes,
          actual_weight_kg: actualWeightKg,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip-detail'] });
      queryClient.invalidateQueries({ queryKey: ['trip-status-events'] });
      queryClient.invalidateQueries({ queryKey: ['active-trips'] });
      queryClient.invalidateQueries({ queryKey: ['completed-trips'] });
      toast.success(`Status updated to ${data.new_status}`);
    },
    onError: (error: Error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });
};

// Upload proof photo
export const useUploadProof = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      tripId,
      file,
      type,
    }: {
      tripId: string;
      file: File;
      type: 'pickup' | 'delivery';
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const timestamp = Date.now();
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${tripId}/${type}/${timestamp}_${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-proofs')
        .upload(filePath, file, {
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      return filePath;
    },
    onError: (error: Error) => {
      toast.error('Failed to upload photo: ' + error.message);
    },
  });
};

// Get signed URL for proof photo
export const useProofSignedUrl = (filePath: string | null) => {
  return useQuery({
    queryKey: ['proof-url', filePath],
    queryFn: async () => {
      if (!filePath) return null;

      const { data, error } = await supabase.storage
        .from('trip-proofs')
        .createSignedUrl(filePath, 600); // 10 min expiry

      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!filePath,
    staleTime: 5 * 60 * 1000, // Cache for 5 min
  });
};
