import { Injectable } from '@nestjs/common';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { RedisKeyBuilder } from '../../providers/redis/redis.key-builder';
import { RedisProvider } from '../../providers/redis/redis.provider';
import {
  JobSubscriptionStatus,
  JobSubscriptionStatusDto,
} from './dto/job-subscription-status.dto';
import {
  JobSubscriptionJobData,
  JobSubscriptionPublisher,
} from './job-subscription.publisher';

@Injectable()
export class JobSubscriptionService {
  constructor(
    private readonly publisher: JobSubscriptionPublisher,
    private readonly redis: RedisProvider,
    private readonly prisma: PrismaProvider,
  ) {}

  async schedule(data: JobSubscriptionJobData): Promise<void> {
    await this.publisher.publish(data);
  }

  async getAcceptStatus(jobId: string): Promise<JobSubscriptionStatusDto> {
    const jobOperatorKey = RedisKeyBuilder.getJobOperatorKey(jobId);
    const cachedOperatorId = await this.redis.get(jobOperatorKey);

    if (cachedOperatorId) {
      return {
        status: JobSubscriptionStatus.FINISHED,
        operatorId: cachedOperatorId,
      };
    }

    const subscription = await this.prisma.jobSubscription.findUnique({
      where: { jobId },
    });

    if (subscription) {
      return {
        status: JobSubscriptionStatus.FINISHED,
        operatorId: subscription.operatorId,
      };
    }

    return { status: JobSubscriptionStatus.PENDING, operatorId: '' };
  }
}
