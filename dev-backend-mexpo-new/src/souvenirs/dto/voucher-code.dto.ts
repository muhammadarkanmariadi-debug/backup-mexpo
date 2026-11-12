import { IsNotEmpty, IsString } from 'class-validator';

/** The redemption voucher scanned or typed at the counter (`SV-XXXXXXXXXX`). */
export class VoucherCodeDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
