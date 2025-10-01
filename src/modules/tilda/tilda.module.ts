import { Module } from '@nestjs/common';
import { TildaController } from './tilda.controller';
import { TildaService } from '../../services/tilda.service';
import { PrismaService } from '../../services/prisma.service';

@Module({
	controllers: [TildaController],
	providers: [TildaService, PrismaService],
})
export class TildaModule {}