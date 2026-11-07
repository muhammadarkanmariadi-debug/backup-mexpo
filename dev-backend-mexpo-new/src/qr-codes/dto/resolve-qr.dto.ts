import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResolveQrDto {
  @IsNotEmpty()
  @IsString()
  code_data: string;

  @IsOptional()
  @IsString()
  event_id?: string;
}
