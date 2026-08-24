import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class QueryCertificateTemplateDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  quantity?: string;

  @IsOptional()
  @IsString()
  kind?: string;
}
