export type TenantStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TenantCategory {
  uuid: string;
  name: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface TenantProduct {
  uuid: string;
  tenant_id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  photo: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  
}

export interface Tenant {
  uuid: string;
  slug?: string | null;
  event_id: string;
  category_id: string;
  status: TenantStatus;
  name: string;
  description: string;
  logo: string;
  website: string;
  email: string;
  phone: string;
  booth_number: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  tenantProducts: TenantProduct[];
  category: TenantCategory;
}
