import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { LicenseStatusBadge } from '@/components/LicenseStatusBadge';
import { useVehicles, useVehicleByPlate, VehicleWithOwner, getLicenseStatus, getDaysUntilExpiry } from '@/hooks/useVehicles';
import { useInspectionLogs, useCreateInspectionLog } from '@/hooks/useInspectionLogs';
import {
  QrCode,
  LogOut,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Car,
  User,
  Calendar,
  ChevronRight,
  Scan,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function InspectorApp() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedVehicle, setScannedVehicle] = useState<VehicleWithOwner | null>(null);
  const [plateSearch, setPlateSearch] = useState('');
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const { data: vehicles } = useVehicles();
  const { data: recentLogs } = useInspectionLogs(user?.id);
  const createLogMutation = useCreateInspectionLog();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const simulateScan = () => {
    if (!vehicles || vehicles.length === 0) {
      toast.error('No vehicles available');
      return;
    }

    setIsScanning(true);
    // Simulate scanning delay
    setTimeout(() => {
      const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      setScannedVehicle(randomVehicle);
      
      // Log the scan
      if (user?.id) {
        createLogMutation.mutate({
          vehicle_id: randomVehicle.id,
          inspector_id: user.id,
          location: null,
          notes: null,
        });
      }
      
      setIsScanning(false);
    }, 1500);
  };

  const handlePlateSearch = () => {
    if (!plateSearch.trim()) {
      toast.error('Please enter a plate number');
      return;
    }

    const vehicle = vehicles?.find(
      v => v.plate_number.toLowerCase() === plateSearch.toLowerCase()
    );

    if (vehicle) {
      setScannedVehicle(vehicle);
      if (user?.id) {
        createLogMutation.mutate({
          vehicle_id: vehicle.id,
          inspector_id: user.id,
          location: null,
          notes: 'Manual plate search',
        });
      }
    } else {
      toast.error('Vehicle not found');
    }
  };

  const clearScan = () => {
    setScannedVehicle(null);
    setPlateSearch('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Scan className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm">TMS Inspector</h1>
            <p className="text-xs text-muted-foreground">Sidama Region</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            className="text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Scan Result */}
        {scannedVehicle ? (
          <VehicleResult vehicle={scannedVehicle} onClear={clearScan} />
        ) : (
          <>
            {/* Scan Button */}
            <div className="flex flex-col items-center py-8">
              <button
                onClick={simulateScan}
                disabled={isScanning}
                className={cn(
                  "relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500",
                  "bg-primary shadow-lg hover:shadow-glow",
                  isScanning && "animate-pulse"
                )}
              >
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
                <div className="flex flex-col items-center text-primary-foreground">
                  <QrCode className="h-16 w-16 mb-2" />
                  <span className="font-semibold text-lg">
                    {isScanning ? 'Scanning...' : 'Tap to Scan'}
                  </span>
                </div>
              </button>
              <p className="text-muted-foreground text-sm mt-6 text-center max-w-xs">
                Point your camera at the QR code on the vehicle to verify its status
              </p>
            </div>

            {/* Manual Plate Search */}
            <Card variant="default">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3">Or search by plate number:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter plate number..."
                    value={plateSearch}
                    onChange={(e) => setPlateSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePlateSearch()}
                  />
                  <Button onClick={handlePlateSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Scans */}
            {recentLogs && recentLogs.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Scans
                </h2>
                <div className="space-y-2">
                  {recentLogs.slice(0, 5).map((log) => {
                    const status = getLicenseStatus(log.vehicles.license_expiry_date);
                    const statusColors = {
                      valid: 'bg-success/10 border-success/20',
                      expiring: 'bg-warning/10 border-warning/20',
                      expired: 'bg-destructive/10 border-destructive/20',
                    };

                    return (
                      <button
                        key={log.id}
                        onClick={() => {
                          const vehicle = vehicles?.find(v => v.id === log.vehicle_id);
                          if (vehicle) setScannedVehicle(vehicle);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                          "hover:scale-[1.01] active:scale-[0.99]",
                          statusColors[status]
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Car className="h-5 w-5 text-muted-foreground" />
                          <div className="text-left">
                            <p className="font-medium text-foreground">{log.vehicles.plate_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.vehicles.make} {log.vehicles.model}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-border">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-[10px]">
              {user?.name?.charAt(0) ?? 'U'}
            </span>
          </div>
          <span>{user?.name ?? 'Inspector'}</span>
        </div>
      </footer>
    </div>
  );
}

function VehicleResult({ vehicle, onClear }: { vehicle: VehicleWithOwner; onClear: () => void }) {
  const status = getLicenseStatus(vehicle.license_expiry_date);
  const daysUntilExpiry = getDaysUntilExpiry(vehicle.license_expiry_date);

  const statusConfig = {
    valid: {
      color: 'bg-success',
      icon: CheckCircle2,
      title: 'Vehicle Verified',
      subtitle: 'License is valid',
    },
    expiring: {
      color: 'bg-warning',
      icon: AlertTriangle,
      title: 'License Expiring',
      subtitle: `Expires in ${daysUntilExpiry} days`,
    },
    expired: {
      color: 'bg-destructive',
      icon: XCircle,
      title: 'License Expired',
      subtitle: 'Immediate action required',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Status Banner */}
      <div className={cn(
        "rounded-2xl p-6 text-center",
        config.color
      )}>
        <div className="w-16 h-16 rounded-full bg-background/20 flex items-center justify-center mx-auto mb-4">
          <StatusIcon className="h-8 w-8 text-background" />
        </div>
        <h2 className="text-xl font-bold text-background mb-1">{config.title}</h2>
        <p className="text-background/80">{config.subtitle}</p>
      </div>

      {/* Vehicle Details */}
      <Card variant="elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Vehicle Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Plate Number</p>
              <p className="font-semibold text-foreground">{vehicle.plate_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge variant={vehicle.status === 'active' ? 'success' : 'muted'} className="capitalize">
                {vehicle.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Make & Model</p>
              <p className="font-medium text-foreground">{vehicle.make} {vehicle.model}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Year</p>
              <p className="font-medium text-foreground">{vehicle.year}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Color</p>
              <p className="font-medium text-foreground">{vehicle.color}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License Info */}
      <Card variant="elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            License Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">License Status</span>
            <LicenseStatusBadge status={status} daysUntilExpiry={daysUntilExpiry > 0 ? daysUntilExpiry : undefined} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Start Date</span>
            <span className="font-medium text-foreground">
              {new Date(vehicle.license_start_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Expiry Date</span>
            <span className="font-medium text-foreground">
              {new Date(vehicle.license_expiry_date).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Owner Info (Limited) */}
      {vehicle.owners && (
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {vehicle.owners.full_name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {vehicle.owners.full_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Registered Owner
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={onClear}
      >
        <QrCode className="h-5 w-5 mr-2" />
        Scan Another Vehicle
      </Button>
    </div>
  );
}
