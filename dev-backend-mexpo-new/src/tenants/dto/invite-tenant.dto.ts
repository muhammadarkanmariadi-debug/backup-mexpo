import { IsEmail, IsNotEmpty } from 'class-validator';

export class InviteTenantDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
