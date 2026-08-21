import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Local } from '../../generated/prisma/client';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { LocalService } from './local.service';
import { CreateLocalDto } from './dto/create-local.dto';

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

function createPrismaMock(): {
  local: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
} {
  return {
    local: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
}

describe('LocalService', () => {
  describe('create', () => {
    it('creates a local owned by the authenticated user', async () => {
      const prisma = createPrismaMock();
      const local = createLocal();
      prisma.local.create.mockResolvedValue(local);
      const service = new LocalService(prisma as unknown as PrismaProvider);
      const dto: CreateLocalDto = {
        name: local.name,
        address: local.address,
        city: local.city,
        state: local.state,
        zipCode: local.zipCode,
      };

      const result = await service.create('owner-1', dto);

      expect(prisma.local.create).toHaveBeenCalledWith({
        data: { ownerId: 'owner-1', ...dto },
      });
      expect(result).toEqual(local);
    });
  });

  describe('findAllByOwner', () => {
    it('returns the locals belonging to the owner', async () => {
      const prisma = createPrismaMock();
      const locals = [createLocal()];
      prisma.local.findMany.mockResolvedValue(locals);
      const service = new LocalService(prisma as unknown as PrismaProvider);

      const result = await service.findAllByOwner('owner-1');

      expect(prisma.local.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'owner-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(locals);
    });
  });

  describe('findById', () => {
    it('returns the local when it belongs to the owner', async () => {
      const prisma = createPrismaMock();
      const local = createLocal();
      prisma.local.findUnique.mockResolvedValue(local);
      const service = new LocalService(prisma as unknown as PrismaProvider);

      const result = await service.findById('local-1', 'owner-1');

      expect(result).toEqual(local);
    });

    it('throws 404 when the local does not exist', async () => {
      const prisma = createPrismaMock();
      prisma.local.findUnique.mockResolvedValue(null);
      const service = new LocalService(prisma as unknown as PrismaProvider);

      await expect(
        service.findById('missing-local', 'owner-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 403 when the local belongs to another owner', async () => {
      const prisma = createPrismaMock();
      const local = createLocal({ ownerId: 'another-owner' });
      prisma.local.findUnique.mockResolvedValue(local);
      const service = new LocalService(prisma as unknown as PrismaProvider);

      await expect(service.findById('local-1', 'owner-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
