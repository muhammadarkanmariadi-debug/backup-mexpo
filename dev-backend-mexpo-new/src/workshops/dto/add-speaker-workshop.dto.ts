import { IsNotEmpty, IsString } from 'class-validator';

export class AddSpeakerWorkshopDto {
  @IsNotEmpty()
  @IsString()
  speaker_id: string;
}
