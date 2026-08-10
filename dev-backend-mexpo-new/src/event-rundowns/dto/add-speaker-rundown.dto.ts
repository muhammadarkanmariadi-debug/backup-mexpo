import { IsNotEmpty, IsString } from 'class-validator';

export class AddSpeakerRundownDto {
  @IsNotEmpty()
  @IsString()
  speaker_id: string;
}
