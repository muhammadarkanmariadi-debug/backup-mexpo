import { BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateWorkshopBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
