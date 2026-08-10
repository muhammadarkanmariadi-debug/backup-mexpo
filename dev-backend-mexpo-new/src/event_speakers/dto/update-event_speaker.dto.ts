import { IsOptional, IsString } from 'class-validator';

export class UpdateEventSpeakerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
