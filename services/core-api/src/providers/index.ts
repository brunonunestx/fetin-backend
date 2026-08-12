import { Type } from '@nestjs/common';
import { BullmqModule } from './bullmq/bullmq.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

export const providers: Type[] = [PrismaModule, RedisModule, BullmqModule];
