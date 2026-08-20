import { IsNumberString, IsOptional } from 'class-validator';

export class QueryCertificateTemplateDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  quantity?: string;
}
