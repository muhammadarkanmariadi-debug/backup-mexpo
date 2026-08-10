import { PartialType } from '@nestjs/mapped-types';
import { CreateSouvenirDto } from './create-souvenir.dto';

export class UpdateSouvenirDto extends PartialType(CreateSouvenirDto) {}
