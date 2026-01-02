import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { getOwner, getOwnerDocuments, getVehiclesByOwner, uploadOwnerDocument } from '@/lib/api';
import { Car, Edit, FileText, Link as LinkIcon, MapPin, Phone, Upload, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

type Owner = {
  id: number;
  full_name: string;
  phone?: string | null;
  address?: string | null;
  tin_number?: string | null;
  fan_number?: string | null;
};

type OwnerDocument = {
  id: number;
  doc_type: string;
  file_url: string;
  status: string;
  rejection_reason?: string | null;
};

type OwnerVehicle = {
  id: number;
  plate_number: string;
  side_number?: string | null;
};

export default function OwnerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [documents, setDocuments] = useState<OwnerDocument[]>([]);
  const [vehicles, setVehicles] = useState<OwnerVehicle[]>([]);
  const [docType, setDocType] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([getOwner(id), getOwnerDocuments(id), getVehiclesByOwner(id)])
      .then(([ownerData, docsData, vehiclesData]) => {
        setOwner(ownerData as Owner);
        setDocuments((docsData as OwnerDocument[]) || []);
        setVehicles((vehiclesData as OwnerVehicle[]) || []);
      })
      .catch((err) => {
        console.error('Failed to load owner details:', err);
        toast.error('Failed to load owner details');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setUploading(true);
    try {
      await uploadOwnerDocument(id, { doc_type: docType, file_url: fileUrl });
      setDocType('');
      setFileUrl('');
      setDocuments(await getOwnerDocuments(id));
      toast.success('Document uploaded');
    } catch (err) {
      console.error('Failed to upload document:', err);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const vehiclesCountLabel = useMemo(() => {
    const count = vehicles.length;
    return `${count} vehicle${count === 1 ? '' : 's'}`;
  }, [vehicles.length]);

  if (isLoading) {
    return (
      <AdminLayout>
        <PageHeader title="Loading..." />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-3" />
        </div>
      </AdminLayout>
    );
  }

  if (!owner) {
    return (
      <AdminLayout>
        <PageHeader title="Owner not found" description="The requested owner does not exist or could not be loaded." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={owner.full_name || 'Owner Details'}
        description={`TIN: ${owner.tin_number || 'N/A'} • ${vehiclesCountLabel} registered`}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/owners')}>Back</Button>
          <Button asChild>
            <Link to={`/admin/owners/${owner.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Owner
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Owner Info */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Owner Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{owner.full_name}</h2>
                <p className="text-sm text-muted-foreground">TIN: {owner.tin_number || 'N/A'}</p>
              </div>
              <Badge variant="secondary" className="mt-1">{vehiclesCountLabel}</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone
                </p>
                <p className="font-medium text-foreground">{owner.phone || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">FAN</p>
                <p className="font-medium text-foreground">{owner.fan_number || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 md:col-span-2">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Address
                </p>
                <p className="font-medium text-foreground">{owner.address || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="docType">Type</Label>
                <Input
                  id="docType"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  placeholder="e.g., ID, License, Agreement"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileUrl">File URL</Label>
                <Input
                  id="fileUrl"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="Paste a document URL"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card variant="elevated" className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Uploaded Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-sm text-muted-foreground">No documents uploaded.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {documents.map((doc) => (
                  <Card key={doc.id} variant="default">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">{doc.doc_type}</p>
                          <p className="text-xs text-muted-foreground">Document #{doc.id}</p>
                        </div>
                        <Badge variant={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                          {doc.status}
                        </Badge>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        View document
                      </a>
                      {doc.rejection_reason && (
                        <div className="text-sm text-destructive">
                          Rejected: {doc.rejection_reason}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicles */}
        <Card variant="elevated" className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Vehicles Owned
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <div className="text-sm text-muted-foreground">No vehicles registered.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {vehicles.map((v) => (
                  <Card key={v.id} variant="interactive">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{v.plate_number}</p>
                        <p className="text-xs text-muted-foreground">Side #: {v.side_number || 'N/A'}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/vehicles/${v.id}`}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
