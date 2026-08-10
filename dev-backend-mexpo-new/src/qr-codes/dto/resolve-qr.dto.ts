import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveQrDto {
  @IsNotEmpty()
  @IsString()
  code_data: string;
}
