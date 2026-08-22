import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobService } from '../job/job.service';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { RedisKeyBuilder } from '../../providers/redis/redis.key-builder';
import { RedisProvider } from '../../providers/redis/redis.provider';
import { AcceptedJobDto } from './dto/accepted-job.dto';
import {
  JobSubscriptionStatus,
  JobSubscriptionStatusDto,
} from './dto/job-subscription-status.dto';
import {
  JobSubscriptionJobData,
  JobSubscriptionPublisher,
} from './job-subscription.publisher';
import { toLocalSummary } from '../local/dto/local-summary.dto';

@Injectable()
export class JobSubscriptionService {
  constructor(
    private readonly publisher: JobSubscriptionPublisher,
    private readonly redis: RedisProvider,
    private readonly prisma: PrismaProvider,
    private readonly jobService: JobService,
  ) {}

  async schedule(data: JobSubscriptionJobData): Promise<void> {
    const job = await this.jobService.findById(data.jobId);

    if (job.cancelledAt) {
      throw new ConflictException({
        code: 'JOB_CANCELLED',
        message: 'Vaga cancelada não pode ser aceita',
      });
    }

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

    return { status: JobSubscriptionStatus.PENDING };
  }

  async findAcceptedByOperator(operatorId: string): Promise<AcceptedJobDto[]> {
    const subscriptions = await this.prisma.jobSubscription.findMany({
      where: { operatorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (subscriptions.length === 0) {
      return [];
    }

    const jobs = await this.jobService.findManyByIds(
      subscriptions.map((subscription) => subscription.jobId),
    );

    if (jobs.length === 0) {
      return [];
    }

    const jobsById = new Map(jobs.map((job) => [job.id, job]));
    const locals = await this.prisma.local.findMany({
      where: { id: { in: [...new Set(jobs.map((job) => job.localId))] } },
    });
    const localsById = new Map(locals.map((local) => [local.id, local]));

    return subscriptions.flatMap((subscription) => {
      const job = jobsById.get(subscription.jobId);

      if (!job) {
        return [];
      }

      const local = localsById.get(job.localId);

      if (!local) {
        throw new NotFoundException({
          code: 'LOCAL_NOT_FOUND',
          message: 'Local não encontrado',
        });
      }

      return [
        {
          jobId: job.id,
          title: job.title,
          description: job.description,
          startsAt: job.startsAt,
          durationMinutes: job.durationMinutes,
          value: job.value.toFixed(2),
          localId: job.localId,
          local: toLocalSummary(local),
          cancelledAt: job.cancelledAt,
          acceptedAt: subscription.createdAt,
        },
      ];
    });
  }
}
