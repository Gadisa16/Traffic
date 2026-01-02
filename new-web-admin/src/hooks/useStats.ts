import * as Api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

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
      const stats = await Api.getStats();
      const owners = await Api.getOwners();

      return {
        totalVehicles: stats.total_vehicles || 0,
        activeVehicles: stats.valid_license || 0,
        expiringSoon: stats.expiring_soon_license || 0,
        expired: stats.expired_license || 0,
        deleted: 0,
        totalOwners: owners.length || 0,
      } as DashboardStats;
    },
  });
}
