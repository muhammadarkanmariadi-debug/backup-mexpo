// src/entities/user.entity.ts

export type UserRole = "SUPERADMIN" | "USER";

export type UserBioRoleType = "PARTICIPANT" | "SUPERVISOR";

export type UserBio = {
  uuid: string;
  city: string;
  role_type: UserBioRoleType;
  destination_country: string;
  departure_month: string; // ISO datetime
  user_id: string;
};

export type User = {
  uuid: string;
  full_name: string;
  email: string;
  verify_at: string | null;
  is_active: boolean;
  phone: string;
  photo: string;
  organization: string;
  role: UserRole;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  usersBio?: UserBio | null;
};