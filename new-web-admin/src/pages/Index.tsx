import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useStats } from '@/hooks/useStats';
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock,
  Moon,
  QrCode,
  Search,
  Shield,
  Sun,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useStats();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const query = searchQuery.trim().toUpperCase();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/vehicles/verify?code=${encodeURIComponent(query)}`);

      if (!response.ok) {
        if (response.status === 404) {
          setSearchError('No vehicle found with this plate number.');
          return;
        }
        throw new Error('Failed to search');
      }

      const data = await response.json();

      if (data) {
        const today = new Date();
        const expiryDate = data.license_expiry ? new Date(data.license_expiry) : null;
        const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        let licenseStatus: 'valid' | 'expiring' | 'expired' = 'valid';
        if (!expiryDate) licenseStatus = 'expired';
        else if (daysUntilExpiry < 0) licenseStatus = 'expired';
        else if (daysUntilExpiry <= 30) licenseStatus = 'expiring';

        setSearchResult({
          plate_number: data.plate_number,
          status: data.status,
          license_expiry_date: data.license_expiry,
          make: '',
          model: '',
          color: '',
          licenseStatus,
          daysUntilExpiry
        });
      } else {
        setSearchError('No vehicle found with this plate number.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const getLicenseStatusDisplay = (status: string, days: number) => {
    switch (status) {
      case 'valid':
        return { icon: CheckCircle2, text: 'Valid License', color: 'text-success', bg: 'bg-success/10' };
      case 'expiring':
        return { icon: AlertTriangle, text: `Expires in ${days} days`, color: 'text-warning', bg: 'bg-warning/10' };
      case 'expired':
        return { icon: XCircle, text: 'License Expired', color: 'text-destructive', bg: 'bg-destructive/10' };
      default:
        return { icon: Clock, text: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex items-center justify-between glass border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-foreground">TMS Sidama</span>
            <p className="text-xs text-muted-foreground hidden sm:block">Traffic Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAuthenticated ? (
            <Button variant="default" size="sm" onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/inspector')}>
              Dashboard
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section with Stats */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-in">
              <Shield className="h-4 w-4" />
              Sidama Region Transport Authority
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-slide-up leading-tight">
              Public Vehicle
              <span className="text-primary"> Verification</span>
            </h1>

            <p className="text-muted-foreground max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
              Verify any registered vehicle's license status instantly. No registration required.
            </p>
          </div>

          {/* Public Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-fade-in" style={{ animationDelay: '150ms' }}>
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            ) : (
              <>
                <Card variant="glass" className="text-center">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalVehicles ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Total Vehicles</p>
                  </CardContent>
                </Card>
                <Card variant="glass" className="text-center">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{(stats?.totalVehicles ?? 0) - (stats?.expiringSoon ?? 0) - (stats?.expired ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">Valid Licenses</p>
                  </CardContent>
                </Card>
                <Card variant="glass" className="text-center">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats?.expiringSoon ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Expiring Soon</p>
                  </CardContent>
                </Card>
                <Card variant="glass" className="text-center">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stats?.expired ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Expired</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Vehicle Search */}
          <Card variant="elevated" className="max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Verify a Vehicle
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter plate number to check license validity
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter plate number (e.g., AA-12345)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Button type="submit" size="lg" disabled={isSearching}>
                  {isSearching ? 'Searching...' : 'Verify'}
                </Button>
              </form>

              {/* Search Result */}
              {searchResult && (
                <div className="mt-6 p-4 rounded-xl bg-muted/50 animate-fade-in">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <h3 className="font-bold text-lg text-foreground">{searchResult.plate_number}</h3>
                        {(() => {
                          const status = getLicenseStatusDisplay(searchResult.licenseStatus, searchResult.daysUntilExpiry);
                          return (
                            <Badge className={`${status.bg} ${status.color} border-0`}>
                              <status.icon className="h-3 w-3 mr-1" />
                              {status.text}
                            </Badge>
                          );
                        })()}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {searchResult.make} {searchResult.model} • {searchResult.color}
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-card">
                          <p className="text-muted-foreground text-xs">License Start</p>
                          <p className="font-medium text-foreground">
                            {new Date(searchResult.license_start_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-card">
                          <p className="text-muted-foreground text-xs">License Expiry</p>
                          <p className="font-medium text-foreground">
                            {new Date(searchResult.license_expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {searchError && (
                <div className="mt-6 p-4 rounded-xl bg-destructive/10 text-destructive text-center animate-fade-in">
                  <XCircle className="h-8 w-8 mx-auto mb-2 opacity-70" />
                  <p>{searchError}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-center text-foreground mb-8">
            System Features
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card variant="default" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Vehicle Registry</h3>
                <p className="text-sm text-muted-foreground">
                  Complete database of registered transport vehicles
                </p>
              </CardContent>
            </Card>

            <Card variant="default" className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">License Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time license validity monitoring
                </p>
              </CardContent>
            </Card>

            <Card variant="default" className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">QR Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Instant verification via QR code scanning
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Car className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Traffic Management System</p>
              <p className="text-xs text-muted-foreground">Hawassa City, Sidama Region, Ethiopia</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sidama Region Transport Authority
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
