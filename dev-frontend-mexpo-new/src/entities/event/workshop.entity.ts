import { EventSpeaker } from "./speaker.entity";

export type WorkshopBookingStatus = 'REGISTERED' | 'CHECKED_IN' | 'CANCELLED';

export interface WorkshopBooking {
  uuid: string;
  workshop_id: string;
  user_id: string;
  checkin_at: string | null;
  status: WorkshopBookingStatus;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkshopSpeaker {
  uuid: string;
  workshop_id: string;
  speaker_id: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  event_speaker: EventSpeaker;
}

export interface Workshop {
  uuid: string;
  slug?: string | null;
  event_id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  quota: number;
  is_public: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  workshopBookings: WorkshopBooking[];
  workshopSpeakers: WorkshopSpeaker[];
}
