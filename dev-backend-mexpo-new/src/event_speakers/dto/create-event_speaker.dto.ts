import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEventSpeakerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  bio: string;
}
