// ============================================================
// Enums
// ============================================================

import { EventContact } from "./contact.entity";
import { EventRundown } from "./rundown.entity";
import { EventSpeaker } from "./speaker.entity";
import { EventSponsor } from "./sponsor.entity";
import { Tenant } from "./tenant.entity";
import { Workshop } from "./workshop.entity";

export type EventStatus =
  | 'DRAFTED'
  | 'PENDING'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'FINISHED';

export type EventVisibility = 'PUBLIC' | 'PRIVATE';

export type EventType =
  | 'EXPO'
  | 'CAREER_FAIR'
  | 'SEMINAR'
  | 'GRADUATION'
  | 'EXHIBITION'
  | 'MARKETPLACE'
  | 'GOVERNMENT'
  | 'CAMPUS_SCHOOL'
  | 'OTHER';

/** A souvenir catalog item; redeeming it costs `minPoints` points. */
export interface SouvenirTier {
  id: string;
  name: string;
  minPoints: number;
  description?: string;
  /** Photo URL (uploaded via `uploadSouvenirImage`). */
  image?: string;
  /** Units available; absent/null = unlimited. */
  stock?: number | null;
}

/** Catalog item with live availability, as returned by the backend. */
export interface SouvenirCatalogItem extends SouvenirTier {
  /** null = unlimited. */
  remaining: number | null;
  soldOut: boolean;
}

export interface SouvenirRules {
  usePointSystem?: boolean;
  // Standard mode
  minVisitedBooth?: number;
  minTransaction?: number;
  joinedSeminar?: boolean;
  requireAll?: boolean;
  // Point mode
  boothVisitPoint?: { enabled: boolean; pointsPerVisit: number };
  seminarPoint?: { enabled: boolean; pointsPerSeminar: number };
  transactionPoint?: {
    enabled: boolean;
    pointsPerTransaction?: number;
    amountStep?: number;
    pointsPerAmountStep?: number;
  };
  tiers?: SouvenirTier[];
}

export interface EventFeatures {
  tenant?: boolean;
  seminar?: boolean;
  souvenir?: boolean;
  product?: boolean;
  pos?: boolean;
  paidTicket?: boolean;
  maps_embed_url?: string;
  /** Display ratio of the photo on the detail page, "W:H" (default 16:9). */
  photo_ratio?: string;
  /** `contain` = whole photo over a blurred fill, `cover` = crop to the frame. */
  photo_fit?: "contain" | "cover";
}

export type TicketMode = "FREE" | "PAID";
export type TicketStatus = "RESERVED" | "PAID" | "CANCELLED";
export type RegistrationFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "EMAIL"
  | "SELECT"
  | "DATE"
  | "BOOLEAN";

export interface TicketType {
  uuid: string;
  name: string;
  price: number;
}

export interface Ticket {
  uuid: string;
  status: TicketStatus;
  payment_reference: string;
  payment_method: string;
  ticket_type_id: string | null;
  ticket_type?: TicketType | null;
}

export interface RegistrationField {
  uuid: string;
  field_key: string;
  label: string;
  type: RegistrationFieldType;
  required: boolean;
  options: string[] | null;
  position: number;
  /** A8 — show this field only when another field equals a value. */
  condition?: { field_key: string; value: string } | null;
}




export interface Event {
  uuid: string;
  slug?: string | null;
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_deadline: string;
  organizer_name: string;
  quota: number;
  status: EventStatus;
  visibility: EventVisibility;
  event_type: EventType;
  ticket_mode: TicketMode;
  features: EventFeatures | null;
  souvenir_rules: SouvenirRules | null;
  /** Public event detail only: point-system catalog with remaining stock. */
  souvenir_catalog?: SouvenirCatalogItem[];
  rejection_reason: string | null;
  payout_bank_name?: string;
  payout_account_number?: string;
  payout_account_holder?: string;
  payout_status?: "NOT_SETTLED" | "SETTLED";
  settled_at?: string | null;
  photo: string;
  approved_by: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  workshops: Workshop[];
  eventContacts: EventContact[];
  eventRundowns: EventRundown[];
  eventSpeakers: EventSpeaker[];
  eventSponsors: EventSponsor[];
  tenants: Tenant[];
  count_tenants: number;
  count_user_registration: number;
  count_workshops: number;
  userEventRoles: UserEventRole[];
  creator: { full_name: string };
  editor: { full_name: string };

}


export type EventRoleType = "OWNER" | "COMMITTEE" | "TENANT" | "VISITOR";
export type UserEventRoleStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserEventRole {
  role: EventRoleType;
  status?: UserEventRoleStatus;
}



export function getEventRole(event: Event): EventRoleType {
  const roles = event.userEventRoles || [];
  if (roles.some((r) => r.role === "OWNER")) return "OWNER";
  if (roles.some((r) => r.role === "COMMITTEE")) return "COMMITTEE";
  if (roles.some((r) => r.role === "TENANT")) return "TENANT";
  return roles[0]?.role ?? "VISITOR";
}


export function getRoleRoute(role: EventRoleType): "committee" | "tenant" | "visitor" {
  if (role === "OWNER" || role === "COMMITTEE") return "committee";
  if (role === "TENANT") return "tenant";
  return "visitor";
}
