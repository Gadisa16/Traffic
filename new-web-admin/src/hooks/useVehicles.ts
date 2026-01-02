import * as Api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface License {
  start_date: string;
  expiry_date: string;
  renewal_status?: string;
}

export interface VehiclePhoto {
  id: number;
  file_url: string;
  kind?: string;
  created_at?: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  owner_id: string | null;
  make: string;
  model: string;
  year: number;
  color: string;
  status: 'active' | 'suspended' | 'deleted';
  license_expiry_date: string;
  license_start_date: string;
  license?: License;
  photos?: VehiclePhoto[];
  qr_value?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface VehicleWithOwner extends Vehicle {
  owners: {
    id: string;
    full_name: string;
    phone: string;
    tin_number: string;
    address: string | null;
  } | null;
  license?: License;
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
      const data = await Api.getVehicles(options?.includeDeleted);
      return data as VehicleWithOwner[];
    },
  });
}

export function useDeletedVehicles() {
  return useQuery({
    queryKey: ['vehicles', 'deleted'],
    queryFn: async () => {
      const data = await Api.getDeletedVehicles();
      return data as VehicleWithOwner[];
    },
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['vehicles', id],
    queryFn: async () => {
      const data = await Api.getVehicle(id);
      return data as VehicleWithOwner | null;
    },
    enabled: !!id,
  });
}

export function useVehicleByPlate(plateNumber: string) {
  return useQuery({
    queryKey: ['vehicles', 'plate', plateNumber],
    queryFn: async () => {
      const data = await Api.getVehicleByPlate(plateNumber);
      return data as VehicleWithOwner | null;
    },
    enabled: !!plateNumber,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
      return await Api.createVehicle(vehicle);
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
      return await Api.updateVehicle(id, vehicle);
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
      return await Api.deleteVehicle(id);
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
      return await Api.restoreVehicle(id);
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
      return await Api.purgeVehicle(id);
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
