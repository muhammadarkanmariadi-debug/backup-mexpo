import { EventSpeaker } from "./speaker.entity";

export interface EventRundownSpeaker {
  uuid: string;
  rundown_id: string;
  speaker_id: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  event_speaker: EventSpeaker;
}

export interface EventRundown {
  uuid: string;
  event_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  eventRundownSpeakers: EventRundownSpeaker[];
}
