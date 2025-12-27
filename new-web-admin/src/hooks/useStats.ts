import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getLicenseStatus } from './useVehicles';

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  expiringSoon: number;
  expired: number;
  deleted: number;
  totalOwners: number;
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      // Get all vehicles
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('status, license_expiry_date');

      if (vehiclesError) throw vehiclesError;

      // Get owners count
      const { count: ownersCount, error: ownersError } = await supabase
        .from('owners')
        .select('*', { count: 'exact', head: true });

      if (ownersError) throw ownersError;

      const activeVehicles = vehicles?.filter(v => v.status !== 'deleted') || [];
      const deletedVehicles = vehicles?.filter(v => v.status === 'deleted') || [];

      let expiringSoon = 0;
      let expired = 0;

      activeVehicles.forEach(v => {
        const status = getLicenseStatus(v.license_expiry_date);
        if (status === 'expiring') expiringSoon++;
        if (status === 'expired') expired++;
      });

      return {
        totalVehicles: activeVehicles.length,
        activeVehicles: activeVehicles.filter(v => v.status === 'active').length,
        expiringSoon,
        expired,
        deleted: deletedVehicles.length,
        totalOwners: ownersCount || 0,
      } as DashboardStats;
    },
  });
}
