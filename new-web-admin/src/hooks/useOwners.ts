import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Owner {
  id: string;
  full_name: string;
  phone: string;
  tin_number: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerWithVehicleCount extends Owner {
  vehicle_count: number;
}

export function useOwners() {
  return useQuery({
    queryKey: ['owners'],
    queryFn: async () => {
      const { data: owners, error } = await supabase
        .from('owners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get vehicle counts for each owner
      const { data: vehicleCounts, error: countError } = await supabase
        .from('vehicles')
        .select('owner_id')
        .neq('status', 'deleted');

      if (countError) throw countError;

      const countMap: Record<string, number> = {};
      vehicleCounts?.forEach(v => {
        if (v.owner_id) {
          countMap[v.owner_id] = (countMap[v.owner_id] || 0) + 1;
        }
      });

      return owners.map(owner => ({
        ...owner,
        vehicle_count: countMap[owner.id] || 0,
      })) as OwnerWithVehicleCount[];
    },
  });
}

export function useOwner(id: string) {
  return useQuery({
    queryKey: ['owners', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Owner | null;
    },
    enabled: !!id,
  });
}

export function useCreateOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (owner: Omit<Owner, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('owners')
        .insert(owner)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      toast.success('Owner added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add owner');
    },
  });
}

export function useUpdateOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...owner }: Partial<Owner> & { id: string }) => {
      const { data, error } = await supabase
        .from('owners')
        .update(owner)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['owners', variables.id] });
      toast.success('Owner updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update owner');
    },
  });
}

export function useDeleteOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('owners')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      toast.success('Owner deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete owner');
    },
  });
}
