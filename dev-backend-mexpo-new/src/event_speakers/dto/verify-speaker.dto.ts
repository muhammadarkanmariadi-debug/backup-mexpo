import { SpeakerStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class VerifySpeakerDto {
  @IsNotEmpty()
  @IsEnum(SpeakerStatus)
  status: SpeakerStatus;
}
