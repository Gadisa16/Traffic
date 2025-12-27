import { Vehicle, Owner, DashboardStats } from './types';

export const mockOwners: Owner[] = [
  {
    id: '1',
    firstName: 'Abebe',
    lastName: 'Bekele',
    phone: '+251911234567',
    email: 'abebe.bekele@email.com',
    address: 'Hawassa, Sidama Region',
    idNumber: 'ETH-2024-001234',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2',
    firstName: 'Tigist',
    lastName: 'Haile',
    phone: '+251922345678',
    email: 'tigist.haile@email.com',
    address: 'Hawassa, Sidama Region',
    idNumber: 'ETH-2024-001235',
    createdAt: '2024-02-20T09:30:00Z',
    updatedAt: '2024-02-20T09:30:00Z',
  },
  {
    id: '3',
    firstName: 'Dawit',
    lastName: 'Mengistu',
    phone: '+251933456789',
    email: 'dawit.m@email.com',
    address: 'Hawassa, Sidama Region',
    idNumber: 'ETH-2024-001236',
    createdAt: '2024-03-10T10:15:00Z',
    updatedAt: '2024-03-10T10:15:00Z',
  },
];

const today = new Date();
const addDays = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    plateNumber: 'AA-12345',
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    color: 'White',
    seats: 4,
    ownerId: '1',
    licenseStartDate: '2024-01-01',
    licenseExpiryDate: addDays(45),
    status: 'active',
    isDeleted: false,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2',
    plateNumber: 'AA-23456',
    make: 'Hyundai',
    model: 'Accent',
    year: 2019,
    color: 'Blue',
    seats: 4,
    ownerId: '2',
    licenseStartDate: '2024-02-01',
    licenseExpiryDate: addDays(15),
    status: 'active',
    isDeleted: false,
    createdAt: '2024-02-20T09:30:00Z',
    updatedAt: '2024-02-20T09:30:00Z',
  },
  {
    id: '3',
    plateNumber: 'AA-34567',
    make: 'Suzuki',
    model: 'Dzire',
    year: 2021,
    color: 'Silver',
    seats: 4,
    ownerId: '3',
    licenseStartDate: '2023-06-01',
    licenseExpiryDate: addDays(-10),
    status: 'suspended',
    isDeleted: false,
    createdAt: '2024-03-10T10:15:00Z',
    updatedAt: '2024-03-10T10:15:00Z',
  },
  {
    id: '4',
    plateNumber: 'AA-45678',
    make: 'Toyota',
    model: 'Vitz',
    year: 2018,
    color: 'Red',
    seats: 4,
    ownerId: '1',
    licenseStartDate: '2024-04-01',
    licenseExpiryDate: addDays(120),
    status: 'active',
    isDeleted: false,
    createdAt: '2024-04-05T11:00:00Z',
    updatedAt: '2024-04-05T11:00:00Z',
  },
  {
    id: '5',
    plateNumber: 'AA-56789',
    make: 'Nissan',
    model: 'Sunny',
    year: 2017,
    color: 'Black',
    seats: 4,
    ownerId: '2',
    licenseStartDate: '2023-01-01',
    licenseExpiryDate: addDays(-45),
    status: 'inactive',
    isDeleted: true,
    deletedAt: '2024-10-01T14:00:00Z',
    createdAt: '2024-05-12T13:30:00Z',
    updatedAt: '2024-10-01T14:00:00Z',
  },
  {
    id: '6',
    plateNumber: 'AA-67890',
    make: 'Kia',
    model: 'Rio',
    year: 2022,
    color: 'White',
    seats: 4,
    ownerId: '3',
    licenseStartDate: '2024-06-01',
    licenseExpiryDate: addDays(200),
    status: 'active',
    isDeleted: false,
    createdAt: '2024-06-20T15:45:00Z',
    updatedAt: '2024-06-20T15:45:00Z',
  },
];

export const mockStats: DashboardStats = {
  totalVehicles: mockVehicles.filter(v => !v.isDeleted).length,
  activeVehicles: mockVehicles.filter(v => !v.isDeleted && v.status === 'active').length,
  expiringSoon: mockVehicles.filter(v => {
    if (v.isDeleted) return false;
    const days = Math.ceil((new Date(v.licenseExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 30;
  }).length,
  expired: mockVehicles.filter(v => {
    if (v.isDeleted) return false;
    return new Date(v.licenseExpiryDate) < new Date();
  }).length,
  deleted: mockVehicles.filter(v => v.isDeleted).length,
  totalOwners: mockOwners.length,
};

export function getOwnerById(id: string): Owner | undefined {
  return mockOwners.find(owner => owner.id === id);
}

export function getVehicleById(id: string): Vehicle | undefined {
  return mockVehicles.find(vehicle => vehicle.id === id);
}

export function getVehiclesByOwnerId(ownerId: string): Vehicle[] {
  return mockVehicles.filter(vehicle => vehicle.ownerId === ownerId && !vehicle.isDeleted);
}
