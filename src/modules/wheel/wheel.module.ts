import { Module } from '@nestjs/common';
import { WheelController } from './wheel.controller';
import { MandatoryPrizesController } from './mandatory-prizes.controller';
import { WheelService } from '../../services/wheel.service';
import { PrismaService } from '../../services/prisma.service';
import { RedisService } from '../../services/redis.service';
import { MandatoryPrizesService } from '../../services/mandatory-prizes.service';

@Module({
  controllers: [WheelController, MandatoryPrizesController],
  providers: [WheelService, PrismaService, RedisService, MandatoryPrizesService],
})
export class WheelModule {}