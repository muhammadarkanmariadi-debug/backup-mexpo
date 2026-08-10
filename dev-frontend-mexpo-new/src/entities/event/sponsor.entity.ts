export type SponsorLevel = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';


export interface EventSponsor {
  uuid: string;
  event_id: string;
  name: string;
  logo: string;
  level: SponsorLevel;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}
