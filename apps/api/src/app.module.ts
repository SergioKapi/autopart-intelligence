import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PartsModule } from './modules/parts/parts.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { SearchModule } from './modules/search/search.module';
import { CompatibilityModule } from './modules/compatibility/compatibility.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    PartsModule,
    VehiclesModule,
    SearchModule,
    CompatibilityModule,
  ],
})
export class AppModule {}
