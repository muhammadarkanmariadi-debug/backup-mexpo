import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { SpeakerStatus } from '@prisma/client';

export class QueryEventSpeakerDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SpeakerStatus)
  status?: SpeakerStatus;
}
