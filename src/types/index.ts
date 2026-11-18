export interface Tenant {
  id: string;
  name: string;
  room: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'VACATED';
  score?: number;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  rent_status: 'PAID' | 'PENDING' | 'OVERDUE';
  last_payment?: string;
  avatar?: string;
  created_at: string;
}

export interface Room {
  id: string;
  number: string;
  floor: number | string;
  type: string;
  sharing: number;
  total_beds: number;
  occupied_beds: number;
  price: number;
  amenities?: string[];
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
}

export interface Bed {
  id: string;
  room_id: string;
  bed_number: string;
  tenant_id?: string;
  status: 'OCCUPIED' | 'VACANT' | 'RESERVED';
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  type: 'DAILY' | 'UTILITY' | 'MAINTENANCE' | 'OTHER';
  status: 'CLEARED' | 'PENDING';
  created_at?: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  tenant_name: string;
  room: string;
  amount: number;
  due_date: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  created_at: string;
  payment_mode?: string;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  salary: number;
  shift: string;
}

export interface OnboardingApp {
  id: string;
  name: string;
  phone: string;
  email: string;
  aadhaar?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  applied_at: string;
  room_preference?: string;
}

export type SaaSContext = 
  | 'LANDING' 
  | 'OWNER' 
  | 'MANAGER' 
  | 'TENANT' 
  | 'GUEST_ONBOARD' 
  | 'SUPER_ADMIN';

