import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { LicenseStatusBadge } from '@/components/LicenseStatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVehicles, useSoftDeleteVehicle, getLicenseStatus, getDaysUntilExpiry } from '@/hooks/useVehicles';
import { 
  Car, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

export default function VehiclesPage() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [licenseFilter, setLicenseFilter] = useState<string>(
    searchParams.get('filter') === 'urgent' ? 'urgent' : 'all'
  );
  const [currentPage, setCurrentPage] = useState(1);

  const { data: vehicles, isLoading } = useVehicles();
  const softDeleteMutation = useSoftDeleteVehicle();

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    return vehicles.filter(vehicle => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const ownerName = vehicle.owners?.full_name?.toLowerCase() || '';
        const matches = 
          vehicle.plate_number.toLowerCase().includes(query) ||
          vehicle.make.toLowerCase().includes(query) ||
          vehicle.model.toLowerCase().includes(query) ||
          ownerName.includes(query);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && vehicle.status !== statusFilter) {
        return false;
      }

      // License filter
      if (licenseFilter !== 'all') {
        const status = getLicenseStatus(vehicle.license_expiry_date);
        if (licenseFilter === 'urgent') {
          if (status === 'valid') return false;
        } else if (status !== licenseFilter) {
          return false;
        }
      }

      return true;
    });
  }, [vehicles, searchQuery, statusFilter, licenseFilter]);

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    softDeleteMutation.mutate(id);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Vehicles"
        description="Manage registered vehicles in the system"
      >
        <Button asChild>
          <Link to="/admin/vehicles/new">
            <Plus className="h-4 w-4 mr-2" />
            Register Vehicle
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card variant="default" className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by plate, make, model, or owner..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select 
                value={statusFilter} 
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={licenseFilter} 
                onValueChange={(value) => {
                  setLicenseFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="License" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Licenses</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="urgent">Needs Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : `Showing ${paginatedVehicles.length} of ${filteredVehicles.length} vehicles`}
        </p>
      </div>

      {/* Vehicle List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : paginatedVehicles.length > 0 ? (
        <div className="space-y-3">
          {paginatedVehicles.map((vehicle, index) => {
            const licenseStatus = getLicenseStatus(vehicle.license_expiry_date);
            const daysUntilExpiry = getDaysUntilExpiry(vehicle.license_expiry_date);

            return (
              <Card
                key={vehicle.id}
                variant="interactive"
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Vehicle info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">
                            {vehicle.plate_number}
                          </h3>
                          <Badge variant={vehicle.status === 'active' ? 'success' : 'muted'} className="capitalize">
                            {vehicle.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.make} {vehicle.model} • {vehicle.year} • {vehicle.color}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Owner: {vehicle.owners?.full_name ?? 'No owner'}
                        </p>
                      </div>
                    </div>

                    {/* License status */}
                    <div className="flex items-center gap-4">
                      <LicenseStatusBadge 
                        status={licenseStatus} 
                        daysUntilExpiry={daysUntilExpiry > 0 ? daysUntilExpiry : undefined}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 lg:ml-4">
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link to={`/admin/vehicles/${vehicle.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link to={`/admin/vehicles/${vehicle.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(vehicle.id)}
                        disabled={softDeleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Car}
          title="No vehicles found"
          description="Try adjusting your search or filter criteria, or register a new vehicle."
          action={{
            label: 'Register Vehicle',
            onClick: () => window.location.href = '/admin/vehicles/new',
          }}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(page)}
              className={cn(
                "w-9",
                currentPage === page && "pointer-events-none"
              )}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}
