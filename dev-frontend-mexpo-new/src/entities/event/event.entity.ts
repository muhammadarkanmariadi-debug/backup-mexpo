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

export interface EventFeatures {
  tenant?: boolean;
  seminar?: boolean;
  souvenir?: boolean;
  product?: boolean;
  pos?: boolean;
  paidTicket?: boolean;
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
  souvenir_rules: {
    minVisitedBooth?: number;
    minTransaction?: number;
    joinedSeminar?: boolean;
    requireAll?: boolean;
  } | null;
  rejection_reason: string | null;
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

export interface UserEventRole {
  role: EventRoleType;
}



export function getEventRole(event: Event): EventRoleType {
  return event.userEventRoles?.[0]?.role ?? "VISITOR";
}


export function getRoleRoute(role: EventRoleType): "committee" | "tenant" | "visitor" {
  if (role === "OWNER" || role === "COMMITTEE") return "committee";
  if (role === "TENANT") return "tenant";
  return "visitor";
}
