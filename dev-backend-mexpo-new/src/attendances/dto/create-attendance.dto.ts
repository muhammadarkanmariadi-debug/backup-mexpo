import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;
}

export class CreateWorkshopAttendance {
  @IsNotEmpty()
  @IsString()
  user_id: string;
}

export class CreateBoothAttendance {
  @IsNotEmpty()
  @IsString()
  user_id: string;
}
