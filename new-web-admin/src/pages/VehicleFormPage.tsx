import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useOwners } from '@/hooks/useOwners';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Car, Save, ArrowLeft, Plus, User } from 'lucide-react';
import { z } from 'zod';

const vehicleSchema = z.object({
  plate_number: z.string().min(1, 'Plate number is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1, 'Color is required'),
  license_start_date: z.string().min(1, 'License start date is required'),
  license_expiry_date: z.string().min(1, 'License expiry date is required'),
  owner_id: z.string().optional(),
  status: z.enum(['active', 'suspended']),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export default function VehicleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { data: owners, isLoading: ownersLoading } = useOwners();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<VehicleFormData>({
    plate_number: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    license_start_date: new Date().toISOString().split('T')[0],
    license_expiry_date: '',
    owner_id: '',
    status: 'active',
  });

  useEffect(() => {
    if (isEditing && id) {
      fetchVehicle(id);
    }
  }, [id, isEditing]);

  const fetchVehicle = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          plate_number: data.plate_number,
          make: data.make,
          model: data.model,
          year: data.year,
          color: data.color,
          license_start_date: data.license_start_date,
          license_expiry_date: data.license_expiry_date,
          owner_id: data.owner_id || '',
          status: data.status === 'deleted' ? 'suspended' : data.status,
        });
      }
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      toast.error('Failed to load vehicle');
      navigate('/admin/vehicles');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (field: keyof VehicleFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = vehicleSchema.safeParse({
      ...formData,
      year: Number(formData.year),
      owner_id: formData.owner_id || undefined,
    });

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
        plate_number: formData.plate_number.toUpperCase(),
        make: formData.make,
        model: formData.model,
        year: Number(formData.year),
        color: formData.color,
        license_start_date: formData.license_start_date,
        license_expiry_date: formData.license_expiry_date,
        owner_id: formData.owner_id || null,
        status: formData.status,
      };

      if (isEditing && id) {
        const { error } = await supabase.from('vehicles').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Vehicle updated successfully');
      } else {
        const { error } = await supabase.from('vehicles').insert(payload);
        if (error) throw error;
        toast.success('Vehicle registered successfully');
      }

      navigate('/admin/vehicles');
    } catch (err: any) {
      console.error('Save error:', err);
      if (err.code === '23505') {
        toast.error('A vehicle with this plate number already exists');
      } else {
        toast.error('Failed to save vehicle');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <AdminLayout>
        <PageHeader title="Loading..." />
        <Card><CardContent className="p-6"><Skeleton className="h-96" /></CardContent></Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title={isEditing ? 'Edit Vehicle' : 'Register Vehicle'}
        description={isEditing ? 'Update vehicle information' : 'Add a new vehicle to the registry'}
      >
        <Button variant="outline" onClick={() => navigate('/admin/vehicles')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vehicle Information */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5 text-primary" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plate_number">Plate Number *</Label>
                <Input
                  id="plate_number"
                  placeholder="AA-12345"
                  value={formData.plate_number}
                  onChange={(e) => handleChange('plate_number', e.target.value)}
                  className={errors.plate_number ? 'border-destructive' : ''}
                />
                {errors.plate_number && <p className="text-sm text-destructive">{errors.plate_number}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    placeholder="Toyota"
                    value={formData.make}
                    onChange={(e) => handleChange('make', e.target.value)}
                    className={errors.make ? 'border-destructive' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="Corolla"
                    value={formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    className={errors.model ? 'border-destructive' : ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => handleChange('year', parseInt(e.target.value))}
                    className={errors.year ? 'border-destructive' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color *</Label>
                  <Input
                    id="color"
                    placeholder="White"
                    value={formData.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className={errors.color ? 'border-destructive' : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* License & Owner */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                License & Owner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_start_date">License Start *</Label>
                  <Input
                    id="license_start_date"
                    type="date"
                    value={formData.license_start_date}
                    onChange={(e) => handleChange('license_start_date', e.target.value)}
                    className={errors.license_start_date ? 'border-destructive' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_expiry_date">License Expiry *</Label>
                  <Input
                    id="license_expiry_date"
                    type="date"
                    value={formData.license_expiry_date}
                    onChange={(e) => handleChange('license_expiry_date', e.target.value)}
                    className={errors.license_expiry_date ? 'border-destructive' : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_id">Vehicle Owner</Label>
                {ownersLoading ? (
                  <Skeleton className="h-10" />
                ) : (
                  <Select value={formData.owner_id} onValueChange={(v) => handleChange('owner_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select owner (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No owner assigned</SelectItem>
                      {owners?.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.full_name} ({owner.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate('/admin/owners/new')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Owner
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/vehicles')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : isEditing ? 'Update Vehicle' : 'Register Vehicle'}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
