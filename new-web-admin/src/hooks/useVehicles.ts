import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Vehicle {
  id: string;
  plate_number: string;
  owner_id: string | null;
  make: string;
  model: string;
  year: number;
  color: string;
  license_start_date: string;
  license_expiry_date: string;
  status: 'active' | 'suspended' | 'deleted';
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleWithOwner extends Vehicle {
  owners: {
    id: string;
    full_name: string;
    phone: string;
    tin_number: string;
    address: string | null;
  } | null;
}

export type LicenseStatus = 'valid' | 'expiring' | 'expired';

export function getLicenseStatus(expiryDate: string): LicenseStatus {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring';
  return 'valid';
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function useVehicles(options?: { includeDeleted?: boolean }) {
  return useQuery({
    queryKey: ['vehicles', options],
    queryFn: async () => {
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          owners (
            id,
            full_name,
            phone,
            tin_number,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (!options?.includeDeleted) {
        query = query.neq('status', 'deleted');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as VehicleWithOwner[];
    },
  });
}

export function useDeletedVehicles() {
  return useQuery({
    queryKey: ['vehicles', 'deleted'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          owners (
            id,
            full_name,
            phone,
            tin_number,
            address
          )
        `)
        .eq('status', 'deleted')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data as VehicleWithOwner[];
    },
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          owners (
            id,
            full_name,
            phone,
            tin_number,
            address
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as VehicleWithOwner | null;
    },
    enabled: !!id,
  });
}

export function useVehicleByPlate(plateNumber: string) {
  return useQuery({
    queryKey: ['vehicles', 'plate', plateNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          owners (
            id,
            full_name,
            phone,
            tin_number,
            address
          )
        `)
        .eq('plate_number', plateNumber)
        .maybeSingle();

      if (error) throw error;
      return data as VehicleWithOwner | null;
    },
    enabled: !!plateNumber,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Vehicle registered successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to register vehicle');
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...vehicle }: Partial<Vehicle> & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicle)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Vehicle updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update vehicle');
    },
  });
}

export function useSoftDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ 
          status: 'deleted' as const, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Vehicle moved to trash');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vehicle');
    },
  });
}

export function useRestoreVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update({ 
          status: 'active' as const, 
          deleted_at: null 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Vehicle restored successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to restore vehicle');
    },
  });
}

export function usePermanentDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Vehicle permanently deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vehicle');
    },
  });
}
