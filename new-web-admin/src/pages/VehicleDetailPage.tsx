import { AdminLayout } from '@/components/AdminLayout';
import { LicenseStatusBadge } from '@/components/LicenseStatusBadge';
import { PageHeader } from '@/components/PageHeader';
import { VehicleImageUpload } from '@/components/VehicleImageUpload';
import { VehicleQRCode } from '@/components/VehicleQRCode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getDaysUntilExpiry, getLicenseStatus, useSoftDeleteVehicle, useVehicle } from '@/hooks/useVehicles';
import * as Api from '@/lib/api';
import {
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  Edit,
  FileText,
  Image as ImageIcon,
  MapPin,
  Phone,
  Trash2, User
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: vehicle, isLoading, refetch } = useVehicle(id || '');
  const softDeleteMutation = useSoftDeleteVehicle();

  const handleDelete = async () => {
    if (!vehicle || !confirm('Move this vehicle to trash?')) return;

    try {
      await softDeleteMutation.mutateAsync(vehicle.id.toString());
      navigate('/admin/vehicles');
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      toast.error('Failed to delete vehicle');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <PageHeader title="Loading..." />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  if (!vehicle) return null;

  const licenseStatus = vehicle.license?.expiry_date ? getLicenseStatus(vehicle.license.expiry_date) : 'expired';
  const daysUntilExpiry = vehicle.license?.expiry_date ? getDaysUntilExpiry(vehicle.license.expiry_date) : 0;

  return (
    <AdminLayout>
      <PageHeader
        title={vehicle.plate_number}
        description={`${vehicle.make} ${vehicle.model} ${vehicle.year}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/vehicles')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/admin/vehicles/${vehicle.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{vehicle.plate_number}</h2>
                <p className="text-muted-foreground">{vehicle.make} {vehicle.model}</p>
              </div>
              <div className="ml-auto">
                <Badge variant={vehicle.status === 'active' ? 'success' : 'muted'} className="capitalize text-sm px-3 py-1">
                  {vehicle.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Make</p>
                <p className="font-medium text-foreground">{vehicle.make}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Model</p>
                <p className="font-medium text-foreground">{vehicle.model}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Year</p>
                <p className="font-medium text-foreground">{vehicle.year}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Color</p>
                <p className="font-medium text-foreground">{vehicle.color}</p>
              </div>
            </div>

            {/* License Info */}
            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                License Information
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <LicenseStatusBadge status={licenseStatus} daysUntilExpiry={daysUntilExpiry > 0 ? daysUntilExpiry : undefined} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Start Date
                  </p>
                  <p className="font-medium text-foreground">
                    {vehicle.license?.start_date ? new Date(vehicle.license.start_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Expiry Date
                  </p>
                  <p className="font-medium text-foreground">
                    {vehicle.license?.expiry_date ? new Date(vehicle.license.expiry_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Info */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle.owners ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{vehicle.owners.full_name}</p>
                    <p className="text-sm text-muted-foreground">TIN: {vehicle.owners.tin_number ?? 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{vehicle.owners.phone}</span>
                  </div>
                  {vehicle.owners.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{vehicle.owners.address}</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/admin/owners/${vehicle.owners.id}/edit`}>
                    View Owner Details
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <User className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground">No owner assigned</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link to={`/admin/vehicles/${vehicle.id}/edit`}>
                    Assign Owner
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Images */}
        <Card variant="elevated" className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Vehicle Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleImageUpload
              vehicleId={vehicle.id.toString()}
              existingImages={vehicle.photos || []}
              onUpload={async (files) => {
                await Api.uploadVehiclePhotos(vehicle.id.toString(), files);
                await refetch();
              }}
              onDelete={async (photoId) => {
                await Api.deleteVehiclePhoto(vehicle.id.toString(), photoId.toString());
                await refetch();
              }}
              maxImages={10}
            />
          </CardContent>
        </Card>

        {/* QR Code */}
        <VehicleQRCode
          vehicleId={vehicle.id.toString()}
          plateNumber={vehicle.plate_number}
          vehicleMake={vehicle.make}
          vehicleModel={vehicle.model}
          vehicleYear={vehicle.year}
          existingQrValue={vehicle.qr_value}
        />
      </div>
    </AdminLayout>
  );
}
