import { LicenseStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface LicenseStatusBadgeProps {
  status: LicenseStatus;
  daysUntilExpiry?: number;
}

export function LicenseStatusBadge({ status, daysUntilExpiry }: LicenseStatusBadgeProps) {
  const config = {
    valid: {
      variant: 'valid' as const,
      icon: CheckCircle2,
      label: 'Valid',
    },
    expiring: {
      variant: 'expiring' as const,
      icon: AlertTriangle,
      label: daysUntilExpiry !== undefined 
        ? `Expires in ${daysUntilExpiry} days` 
        : 'Expiring Soon',
    },
    expired: {
      variant: 'expired' as const,
      icon: XCircle,
      label: 'Expired',
    },
  };

  const { variant, icon: Icon, label } = config[status];

  return (
    <Badge variant={variant} className="gap-1.5 py-1 px-2.5">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Badge>
  );
}
