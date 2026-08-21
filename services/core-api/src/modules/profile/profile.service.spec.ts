import { NotFoundException } from '@nestjs/common';
import { Prisma, User, UserType } from '../../generated/prisma/client';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { ProfileService } from './profile.service';

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'operator@example.com',
    passwordHash: 'hash',
    type: UserType.operator,
    name: 'Operator One',
    age: 25,
    phone: '+5511999999999',
    position: 'Garçom',
    bio: 'Bio',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createPrismaMock(): {
  user: { findUnique: jest.Mock; update: jest.Mock };
} {
  return {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('ProfileService', () => {
  describe('getProfile', () => {
    it('returns the mapped profile when the user exists', async () => {
      const prisma = createPrismaMock();
      const user = createUser();
      prisma.user.findUnique.mockResolvedValue(user);
      const service = new ProfileService(prisma as unknown as PrismaProvider);

      const result = await service.getProfile('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        type: user.type,
        name: user.name,
        age: user.age,
        phone: user.phone,
        position: user.position,
        bio: user.bio,
        createdAt: user.createdAt,
      });
    });

    it('throws 404 when the user does not exist', async () => {
      const prisma = createPrismaMock();
      prisma.user.findUnique.mockResolvedValue(null);
      const service = new ProfileService(prisma as unknown as PrismaProvider);

      await expect(service.getProfile('missing-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('returns the mapped profile after a successful update', async () => {
      const prisma = createPrismaMock();
      const updated = createUser({ name: 'New Name' });
      prisma.user.update.mockResolvedValue(updated);
      const service = new ProfileService(prisma as unknown as PrismaProvider);

      const result = await service.updateProfile('user-1', {
        name: 'New Name',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          name: 'New Name',
          age: undefined,
          phone: undefined,
          position: undefined,
          bio: undefined,
        },
      });
      expect(result.name).toBe('New Name');
    });

    it('throws 404 when Prisma reports the record was not found', async () => {
      const prisma = createPrismaMock();
      prisma.user.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '7.9.1',
        }),
      );
      const service = new ProfileService(prisma as unknown as PrismaProvider);

      await expect(
        service.updateProfile('missing-user', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rethrows unexpected errors instead of swallowing them', async () => {
      const prisma = createPrismaMock();
      const unexpectedError = new Error('connection lost');
      prisma.user.update.mockRejectedValue(unexpectedError);
      const service = new ProfileService(prisma as unknown as PrismaProvider);

      await expect(
        service.updateProfile('user-1', { name: 'New Name' }),
      ).rejects.toThrow(unexpectedError);
    });
  });
});
