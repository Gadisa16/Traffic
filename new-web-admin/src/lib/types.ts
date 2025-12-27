export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  seats: number;
  ownerId: string;
  licenseStartDate: string;
  licenseExpiryDate: string;
  status: 'active' | 'inactive' | 'suspended';
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Owner {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
  idNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'inspector';
  avatar?: string;
}

export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  expiringSoon: number;
  expired: number;
  deleted: number;
  totalOwners: number;
}

export type LicenseStatus = 'valid' | 'expiring' | 'expired';

export function getLicenseStatus(expiryDate: string): LicenseStatus {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring';
  return 'valid';
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
