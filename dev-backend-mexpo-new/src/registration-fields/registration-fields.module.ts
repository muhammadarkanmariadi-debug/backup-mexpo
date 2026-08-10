import { Module } from '@nestjs/common';
import { RegistrationFieldsController } from './registration-fields.controller';
import { RegistrationFieldsService } from './registration-fields.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RegistrationFieldsController],
  providers: [RegistrationFieldsService],
})
export class RegistrationFieldsModule {}
