import { AdminLayout } from '@/components/AdminLayout';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useOwners } from '@/hooks/useOwners';
import {
  Car,
  Edit,
  Eye,
  MapPin,
  Phone,
  Plus,
  Search,
  Users
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function OwnersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: owners, isLoading } = useOwners();

  const filteredOwners = useMemo(() => {
    if (!owners) return [];
    
    return owners.filter(owner => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          (owner.full_name || '').toLowerCase().includes(query) ||
          (owner.phone || '').includes(query) ||
          ((owner.tin_number || '').toLowerCase().includes(query));
        if (!matches) return false;
      }
      return true;
    });
  }, [owners, searchQuery]);

  return (
    <AdminLayout>
      <PageHeader
        title="Vehicle Owners"
        description="Manage registered vehicle owners"
      >
        <Button asChild>
          <Link to="/admin/owners/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Owner
          </Link>
        </Button>
      </PageHeader>

      {/* Search */}
      <Card variant="default" className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or TIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : `Showing ${filteredOwners.length} owners`}
        </p>
      </div>

      {/* Owners List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredOwners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOwners.map((owner, index) => (
            <Card
              key={owner.id}
              variant="interactive"
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {owner.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        TIN: {owner.tin_number ?? 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link to={`/admin/owners/${owner.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link to={`/admin/owners/${owner.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{owner.phone}</span>
                  </div>
                  {owner.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{owner.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Car className="h-4 w-4" />
                    <span>{owner.vehicle_count} vehicle{owner.vehicle_count !== 1 ? 's' : ''} registered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No owners found"
          description="Try adjusting your search criteria, or add a new owner."
          action={{
            label: 'Add Owner',
            onClick: () => window.location.href = '/admin/owners/new',
          }}
        />
      )}
    </AdminLayout>
  );
}
