import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeletedVehicles, useRestoreVehicle, usePermanentDeleteVehicle } from '@/hooks/useVehicles';
import { 
  Trash2, 
  Car,
  RotateCcw,
  Trash,
  AlertTriangle
} from 'lucide-react';

export default function TrashPage() {
  const { data: deletedVehicles, isLoading } = useDeletedVehicles();
  const restoreMutation = useRestoreVehicle();
  const permanentDeleteMutation = usePermanentDeleteVehicle();

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id);
  };

  const handlePermanentDelete = (id: string) => {
    permanentDeleteMutation.mutate(id);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Trash"
        description="Manage deleted vehicles"
      />

      {/* Warning banner */}
      {deletedVehicles && deletedVehicles.length > 0 && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-warning/10 border border-warning/20 rounded-xl animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Items in trash will be permanently deleted after 30 days</p>
            <p className="text-muted-foreground">Restore items to prevent permanent deletion</p>
          </div>
        </div>
      )}

      {/* Results count */}
      {deletedVehicles && deletedVehicles.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {deletedVehicles.length} item{deletedVehicles.length !== 1 ? 's' : ''} in trash
          </p>
        </div>
      )}

      {/* Deleted Vehicles List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : deletedVehicles && deletedVehicles.length > 0 ? (
        <div className="space-y-3">
          {deletedVehicles.map((vehicle, index) => {
            const deletedDate = vehicle.deleted_at 
              ? new Date(vehicle.deleted_at).toLocaleDateString() 
              : 'Unknown';

            return (
              <Card
                key={vehicle.id}
                variant="default"
                className="animate-fade-in opacity-75 hover:opacity-100 transition-opacity"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Vehicle info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Car className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">
                            {vehicle.plate_number}
                          </h3>
                          <Badge variant="deleted">Deleted</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.make} {vehicle.model} • {vehicle.year}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Owner: {vehicle.owners?.full_name ?? 'No owner'}
                        </p>
                      </div>
                    </div>

                    {/* Deleted date */}
                    <div className="text-sm text-muted-foreground">
                      Deleted on {deletedDate}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(vehicle.id)}
                        disabled={restoreMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handlePermanentDelete(vehicle.id)}
                        disabled={permanentDeleteMutation.isPending}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Forever
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
          icon={Trash2}
          title="Trash is empty"
          description="Deleted vehicles will appear here for review before permanent deletion."
        />
      )}
    </AdminLayout>
  );
}
