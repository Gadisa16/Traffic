import { AdminLayout } from '@/components/AdminLayout';
import { LicenseStatusBadge } from '@/components/LicenseStatusBadge';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStats } from '@/hooks/useStats';
import { getDaysUntilExpiry, getLicenseStatus, useVehicles } from '@/hooks/useVehicles';
import {
  AlertTriangle,
  ArrowRight,
  Car,
  Trash2,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();

  const recentVehicles = vehicles?.slice(0, 5) ?? [];
  const urgentVehicles = vehicles
    ?.filter(v => getLicenseStatus(v.license_expiry_date) !== 'valid')
    .slice(0, 4) ?? [];

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of the Traffic Management System"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Total Vehicles"
              value={stats?.totalVehicles ?? 0}
              icon={Car}
              description="Registered in system"
              variant="primary"
              to="/admin/vehicles"
            />
            <StatCard
              title="Active Vehicles"
              value={stats?.activeVehicles ?? 0}
              icon={TrendingUp}
              description="Currently operating"
              variant="success"
              to="/admin/vehicles?filter=valid"
            />
            <StatCard
              title="Expiring Soon"
              value={stats?.expiringSoon ?? 0}
              icon={AlertTriangle}
              description="Within 30 days"
              variant="warning"
              to="/admin/vehicles?filter=expiring"
            />
            <StatCard
              title="Expired Licenses"
              value={stats?.expired ?? 0}
              icon={XCircle}
              description="Requires attention"
              variant="destructive"
              to="/admin/vehicles?filter=expired"
            />
            <StatCard
              title="In Trash"
              value={stats?.deleted ?? 0}
              icon={Trash2}
              description="Pending deletion"
              variant="default"
              to="/admin/trash"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Attention */}
        <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Requires Attention
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/vehicles?filter=urgent">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {vehiclesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            ) : urgentVehicles.length > 0 ? (
              urgentVehicles.map((vehicle) => {
                const status = getLicenseStatus(vehicle.license_expiry_date);
                const days = getDaysUntilExpiry(vehicle.license_expiry_date);

                return (
                  <Link
                    key={vehicle.id}
                    to={`/admin/vehicles/${vehicle.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center shadow-sm">
                        <Car className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {vehicle.plate_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.owners?.full_name ?? 'No owner'}
                        </p>
                      </div>
                    </div>
                    <LicenseStatusBadge status={status} daysUntilExpiry={days} />
                  </Link>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No urgent issues</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Vehicles */}
        <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Recent Vehicles
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/vehicles">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {vehiclesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            ) : recentVehicles.length > 0 ? (
              recentVehicles.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  to={`/admin/vehicles/${vehicle.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center shadow-sm">
                      <Car className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {vehicle.plate_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.make} {vehicle.model} • {vehicle.year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={vehicle.status === 'active' ? 'success' : 'muted'} className="capitalize">
                      {vehicle.status}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No vehicles registered</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="default" className="mt-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">
                Common tasks for managing the transport system
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/admin/vehicles/new">
                  <Car className="h-4 w-4 mr-2" />
                  Register Vehicle
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/owners/new">
                  <Users className="h-4 w-4 mr-2" />
                  Add Owner
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
