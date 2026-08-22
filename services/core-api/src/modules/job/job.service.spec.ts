import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Job, Local, Prisma } from '../../generated/prisma/client';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';

function createLocal(overrides: Partial<Local> = {}): Local {
  return {
    id: 'local-1',
    ownerId: 'owner-1',
    name: 'Restaurante Central',
    address: 'Rua Um, 100',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

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

function createPrismaMock(): {
  local: { findMany: jest.Mock; findUnique: jest.Mock };
  job: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  jobSubscription: { findMany: jest.Mock; findUnique: jest.Mock };
} {
  return {
    local: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    job: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    jobSubscription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
}

function expectedJobResponse(job: Job, local: Local, filled: boolean) {
  return {
    id: job.id,
    localId: job.localId,
    title: job.title,
    description: job.description,
    startsAt: job.startsAt,
    durationMinutes: job.durationMinutes,
    value: job.value.toFixed(2),
    createdAt: job.createdAt,
    cancelledAt: job.cancelledAt,
    filled,
    local: {
      id: local.id,
      ownerId: local.ownerId,
      name: local.name,
      address: local.address,
      city: local.city,
      state: local.state,
      zipCode: local.zipCode,
    },
  };
}

describe('JobService', () => {
  describe('create', () => {
    const dto: CreateJobDto = {
      localId: 'local-1',
      title: 'Garçom para evento',
      description: 'Atendimento de mesas durante evento corporativo',
      startsAt: '2024-02-01T18:00:00.000Z',
      durationMinutes: 240,
      value: 150,
    };

    it('creates a job when the local belongs to the owner', async () => {
      const prisma = createPrismaMock();
      const local = createLocal();
      const job = createJob();
      prisma.local.findUnique.mockResolvedValue(local);
      prisma.job.create.mockResolvedValue(job);
      const service = new JobService(prisma as unknown as PrismaProvider);

      const result = await service.create('owner-1', dto);

      expect(prisma.job.create).toHaveBeenCalledWith({
        data: {
          localId: dto.localId,
          title: dto.title,
          description: dto.description,
          startsAt: new Date(dto.startsAt),
          durationMinutes: dto.durationMinutes,
          value: dto.value,
        },
      });
      expect(result).toEqual(job);
    });

    it('throws 404 when the local does not exist', async () => {
      const prisma = createPrismaMock();
      prisma.local.findUnique.mockResolvedValue(null);
      const service = new JobService(prisma as unknown as PrismaProvider);

      await expect(service.create('owner-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 403 when the local does not belong to the owner', async () => {
      const prisma = createPrismaMock();
      const local = createLocal({ ownerId: 'another-owner' });
      prisma.local.findUnique.mockResolvedValue(local);
      const service = new JobService(prisma as unknown as PrismaProvider);

      await expect(service.create('owner-1', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('returns an empty array without querying subscriptions when there are no jobs', async () => {
      const prisma = createPrismaMock();
      prisma.job.findMany.mockResolvedValue([]);
      const service = new JobService(prisma as unknown as PrismaProvider);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(prisma.jobSubscription.findMany).not.toHaveBeenCalled();
      expect(prisma.local.findMany).not.toHaveBeenCalled();
    });

    it('returns jobs with their local summary and filled state', async () => {
      const prisma = createPrismaMock();
      const jobs = [createJob()];
      const local = createLocal();
      prisma.job.findMany.mockResolvedValue(jobs);
      prisma.jobSubscription.findMany.mockResolvedValue([]);
      prisma.local.findMany.mockResolvedValue([local]);
      const service = new JobService(prisma as unknown as PrismaProvider);

      const result = await service.findAll();

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.jobSubscription.findMany).toHaveBeenCalledWith({
        where: { jobId: { in: ['job-1'] }, deletedAt: null },
        select: { jobId: true },
      });
      expect(prisma.local.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['local-1'] } },
      });
      expect(result).toEqual([expectedJobResponse(jobs[0], local, false)]);
    });

    it('marks jobs with an active subscription as filled', async () => {
      const prisma = createPrismaMock();
      const jobs = [createJob()];
      const local = createLocal();
      prisma.job.findMany.mockResolvedValue(jobs);
      prisma.jobSubscription.findMany.mockResolvedValue([{ jobId: 'job-1' }]);
      prisma.local.findMany.mockResolvedValue([local]);
      const service = new JobService(prisma as unknown as PrismaProvider);

      const result = await service.findAll();

      expect(result).toEqual([expectedJobResponse(jobs[0], local, true)]);
    });

    it('filters jobs by localId when provided', async () => {
      const prisma = createPrismaMock();
      const jobs = [createJob()];
      prisma.job.findMany.mockResolvedValue(jobs);
      prisma.jobSubscription.findMany.mockResolvedValue([]);
      prisma.local.findMany.mockResolvedValue([createLocal()]);
      const service = new JobService(prisma as unknown as PrismaProvider);

      await service.findAll('local-1');

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: { localId: 'local-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('throws 404 when a job references a missing local', async () => {
      const prisma = createPrismaMock();
      prisma.job.findMany.mockResolvedValue([createJob()]);
      prisma.jobSubscription.findMany.mockResolvedValue([]);
      prisma.local.findMany.mockResolvedValue([]);
      const service = new JobService(prisma as unknown as PrismaProvider);

      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findManyByIds', () => {
    it('returns an empty array without querying when ids is empty', async () => {
      const prisma = createPrismaMock();
      const service = new JobService(prisma as unknown as PrismaProvider);

      const result = await service.findManyByIds([]);

      expect(result).toEqual([]);
      expect(prisma.job.findMany).not.toHaveBeenCalled();
    });

    it('returns the jobs matching the given ids', async () => {
      const prisma = createPrismaMock();
      const jobs = [createJob()];
      prisma.job.findMany.mockResolvedValue(jobs);
      const service = new JobService(prisma as unknown as PrismaProvider);

      const result = await service.findManyByIds(['job-1']);

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['job-1'] } },
      });
      expect(result).toEqual(jobs);
    });
  });

  describe('findById', () => {
    it('returns the job when it exists', async () => {
      const prisma = createPrismaMock();
      const job = createJob();
      prisma.job.findUnique.mockResolvedValue(job);
      const service = new JobService(prisma as unknown as PrismaProvider);

      const result = await service.findById('job-1');

      expect(result).toEqual(job);
    });

    it('throws 404 when the job does not exist', async () => {
      const prisma = createPrismaMock();
      prisma.job.findUnique.mockResolvedValue(null);
      const service = new JobService(prisma as unknown as PrismaProvider);

      await expect(service.findById('missing-job')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findDetailsById', () => {
    it('returns the job enriched with its local and active subscription state', async () => {
      const prisma = createPrismaMock();
      const job = createJob();
      const local = createLocal();
      prisma.job.findUnique.mockResolvedValue(job);
      prisma.local.findUnique.mockResolvedValue(local);
      prisma.jobSubscription.findUnique.mockResolvedValue({
        deletedAt: null,
      });
      const service = new JobService(prisma as unknown as PrismaProvider);

      const result = await service.findDetailsById('job-1');

      expect(prisma.jobSubscription.findUnique).toHaveBeenCalledWith({
        where: { jobId: 'job-1' },
        select: { deletedAt: true },
      });
      expect(result).toEqual(expectedJobResponse(job, local, true));
    });

    it('does not mark a job as filled when its subscription was deleted', async () => {
      const prisma = createPrismaMock();
      const job = createJob();
      const local = createLocal();
      prisma.job.findUnique.mockResolvedValue(job);
      prisma.local.findUnique.mockResolvedValue(local);
      prisma.jobSubscription.findUnique.mockResolvedValue({
        deletedAt: new Date(),
      });
      const service = new JobService(prisma as unknown as PrismaProvider);

      const result = await service.findDetailsById('job-1');

      expect(result.filled).toBe(false);
    });

    it('throws 404 when the job local cannot be found', async () => {
      const prisma = createPrismaMock();
      prisma.job.findUnique.mockResolvedValue(createJob());
      prisma.local.findUnique.mockResolvedValue(null);
      prisma.jobSubscription.findUnique.mockResolvedValue(null);
      const service = new JobService(prisma as unknown as PrismaProvider);

      await expect(service.findDetailsById('job-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('cancels the job when the local belongs to the owner', async () => {
      const prisma = createPrismaMock();
      const job = createJob();
      const local = createLocal();
      const cancelledJob = createJob({ cancelledAt: new Date() });
      prisma.job.findUnique.mockResolvedValue(job);
      prisma.local.findUnique.mockResolvedValue(local);
      prisma.job.update.mockResolvedValue(cancelledJob);
      const service = new JobService(prisma as unknown as PrismaProvider);

      const result = await service.cancel('owner-1', 'job-1');

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { cancelledAt: expect.any(Date) as Date },
      });
      expect(result).toEqual(cancelledJob);
    });

    it('throws 404 when the job does not exist', async () => {
      const prisma = createPrismaMock();
      prisma.job.findUnique.mockResolvedValue(null);
      const service = new JobService(prisma as unknown as PrismaProvider);

      await expect(service.cancel('owner-1', 'missing-job')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws 403 when the job local does not belong to the owner', async () => {
      const prisma = createPrismaMock();
      const job = createJob();
      const local = createLocal({ ownerId: 'another-owner' });
      prisma.job.findUnique.mockResolvedValue(job);
      prisma.local.findUnique.mockResolvedValue(local);
      const service = new JobService(prisma as unknown as PrismaProvider);

      await expect(service.cancel('owner-1', 'job-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws 409 when the job is already cancelled', async () => {
      const prisma = createPrismaMock();
      const job = createJob({ cancelledAt: new Date() });
      const local = createLocal();
      prisma.job.findUnique.mockResolvedValue(job);
      prisma.local.findUnique.mockResolvedValue(local);
      const service = new JobService(prisma as unknown as PrismaProvider);

      await expect(service.cancel('owner-1', 'job-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
