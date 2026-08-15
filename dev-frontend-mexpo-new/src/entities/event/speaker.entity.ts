export interface EventSpeaker {
  uuid: string;
  event_id: string;
  name: string;
  bio: string;
  photo: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}
