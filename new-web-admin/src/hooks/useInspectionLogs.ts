import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
      // TODO: Implement inspection logs endpoint in FastAPI backend
      // For now, return empty array
      return [] as InspectionLogWithVehicle[];
    },
    enabled: !!inspectorId,
  });
}

export function useCreateInspectionLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Omit<InspectionLog, 'id' | 'scanned_at'>) => {
      // TODO: Implement inspection logs endpoint in FastAPI backend
      throw new Error('Inspection logs not yet implemented in FastAPI backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection_logs'] });
    },
  });
}
