import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { JobCandidateDto } from './dto/job-candidate.dto';
import { JobSubscriptionStatusDto } from './dto/job-subscription-status.dto';
import { JobSubscriptionService } from './job-subscription.service';

@Controller('jobs')
export class JobSubscriptionController {
  constructor(
    private readonly jobSubscriptionService: JobSubscriptionService,
  ) {}

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('operator')
  async applyCandidate(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.jobSubscriptionService.applyCandidate({
      jobId,
      operatorId: request.user.userId,
    });
  }

  @Get(':id/candidates/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('operator')
  async getOwnCandidate(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<JobCandidateDto | null> {
    return this.jobSubscriptionService.findCandidateByOperator(
      jobId,
      request.user.userId,
    );
  }

  @Get(':id/candidates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('local_owner')
  async listCandidates(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<JobCandidateDto[]> {
    return this.jobSubscriptionService.listCandidates(
      jobId,
      request.user.userId,
    );
  }

  @Post(':id/candidates/:operatorId/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('local_owner')
  async confirmCandidate(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Param('operatorId', ParseUUIDPipe) operatorId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.jobSubscriptionService.confirmCandidate(
      jobId,
      operatorId,
      request.user.userId,
    );
  }

  @Get(':id/accepted')
  async getAcceptStatus(
    @Param('id', ParseUUIDPipe) jobId: string,
  ): Promise<JobSubscriptionStatusDto> {
    return this.jobSubscriptionService.getAcceptStatus(jobId);
  }
}
