import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSouvenirDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  /** Point mode: chosen souvenir tier id (defaults to the highest unlocked). */
  @IsOptional()
  @IsString()
  tier_id?: string;
}
