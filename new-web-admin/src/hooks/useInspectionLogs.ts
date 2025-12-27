import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InspectionLog {
  id: string;
  vehicle_id: string;
  inspector_id: string | null;
  scanned_at: string;
  location: string | null;
  notes: string | null;
}

export interface InspectionLogWithVehicle extends InspectionLog {
  vehicles: {
    id: string;
    plate_number: string;
    make: string;
    model: string;
    color: string;
    license_expiry_date: string;
    status: string;
    owners: {
      full_name: string;
    } | null;
  };
}

export function useInspectionLogs(inspectorId?: string) {
  return useQuery({
    queryKey: ['inspection_logs', inspectorId],
    queryFn: async () => {
      let query = supabase
        .from('inspection_logs')
        .select(`
          *,
          vehicles (
            id,
            plate_number,
            make,
            model,
            color,
            license_expiry_date,
            status,
            owners (
              full_name
            )
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(20);

      if (inspectorId) {
        query = query.eq('inspector_id', inspectorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as InspectionLogWithVehicle[];
    },
    enabled: !!inspectorId,
  });
}

export function useCreateInspectionLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Omit<InspectionLog, 'id' | 'scanned_at'>) => {
      const { data, error } = await supabase
        .from('inspection_logs')
        .insert(log)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection_logs'] });
    },
  });
}
