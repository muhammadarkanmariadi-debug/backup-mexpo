import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicApiDto } from './create-public-api.dto';

export class UpdatePublicApiDto extends PartialType(CreatePublicApiDto) {}
