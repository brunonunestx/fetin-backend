import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '../../generated/prisma/client';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const RECORD_NOT_FOUND = 'P2025';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaProvider) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado',
      });
    }

    return this.toProfileResponse(user);
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          age: data.age,
          phone: data.phone,
          position: data.position,
          bio: data.bio,
        },
      });

      return this.toProfileResponse(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === RECORD_NOT_FOUND
      ) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado',
        });
      }

      throw error;
    }
  }

  private toProfileResponse(user: User): ProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      type: user.type,
      name: user.name,
      age: user.age,
      phone: user.phone,
      position: user.position,
      bio: user.bio,
      createdAt: user.createdAt,
    };
  }
}
