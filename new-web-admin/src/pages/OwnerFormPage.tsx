import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { createOwner, getOwner, updateOwner } from '@/lib/api';
import { ArrowLeft, FileText, MapPin, Phone, Save, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

const ownerSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().min(9, 'Valid phone number is required'),
  tin_number: z.string().min(1, 'TIN number is required'),
  address: z.string().optional(),
});

type OwnerFormData = z.infer<typeof ownerSchema>;

export default function OwnerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<OwnerFormData>({
    full_name: '',
    phone: '',
    tin_number: '',
    address: '',
  });

  useEffect(() => {
    if (isEditing && id) {
      fetchOwner(id);
    }
  }, [id, isEditing]);

  const fetchOwner = async (ownerId: string) => {
    try {
      const data = await getOwner(ownerId);
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          tin_number: (data.tin_number as string) || '',
          address: data.address || '',
        });
      }
    } catch (err) {
      console.error('Error fetching owner:', err);
      toast.error('Failed to load owner');
      navigate('/admin/owners');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (field: keyof OwnerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = ownerSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        phone: formData.phone,
        tin_number: formData.tin_number,
        address: formData.address || null,
      };

      if (isEditing && id) {
        await updateOwner(id, payload);
        toast.success('Owner updated successfully');
      } else {
        await createOwner(payload);
        toast.success('Owner added successfully');
      }

      navigate('/admin/owners');
    } catch (err: any) {
      console.error('Save error:', err);
      if (err.code === '23505') {
        toast.error('An owner with this TIN already exists');
      } else {
        toast.error('Failed to save owner');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <AdminLayout>
        <PageHeader title="Loading..." />
        <Card><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={isEditing ? 'Edit Owner' : 'Add Owner'}
        description={isEditing ? 'Update owner information' : 'Register a new vehicle owner'}
      >
        <Button variant="outline" onClick={() => navigate('/admin/owners')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <Card variant="elevated" className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className={errors.full_name ? 'border-destructive' : ''}
              />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  placeholder="0911234567"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tin_number" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  TIN Number *
                </Label>
                <Input
                  id="tin_number"
                  placeholder="Enter TIN"
                  value={formData.tin_number}
                  onChange={(e) => handleChange('tin_number', e.target.value)}
                  className={errors.tin_number ? 'border-destructive' : ''}
                />
                {errors.tin_number && <p className="text-sm text-destructive">{errors.tin_number}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Textarea
                id="address"
                placeholder="Enter address (optional)"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/owners')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : isEditing ? 'Update Owner' : 'Add Owner'}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
