import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemSouvenirDto {
  /** The catalog item (`souvenir_rules.tiers[].id`) the visitor redeems. */
  @IsNotEmpty()
  @IsString()
  tier_id: string;
}
