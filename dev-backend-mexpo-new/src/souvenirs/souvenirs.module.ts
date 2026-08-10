import { Module } from '@nestjs/common';
import { SouvenirsService } from './souvenirs.service';
import { SouvenirsController } from './souvenirs.controller';

@Module({
  controllers: [SouvenirsController],
  providers: [SouvenirsService],
})
export class SouvenirsModule {}
