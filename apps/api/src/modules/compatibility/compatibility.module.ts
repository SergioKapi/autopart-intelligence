import { Module } from '@nestjs/common';
import { CompatibilityService } from './compatibility.service';
import { CompatibilityController } from './compatibility.controller';

@Module({
  controllers: [CompatibilityController],
  providers: [CompatibilityService],
})
export class CompatibilityModule {}
