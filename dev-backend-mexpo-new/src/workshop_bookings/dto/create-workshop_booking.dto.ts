import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkshopBookingDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;
}
