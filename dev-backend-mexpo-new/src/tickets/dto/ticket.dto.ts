import { TicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/** Visitor buying/registering a ticket (A1). */
export class BuyTicketDto {
  @IsOptional()
  @IsString()
  ticket_type_id?: string;

  @IsOptional()
  @IsString()
  payment_reference?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;
}

/** Owner confirming/cancelling a ticket. */
export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  payment_reference?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;
}
