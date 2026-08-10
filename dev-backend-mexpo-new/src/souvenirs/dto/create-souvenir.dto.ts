import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSouvenirDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;
}
