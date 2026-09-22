import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Job, Prisma } from '../../generated/prisma/client';
import { JobService } from '../job/job.service';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { RedisKeyBuilder } from '../../providers/redis/redis.key-builder';
import { RedisProvider } from '../../providers/redis/redis.provider';
import { AcceptedJobDto } from './dto/accepted-job.dto';
import { JobCandidateDto, toJobCandidateDto } from './dto/job-candidate.dto';
import {
  JobSubscriptionStatus,
  JobSubscriptionStatusDto,
} from './dto/job-subscription-status.dto';
import {
  JobSubscriptionJobData,
  JobSubscriptionPublisher,
} from './job-subscription.publisher';
import { toLocalSummary } from '../local/dto/local-summary.dto';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class JobSubscriptionService {
  constructor(
    private readonly publisher: JobSubscriptionPublisher,
    private readonly redis: RedisProvider,
    private readonly prisma: PrismaProvider,
    private readonly jobService: JobService,
  ) {}

  async applyCandidate(data: JobSubscriptionJobData): Promise<void> {
    const job = await this.jobService.findById(data.jobId);

    await this.assertJobAcceptsCandidates(job);

    try {
      await this.prisma.jobCandidate.create({
        data: { jobId: data.jobId, operatorId: data.operatorId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        return;
      }

      throw error;
    }
  }

  async findCandidateByOperator(
    jobId: string,
    operatorId: string,
  ): Promise<JobCandidateDto | null> {
    await this.jobService.findById(jobId);
    const candidate = await this.prisma.jobCandidate.findUnique({
      where: { jobId_operatorId: { jobId, operatorId } },
    });

    return candidate ? toJobCandidateDto(candidate) : null;
  }

  async listCandidates(
    jobId: string,
    ownerId: string,
  ): Promise<JobCandidateDto[]> {
    const job = await this.jobService.findById(jobId);
    await this.assertLocalOwnership(job.localId, ownerId);

    const candidates = await this.prisma.jobCandidate.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    });

    return candidates.map(toJobCandidateDto);
  }

  async confirmCandidate(
    jobId: string,
    operatorId: string,
    ownerId: string,
  ): Promise<void> {
    const job = await this.jobService.findById(jobId);

    await this.assertLocalOwnership(job.localId, ownerId);
    await this.assertJobAcceptsCandidates(job);

    const candidate = await this.prisma.jobCandidate.findUnique({
      where: { jobId_operatorId: { jobId, operatorId } },
    });

    if (!candidate || candidate.status !== 'PENDING') {
      throw new NotFoundException({
        code: 'JOB_CANDIDATE_NOT_FOUND',
        message: 'Candidatura não encontrada ou já decidida',
      });
    }

    await this.publisher.publish({ jobId, operatorId });
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

  private async assertJobAcceptsCandidates(job: Job): Promise<void> {
    if (job.cancelledAt) {
      throw new ConflictException({
        code: 'JOB_CANCELLED',
        message: 'Vaga cancelada não pode ser aceita',
      });
    }

    const subscription = await this.prisma.jobSubscription.findUnique({
      where: { jobId: job.id },
      select: { deletedAt: true },
    });

    if (subscription && !subscription.deletedAt) {
      throw new ConflictException({
        code: 'JOB_ALREADY_FILLED',
        message: 'Vaga já foi preenchida',
      });
    }
  }

  private async assertLocalOwnership(
    localId: string,
    ownerId: string,
  ): Promise<void> {
    const local = await this.prisma.local.findUnique({
      where: { id: localId },
    });

    if (!local || local.ownerId !== ownerId) {
      throw new ForbiddenException({
        code: 'LOCAL_NOT_OWNED',
        message: 'Local não pertence ao usuário autenticado',
      });
    }
  }
}
