import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  Job,
  JobCandidate,
  JobSubscription,
  Local,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { RedisProvider } from '../../providers/redis/redis.provider';
import { JobService } from '../job/job.service';
import { JobSubscriptionStatus } from './dto/job-subscription-status.dto';
import { JobCandidateStatus } from './dto/job-candidate.dto';
import { JobSubscriptionPublisher } from './job-subscription.publisher';
import { JobSubscriptionService } from './job-subscription.service';

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    localId: 'local-1',
    title: 'Garçom para evento',
    description: 'Atendimento de mesas durante evento corporativo',
    startsAt: new Date('2024-02-01T18:00:00.000Z'),
    durationMinutes: 240,
    value: new Prisma.Decimal(150),
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    cancelledAt: null,
    ...overrides,
  };
}

function createSubscription(
  overrides: Partial<JobSubscription> = {},
): JobSubscription {
  return {
    id: 'subscription-1',
    jobId: 'job-1',
    operatorId: 'operator-1',
    createdAt: new Date('2024-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function createCandidate(overrides: Partial<JobCandidate> = {}): JobCandidate {
  return {
    id: 'candidate-1',
    jobId: 'job-1',
    operatorId: 'operator-1',
    status: 'PENDING',
    createdAt: new Date('2024-01-01T12:00:00.000Z'),
    updatedAt: new Date('2024-01-01T12:00:00.000Z'),
    ...overrides,
  };
}

function createLocal(overrides: Partial<Local> = {}): Local {
  return {
    id: 'local-1',
    ownerId: 'owner-1',
    name: 'Restaurante Central',
    address: 'Rua Um, 100',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
    latitude: null,
    longitude: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createDeps(): {
  publisher: { publish: jest.Mock };
  redis: { get: jest.Mock };
  prisma: {
    jobSubscription: { findUnique: jest.Mock; findMany: jest.Mock };
    jobCandidate: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    local: { findUnique: jest.Mock; findMany: jest.Mock };
  };
  jobService: { findById: jest.Mock; findManyByIds: jest.Mock };
} {
  return {
    publisher: { publish: jest.fn() },
    redis: { get: jest.fn() },
    prisma: {
      jobSubscription: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      jobCandidate: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      local: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    },
    jobService: {
      findById: jest.fn(),
      findManyByIds: jest.fn(),
    },
  };
}

function createService(deps: ReturnType<typeof createDeps>) {
  return new JobSubscriptionService(
    deps.publisher as unknown as JobSubscriptionPublisher,
    deps.redis as unknown as RedisProvider,
    deps.prisma as unknown as PrismaProvider,
    deps.jobService as unknown as JobService,
  );
}

describe('JobSubscriptionService', () => {
  describe('applyCandidate', () => {
    it('creates the candidacy when the job accepts candidates', async () => {
      const deps = createDeps();
      deps.jobService.findById.mockResolvedValue(createJob());
      deps.prisma.jobSubscription.findUnique.mockResolvedValue(null);
      const service = createService(deps);
      const data = { jobId: 'job-1', operatorId: 'operator-1' };

      await service.applyCandidate(data);

      expect(deps.prisma.jobCandidate.create).toHaveBeenCalledWith({
        data,
      });
    });

    it('throws 409 and does not create a candidacy when the job was cancelled', async () => {
      const deps = createDeps();
      deps.jobService.findById.mockResolvedValue(
        createJob({ cancelledAt: new Date() }),
      );
      const service = createService(deps);
      const data = { jobId: 'job-1', operatorId: 'operator-1' };

      await expect(service.applyCandidate(data)).rejects.toThrow(
        ConflictException,
      );
      expect(deps.prisma.jobCandidate.create).not.toHaveBeenCalled();
    });

    it('throws 409 and does not create a candidacy when the job is already filled', async () => {
      const deps = createDeps();
      deps.jobService.findById.mockResolvedValue(createJob());
      deps.prisma.jobSubscription.findUnique.mockResolvedValue({
        deletedAt: null,
      });
      const service = createService(deps);
      const data = { jobId: 'job-1', operatorId: 'operator-1' };

      await expect(service.applyCandidate(data)).rejects.toThrow(
        ConflictException,
      );
      expect(deps.prisma.jobCandidate.create).not.toHaveBeenCalled();
    });

    it('is idempotent when the operator already applied', async () => {
      const deps = createDeps();
      deps.jobService.findById.mockResolvedValue(createJob());
      deps.prisma.jobSubscription.findUnique.mockResolvedValue(null);
      deps.prisma.jobCandidate.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );
      const service = createService(deps);
      const data = { jobId: 'job-1', operatorId: 'operator-1' };

      await expect(service.applyCandidate(data)).resolves.toBeUndefined();
    });
  });

  describe('listCandidates', () => {
    it('throws 403 when the local does not belong to the owner', async () => {
      const deps = createDeps();
      deps.jobService.findById.mockResolvedValue(createJob());
      deps.prisma.local.findUnique.mockResolvedValue(
        createLocal({ ownerId: 'someone-else' }),
      );
      const service = createService(deps);

      await expect(service.listCandidates('job-1', 'owner-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns the candidates mapped to the API status', async () => {
      const deps = createDeps();
      deps.jobService.findById.mockResolvedValue(createJob());
      deps.prisma.local.findUnique.mockResolvedValue(createLocal());
      deps.prisma.jobCandidate.findMany.mockResolvedValue([
        createCandidate({ status: 'REJECTED', operatorId: 'operator-2' }),
      ]);
      const service = createService(deps);

      const result = await service.listCandidates('job-1', 'owner-1');

      expect(result).toEqual([
        {
          operatorId: 'operator-2',
          status: JobCandidateStatus.REJECTED,
          createdAt: expect.any(Date) as Date,
        },
      ]);
    });
  });

  describe('confirmCandidate', () => {
    it('throws 403 when the local does not belong to the owner', async () => {
      const deps = createDeps();
      deps.jobService.findById.mockResolvedValue(createJob());
      deps.prisma.local.findUnique.mockResolvedValue(
        createLocal({ ownerId: 'someone-else' }),
      );
      const service = createService(deps);

      await expect(
        service.confirmCandidate('job-1', 'operator-1', 'owner-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(deps.publisher.publish).not.toHaveBeenCalled();
    });

    it('throws 409 when the job is already filled', async () => {
      const deps = createDeps();
      deps.jobService.findById.mockResolvedValue(createJob());
      deps.prisma.local.findUnique.mockResolvedValue(createLocal());
      deps.prisma.jobSubscription.findUnique.mockResolvedValue({
        deletedAt: null,
      });
      const service = createService(deps);

      await expect(
        service.confirmCandidate('job-1', 'operator-1', 'owner-1'),
      ).rejects.toThrow(ConflictException);
      expect(deps.publisher.publish).not.toHaveBeenCalled();
    });

    it('throws 404 when the candidacy does not exist or was already decided', async () => {
      const deps = createDeps();
      deps.jobService.findById.mockResolvedValue(createJob());
      deps.prisma.local.findUnique.mockResolvedValue(createLocal());
      deps.prisma.jobSubscription.findUnique.mockResolvedValue(null);
      deps.prisma.jobCandidate.findUnique.mockResolvedValue(
        createCandidate({ status: 'REJECTED' }),
      );
      const service = createService(deps);

      await expect(
        service.confirmCandidate('job-1', 'operator-1', 'owner-1'),
      ).rejects.toThrow(NotFoundException);
      expect(deps.publisher.publish).not.toHaveBeenCalled();
    });

    it('publishes the confirmation when the candidacy is pending', async () => {
      const deps = createDeps();
      deps.jobService.findById.mockResolvedValue(createJob());
      deps.prisma.local.findUnique.mockResolvedValue(createLocal());
      deps.prisma.jobSubscription.findUnique.mockResolvedValue(null);
      deps.prisma.jobCandidate.findUnique.mockResolvedValue(createCandidate());
      const service = createService(deps);

      await service.confirmCandidate('job-1', 'operator-1', 'owner-1');

      expect(deps.publisher.publish).toHaveBeenCalledWith({
        jobId: 'job-1',
        operatorId: 'operator-1',
      });
    });
  });

  describe('getAcceptStatus', () => {
    it('returns finished with the winner from the redis cache', async () => {
      const deps = createDeps();
      deps.redis.get.mockResolvedValue('operator-1');
      const service = createService(deps);

      const result = await service.getAcceptStatus('job-1');

      expect(result).toEqual({
        status: JobSubscriptionStatus.FINISHED,
        operatorId: 'operator-1',
      });
      expect(deps.prisma.jobSubscription.findUnique).not.toHaveBeenCalled();
    });

    it('falls back to postgres when there is no cached winner', async () => {
      const deps = createDeps();
      deps.redis.get.mockResolvedValue(null);
      deps.prisma.jobSubscription.findUnique.mockResolvedValue(
        createSubscription(),
      );
      const service = createService(deps);

      const result = await service.getAcceptStatus('job-1');

      expect(result).toEqual({
        status: JobSubscriptionStatus.FINISHED,
        operatorId: 'operator-1',
      });
    });

    it('returns pending when there is no winner in redis or postgres', async () => {
      const deps = createDeps();
      deps.redis.get.mockResolvedValue(null);
      deps.prisma.jobSubscription.findUnique.mockResolvedValue(null);
      const service = createService(deps);

      const result = await service.getAcceptStatus('job-1');

      expect(result).toEqual({ status: JobSubscriptionStatus.PENDING });
    });
  });

  describe('findAcceptedByOperator', () => {
    it('returns an empty array without looking up jobs when there are no subscriptions', async () => {
      const deps = createDeps();
      deps.prisma.jobSubscription.findMany.mockResolvedValue([]);
      const service = createService(deps);

      const result = await service.findAcceptedByOperator('operator-1');

      expect(result).toEqual([]);
      expect(deps.jobService.findManyByIds).not.toHaveBeenCalled();
      expect(deps.prisma.local.findMany).not.toHaveBeenCalled();
    });

    it('returns accepted jobs with subscription and local data', async () => {
      const deps = createDeps();
      const subscription = createSubscription();
      const job = createJob();
      const local = createLocal();
      deps.prisma.jobSubscription.findMany.mockResolvedValue([subscription]);
      deps.jobService.findManyByIds.mockResolvedValue([job]);
      deps.prisma.local.findMany.mockResolvedValue([local]);
      const service = createService(deps);

      const result = await service.findAcceptedByOperator('operator-1');

      expect(deps.jobService.findManyByIds).toHaveBeenCalledWith(['job-1']);
      expect(deps.prisma.local.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['local-1'] } },
      });
      expect(result).toEqual([
        {
          jobId: job.id,
          title: job.title,
          description: job.description,
          startsAt: job.startsAt,
          durationMinutes: job.durationMinutes,
          value: '150.00',
          localId: job.localId,
          local: {
            id: local.id,
            ownerId: local.ownerId,
            name: local.name,
            address: local.address,
            city: local.city,
            state: local.state,
            zipCode: local.zipCode,
            latitude: local.latitude,
            longitude: local.longitude,
          },
          cancelledAt: null,
          acceptedAt: subscription.createdAt,
        },
      ]);
    });

    it('skips subscriptions whose job could not be found', async () => {
      const deps = createDeps();
      const subscription = createSubscription({ jobId: 'missing-job' });
      deps.prisma.jobSubscription.findMany.mockResolvedValue([subscription]);
      deps.jobService.findManyByIds.mockResolvedValue([]);
      const service = createService(deps);

      const result = await service.findAcceptedByOperator('operator-1');

      expect(result).toEqual([]);
      expect(deps.prisma.local.findMany).not.toHaveBeenCalled();
    });

    it('throws 404 when an accepted job references a missing local', async () => {
      const deps = createDeps();
      deps.prisma.jobSubscription.findMany.mockResolvedValue([
        createSubscription(),
      ]);
      deps.jobService.findManyByIds.mockResolvedValue([createJob()]);
      deps.prisma.local.findMany.mockResolvedValue([]);
      const service = createService(deps);

      await expect(
        service.findAcceptedByOperator('operator-1'),
      ).rejects.toThrow('Local não encontrado');
    });
  });
});
