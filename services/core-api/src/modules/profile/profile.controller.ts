import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(
    @Req() request: AuthenticatedRequest,
  ): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(request.user.userId);
  }

  @Patch()
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profileService.updateProfile(request.user.userId, body);
  }
}
