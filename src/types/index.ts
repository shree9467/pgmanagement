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
  owner?: string;
  building?: string;
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
  building?: string;
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
  building?: string;
  ownerId?: string;
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
  message?: string;
  content?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  date?: string;
  created_at?: string;
  owner_id?: string | null;
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
  company_college?: string;
  sharing_preference?: string;
  food_preference?: string;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'TENANT';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';
  created_at?: string;
  plan_name?: string | null;
  upi_id?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  beneficiary_name?: string | null;
  maxBuildings?: number;
}

export interface PricingPlan {
  id?: string;
  name: string;
  price: string | number;
  period: string;
  desc?: string;
  features: string[];
  maxBuildings: number;
  maxUsers?: number;
  active?: boolean;
  popular?: boolean;
}

export interface Complaint {
  id: string;
  title: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  tenant: string;
  building: string;
  date: string;
}

export interface FraudAlert {
  id: string;
  ip: string;
  action: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL';
  timestamp: string;
  status: 'DETECTED' | 'FLAGGED' | 'RESOLVED';
  details: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  ownerId?: string | null;
  ownerName?: string;
  totalBeds?: number;
  occupiedBeds?: number;
}

export interface AdminPaymentDetails {
  upiId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  beneficiaryName: string;
  receiveDirectly?: boolean;
  qrCodeUrl?: string;
  instructions?: string;
}

export interface WhitelabelConfig {
  ownerId: string;
  appName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  theme: string;
  loginTitle: string;
  loginSubtitle: string;
  enableTenantsSection: boolean;
  enableRoomsSection: boolean;
  enablePaymentsSection: boolean;
  enableExpensesSection: boolean;
  enableReportsSection: boolean;
  enableFoodSection: boolean;
  showRevenueWidget: boolean;
  showOccupancyWidget: boolean;
  showComplaintsWidget: boolean;
  showStaffWidget: boolean;
  customCss?: string;
}

export interface SubscriptionPayment {
  id: string;
  ownerId: string;
  ownerName: string;
  planName: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  utrNumber?: string;
  receiptUrl?: string;
}

export type SaaSContext = 
  | 'LANDING' 
  | 'OWNER' 
  | 'MANAGER' 
  | 'TENANT' 
  | 'GUEST_ONBOARD' 
  | 'SUPER_ADMIN';
