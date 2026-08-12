import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SUBSCRIPTION_QUEUE } from './bullmq.queues';

const redisUrl = new URL(process.env.REDIS_URL as string);

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port),
        password: redisUrl.password || undefined,
      },
    }),
    BullModule.registerQueue({
      name: SUBSCRIPTION_QUEUE,
      defaultJobOptions: {
        removeOnComplete: true,
      },
    }),
  ],
  exports: [BullModule],
})
export class BullmqModule {}
